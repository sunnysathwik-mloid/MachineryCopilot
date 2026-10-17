import os
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from services.audio_service import get_or_generate_audio, AUDIO_CACHE_DIR
from services.vision_service import vision_service
from services.judge_service import judge_service

app = FastAPI(
    title="MachineryCopilot API",
    description="Centrifugal Pump Vernacular Diagnostic Assistant — Manual-Grounded + LLM-as-Judge",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve pre-generated and dynamic audio files
app.mount("/audio", StaticFiles(directory=str(AUDIO_CACHE_DIR)), name="audio")

# In-memory 3-turn conversational context (simulated state management)
SESSION_HISTORY: List[Dict[str, Any]] = []


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class JudgeCriteriaScores(BaseModel):
    manual_grounding: float
    safety_compliance: float
    step_completeness: float
    vernacular_accuracy: float

class JudgeResult(BaseModel):
    criteria_scores: JudgeCriteriaScores
    overall_score: float
    verdict: str          # "PASS" | "NEEDS_REVIEW"
    judge_reasoning: str
    corrective_notes: str
    retry_count: int = 0
    original_score: Optional[float] = None
    self_healing_applied: bool = False
    judge_source: str = "gemini_1.5_flash"

class DiagnoseResponse(BaseModel):
    equipment_type: str
    fault_id: str
    detected_anomaly: str
    severity: str
    safety_lockout_required: bool
    confidence_score: float
    manual_section_referenced: str
    diagnostic_steps: List[str]
    vernacular_text: str
    vernacular_audio_url: str
    audio_source: str
    rag_delay_ms: int
    judge: JudgeResult
    context_turn_count: int
    session_history: List[Dict[str, Any]]


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "MachineryCopilot v2 — Pump Specialist",
        "pipeline": "Generator → Judge → Audio",
        "cached_audio_files": len(list(AUDIO_CACHE_DIR.glob("*.mp3"))),
        "session_turns": len(SESSION_HISTORY)
    }


@app.get("/history")
def get_session_history():
    return {
        "context_limit": 3,
        "count": len(SESSION_HISTORY),
        "history": SESSION_HISTORY
    }


@app.delete("/history")
def reset_session_history():
    global SESSION_HISTORY
    SESSION_HISTORY.clear()
    return {"message": "Session context reset."}


@app.get("/manual")
def get_pump_manual():
    """Returns the injected pump manual for transparency (great for demos)."""
    from services.vision_service import get_pump_manual
    return get_pump_manual()


@app.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose_pump(
    image: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    language: str = Form("ta")  # Default: Tamil
):
    """
    3-Stage Pipeline:
    1. [1.5s delay] Stage 1 — Generator: Gemini Vision analyzes photo
                   grounded by the full pump manual injected into the prompt.
    2. Stage 2 — Judge: Second Gemini call evaluates the response against
                   the manual on 4 criteria (grounding, safety, completeness, vernacular).
    3. Stage 3 — Audio: Pre-cached MP3 first, gTTS fallback.
    """
    global SESSION_HISTORY

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file.")

    # ── 1.5s deliberate RAG scan illusion ──
    await asyncio.sleep(1.5)

    # ── Stage 1: Generator ──
    diagnosis = await vision_service.analyze_pump(
        image_bytes=image_bytes,
        user_notes=notes,
        language=language
    )

    # ── Stage 2: Initial Judge Evaluation ──
    judge_result = await judge_service.judge_diagnosis(diagnosis, language)

    # ── Critique & Self-Correction Retry Loop ──
    # If LLM Judge fails (verdict is NEEDS_REVIEW or score < 7.0), trigger self-correction retry
    retry_count = 0
    original_score = None
    self_healing_applied = False

    if judge_result.get("verdict") == "NEEDS_REVIEW" or judge_result.get("overall_score", 10.0) < 7.0:
        retry_count = 1
        original_score = judge_result.get("overall_score")
        corrective_feedback = judge_result.get("corrective_notes") or "Ensure full LOTO compliance and all manual repair steps."
        print(f"[Self-Healing] Judge verdict NEEDS_REVIEW (Score: {original_score}). Retrying with critique feedback: {corrective_feedback}")

        # Refine diagnosis based on Judge critique
        refined_diagnosis = await vision_service.refine_pump_diagnosis(
            previous_diagnosis=diagnosis,
            corrective_notes=corrective_feedback,
            language=language
        )

        # Re-judge refined diagnosis
        rejudge_result = await judge_service.judge_diagnosis(refined_diagnosis, language)
        print(f"[Self-Healing] Re-judge complete: Score {original_score} -> {rejudge_result.get('overall_score')} ({rejudge_result.get('verdict')})")

        diagnosis = refined_diagnosis
        judge_result = rejudge_result
        self_healing_applied = True

    # ── Stage 3: Audio Generation ──
    audio_filename, audio_rel_url, is_pregenerated = await asyncio.to_thread(
        get_or_generate_audio,
        diagnosis.get("vernacular_audio_script", "Follow safety protocol."),
        language,
        "step_1"
    )

    full_audio_url = f"http://localhost:8000{audio_rel_url}"

    # ── Session State (last 3 turns) ──
    turn = {
        "turn": len(SESSION_HISTORY) + 1,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "query": notes or "Image inspection",
        "language": language,
        "fault": diagnosis.get("detected_anomaly"),
        "severity": diagnosis.get("severity"),
        "judge_score": judge_result.get("overall_score"),
        "judge_verdict": judge_result.get("verdict"),
        "audio_url": full_audio_url
    }
    SESSION_HISTORY.append(turn)
    if len(SESSION_HISTORY) > 3:
        SESSION_HISTORY = SESSION_HISTORY[-3:]

    # Build JudgeResult
    j = judge_result
    judge_model = JudgeResult(
        criteria_scores=JudgeCriteriaScores(**j["criteria_scores"]),
        overall_score=j["overall_score"],
        verdict=j["verdict"],
        judge_reasoning=j["judge_reasoning"],
        corrective_notes=j.get("corrective_notes", ""),
        retry_count=retry_count,
        original_score=original_score,
        self_healing_applied=self_healing_applied,
        judge_source=j.get("judge_source", "gemini_1.5_flash")
    )

    return DiagnoseResponse(
        equipment_type=diagnosis.get("equipment_type", "Industrial Centrifugal Pump"),
        fault_id=diagnosis.get("fault_id", "F01"),
        detected_anomaly=diagnosis.get("detected_anomaly", "Mechanical Seal Weepage"),
        severity=diagnosis.get("severity", "CRITICAL"),
        safety_lockout_required=diagnosis.get("safety_lockout_required", True),
        confidence_score=diagnosis.get("confidence_score", 0.92),
        manual_section_referenced=diagnosis.get("manual_section_referenced", "diagnostic_steps.F01_seal_leakage"),
        diagnostic_steps=diagnosis.get("diagnostic_steps", []),
        vernacular_text=diagnosis.get("vernacular_audio_script", ""),
        vernacular_audio_url=full_audio_url,
        audio_source="pregenerated_cache" if is_pregenerated else "dynamic_tts",
        rag_delay_ms=1500,
        judge=judge_model,
        context_turn_count=len(SESSION_HISTORY),
        session_history=SESSION_HISTORY
    )


# ─── Production Frontend Mounting (for Cloud Run & Docker) ───────────────────
FRONTEND_DIST = BASE_DIR.parent / "frontend_dist"
if not FRONTEND_DIST.exists():
    FRONTEND_DIST = BASE_DIR / "frontend_dist"

if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
