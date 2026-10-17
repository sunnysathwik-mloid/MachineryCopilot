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

    # ── Stage 2: Judge (runs concurrently with audio generation) ──
    judge_result, (audio_filename, audio_rel_url, is_pregenerated) = await asyncio.gather(
        judge_service.judge_diagnosis(diagnosis, language),
        asyncio.to_thread(
            get_or_generate_audio,
            diagnosis.get("vernacular_audio_script", "Follow safety protocol."),
            language,
            "step_1"
        )
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
        corrective_notes=j.get("corrective_notes", "")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
