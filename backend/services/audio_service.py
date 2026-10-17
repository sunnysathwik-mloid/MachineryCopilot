import os
import hashlib
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent
AUDIO_CACHE_DIR = BASE_DIR / "audio_cache"
AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Map friendly codes to gTTS language codes
LANG_CODE_MAP = {
    "ta": "ta",  # Tamil
    "hi": "hi",  # Hindi
    "te": "te",  # Telugu
    "kn": "kn",  # Kannada
    "mr": "mr",  # Marathi
    "bn": "bn",  # Bengali
    "en": "en",  # English
}

def get_demo_audio_filename(step_key: str, lang: str) -> str:
    """Returns deterministic filename for demo steps, e.g., demo_step_1_tamil.mp3"""
    lang_normalized = {
        "ta": "tamil",
        "hi": "hindi",
        "te": "telugu",
        "kn": "kannada",
        "mr": "marathi",
        "bn": "bengali",
        "en": "english"
    }.get(lang, lang)
    return f"demo_{step_key}_{lang_normalized}.mp3"

def get_or_generate_audio(text: str, lang: str = "ta", step_key: str = "step_1") -> tuple[str, str, bool]:
    """
    Checks for local pre-generated .mp3 files first (e.g., demo_step_1_tamil.mp3).
    If present, serves it immediately.
    Falls back to dynamic gTTS generation only if missing.
    Returns: (audio_filename, audio_rel_url, is_pregenerated)
    """
    # 1. Check for deterministic demo file first
    demo_filename = get_demo_audio_filename(step_key, lang)
    demo_file_path = AUDIO_CACHE_DIR / demo_filename
    
    if demo_file_path.exists() and demo_file_path.stat().st_size > 0:
        return demo_filename, f"/audio/{demo_filename}", True

    # 2. Check for hashed text file if already dynamically synthesized previously
    text_hash = hashlib.md5(f"{lang}:{text}".encode("utf-8")).hexdigest()[:12]
    hash_filename = f"dynamic_{lang}_{text_hash}.mp3"
    hash_file_path = AUDIO_CACHE_DIR / hash_filename

    if hash_file_path.exists() and hash_file_path.stat().st_size > 0:
        return hash_filename, f"/audio/{hash_filename}", False

    # 3. Dynamic gTTS synthesis fallback
    target_path = demo_file_path if not demo_file_path.exists() else hash_file_path
    gtts_lang = LANG_CODE_MAP.get(lang, "en")
    
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang=gtts_lang, slow=False)
        tts.save(str(target_path))
        return target_path.name, f"/audio/{target_path.name}", False
    except Exception as e:
        print(f"[AudioService] Warning: gTTS synthesis error: {e}. Generating fallback audio tone...")
        # Create a valid minimal placeholder MP3 or alert tone if network/gTTS fails
        _generate_silent_or_chime_mp3(target_path)
        return target_path.name, f"/audio/{target_path.name}", False

def _generate_silent_or_chime_mp3(file_path: Path):
    """Generates a minimal valid MP3 frame so playback never breaks."""
    # 320 bytes valid silent/minimal MP3 audio frame header & sync
    mp3_silent_bytes = b'\xff\xfb\x90d\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00' * 32
    with open(file_path, "wb") as f:
        f.write(mp3_silent_bytes)
