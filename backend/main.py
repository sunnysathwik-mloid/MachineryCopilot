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
from services.rag_service import rag_service
from services.vision_service import vision_service

app = FastAPI(
    title="MachineryCopilot API",
    description="Multimodal Vernacular Field Troubleshooting Assistant",
    version="1.0.0"
)

# CORS configuration for seamless local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount pre-generated and dynamic audio cache as static directory
app.mount("/audio", StaticFiles(directory=str(AUDIO_CACHE_DIR)), name="audio")

# Lightweight In-Memory Simulated State (Last 3 Interactions Context)
SESSION_HISTORY: List[Dict[str, Any]] = []

class DiagnoseResponse(BaseModel):
    equipment_type: str
    detected_anomaly: str
    severity: str
    safety_lockout_required: bool
    confidence_score: float
    diagnostic_steps: List[str]
    vernacular_text: str
    vernacular_audio_url: str
    audio_source: str  # "pregenerated_cache" | "dynamic_tts"
    artificial_rag_delay_ms: int
    context_turn_count: int
    session_history: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "MachineryCopilot Backend",
        "cached_audio_files": len(list(AUDIO_CACHE_DIR.glob("*.mp3"))),
        "history_length": len(SESSION_HISTORY)
    }

@app.get("/history")
def get_session_history():
    """Returns the last 3 interactions simulating conversational context."""
    return {
        "context_limit": 3,
        "count": len(SESSION_HISTORY),
        "history": SESSION_HISTORY
    }

@app.delete("/history")
def reset_session_history():
    """Resets conversational context."""
    global SESSION_HISTORY
    SESSION_HISTORY.clear()
    return {"message": "Session context reset successfully."}

@app.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose_equipment(
    image: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    language: str = Form("ta")  # Default: Tamil ('ta')
):
    """
    Main diagnostic endpoint:
    1. Deliberate 1.5s artificial delay for RAG manual scan illusion.
    2. RAG manual lookup via ChromaDB.
    3. Multimodal vision analysis with Gemini 1.5 Flash Vision.
    4. Demo-optimized audio lookup (.mp3 check first, fallback to gTTS).
    5. In-memory 3-turn state management update.
    """
    global SESSION_HISTORY
    
    # Read uploaded image bytes
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image uploaded.")

    # Showmanship Requirement: Deliberate 1.5-second artificial delay for RAG scanning illusion
    await asyncio.sleep(1.5)

    # 1. RAG Manual Retrieval
    query_text = f"{notes or ''} {image.filename or ''}"
    rag_manual = rag_service.query_manual(query_text)

    # 2. Multimodal Vision Analysis (Gemini 1.5 Flash Vision with fallback)
    diagnosis = await vision_service.analyze_machinery(
        image_bytes=image_bytes,
        user_notes=notes,
        language=language,
        rag_context=rag_manual
    )

    # 3. Demo-Optimized Audio: Local pre-generated file check first, fallback to gTTS
    step_key = "step_1"
    vernacular_text = diagnosis.get("vernacular_audio_script", "Please follow safety guidelines.")
    filename, audio_url, is_pregenerated = get_or_generate_audio(
        text=vernacular_text,
        lang=language,
        step_key=step_key
    )

    # 4. Simulated State Management: Hold last 3 interactions
    current_turn = {
        "turn": len(SESSION_HISTORY) + 1,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "user_query": notes or "Image inspection",
        "language": language,
        "equipment": diagnosis.get("equipment_type", "Industrial Centrifugal Pump"),
        "anomaly": diagnosis.get("detected_anomaly", "Mechanical Seal Weepage"),
        "severity": diagnosis.get("severity", "CRITICAL"),
        "audio_url": audio_url
    }
    
    # Append and maintain sliding window of max 3 turns
    SESSION_HISTORY.append(current_turn)
    if len(SESSION_HISTORY) > 3:
        SESSION_HISTORY = SESSION_HISTORY[-3:]

    return DiagnoseResponse(
        equipment_type=diagnosis.get("equipment_type", "Industrial Centrifugal Pump"),
        detected_anomaly=diagnosis.get("detected_anomaly", "Mechanical Seal Weepage"),
        severity=diagnosis.get("severity", "CRITICAL"),
        safety_lockout_required=diagnosis.get("safety_lockout_required", True),
        confidence_score=diagnosis.get("confidence_score", 0.94),
        diagnostic_steps=diagnosis.get("diagnostic_steps", rag_manual.get("diagnostic_steps", [])),
        vernacular_text=vernacular_text,
        vernacular_audio_url=audio_url,
        audio_source="pregenerated_cache" if is_pregenerated else "dynamic_tts",
        artificial_rag_delay_ms=1500,
        context_turn_count=len(SESSION_HISTORY),
        session_history=SESSION_HISTORY
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
