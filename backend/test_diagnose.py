import asyncio
import io
import time
from fastapi.datastructures import UploadFile
from main import app, diagnose_equipment, SESSION_HISTORY

async def test_diagnose_flow():
    print("Testing /diagnose logic...")
    dummy_image_bytes = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    
    start_t = time.time()
    file_obj = UploadFile(
        file=io.BytesIO(dummy_image_bytes),
        filename="field_pump.jpg",
        headers={"content-type": "image/jpeg"}
    )
    
    response = await diagnose_equipment(
        image=file_obj,
        notes="Centrifugal pump leaking fluid at mechanical seal gland",
        language="ta"
    )
    elapsed = time.time() - start_t
    
    print(f"Elapsed Time: {elapsed:.2f}s (enforced 1.5s artificial delay verified: {elapsed >= 1.45})")
    print(f"Equipment: {response.equipment_type}")
    print(f"Detected Anomaly: {response.detected_anomaly}")
    print(f"Severity: {response.severity}")
    print(f"Safety Lockout: {response.safety_lockout_required}")
    print(f"Audio URL: {response.vernacular_audio_url}")
    print(f"Audio Source: {response.audio_source}")
    print(f"Session Turns in Memory: {response.context_turn_count}")
    print(f"Diagnostic Steps: {len(response.diagnostic_steps)}")
    
    assert response.audio_source == "pregenerated_cache", f"Expected pregenerated_cache, got {response.audio_source}"
    assert response.context_turn_count == 1
    print("[OK] Test passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_diagnose_flow())
