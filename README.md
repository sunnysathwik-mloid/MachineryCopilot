# ⚙️ MachineryCopilot
> **Multimodal Vernacular Diagnostic Assistant for Industrial Field Troubleshooting**
> Built with **React (Vite + TypeScript + Tailwind CSS)** and **FastAPI (Python + Gemini 1.5 Flash Vision + ChromaDB + gTTS)**.

---

## 🎯 Problem & Solution
Field maintenance technicians frequently inspect heavy industrial machinery (centrifugal pumps, induction motors, screw compressors) in loud plant environments where reading complex PDF OEM manuals is slow and error-prone. 

**MachineryCopilot** solves this by:
1. **Camera-First Visual Inspection:** Technicians snap a photo or stream video of troubled machinery with optional vernacular audio/text notes.
2. **Local RAG Grounding:** ChromaDB indexes structured OEM manuals to retrieve exact clearances, torque specs, cavitation thresholds, and safety lockout (LOTO) protocols.
3. **Multimodal Diagnostics:** Gemini 1.5 Flash Vision analyzes optical defects, wear patterns, thermal discoloration, and seal weepage.
4. **Vernacular Audio Instructions & Reactive Waveform:** Generates dialect-specific spoken guidance (Tamil, Hindi, Telugu, Kannada, Marathi, English) with a real-time reactive audio waveform.

---

## 🌟 Hackathon "Showmanship" Features

### 1. 🧠 RAG Illusion & AI "Thinking" Stepper
- When the technician clicks **Diagnose**, the backend introduces an intentional **1.5-second artificial delay**.
- The frontend exposes this internal AI cognitive pipeline with a laser scanning beam and staged progress badges:
  - 🔍 *"Analyzing equipment visual feed with Gemini 1.5 Flash..."*
  - 📚 *"Scanning Equipment Manual... Extracting Structured JSON"*
  - 🎙️ *"Synthesizing Vernacular Audio & Action Steps..."*

### 2. ⚡ Demo-Optimized Audio Pipeline (Zero-Latency Guarantee)
- Checks `backend/audio_cache/` for pre-generated deterministic `.mp3` files (`demo_step_1_tamil.mp3`, `demo_step_1_hindi.mp3`, etc.).
- If found, serves immediately with zero cloud API latency or quota failures.
- If missing, smoothly falls back to dynamic `gTTS` synthesis and caches the resulting audio.

### 3. 🌊 Dynamic Audio Waveform Player
- Multi-bar reactive waveform visualizer that dynamically pulses, scales, and synchronizes with audio playback.
- Features industrial audio controls: Play/Pause, Replay, Playback Speed (0.85x, 1.0x, 1.25x), Volume Mute, and Scrubber.

### 4. 🗃️ Simulated 3-Turn Contextual Memory
- Lightweight in-memory sliding window array in FastAPI (`deque(maxlen=3)`) maintaining the last 3 turns of conversational context.
- Allows continuous troubleshooting context without setting up a heavy external database.

---

## 🏗️ Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          React + Vite + Tailwind UI          │
                  │   (Camera Stream, Dialect Selector, Audio)   │
                  └──────────────────────┬───────────────────────┘
                                         │  POST /diagnose (FormData)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │               FastAPI Backend                │
                  │         (Port 8000, CORS configured)         │
                  ├──────────────────────┬───────────────────────┤
                  │                      │                       │
      ┌───────────▼───────────┐ ┌────────▼──────────┐ ┌──────────▼──────────┐
      │  ChromaDB Manual RAG  │ │ Gemini Flash 1.5  │ │  Audio Cache / gTTS │
      │ (Pumps, Motors, Comp) │ │  Multimodal API   │ │ (.mp3 First Lookup) │
      └───────────────────────┘ └───────────────────┘ └─────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Start FastAPI Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).*

### 2. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Demo Presentation Script for Judges

1. **Open UI:** Navigate to `http://localhost:5173`. Point out the industrial status badges (`Gemini 1.5 Flash`, `ChromaDB RAG`, `gTTS Vernacular`).
2. **Select Dialect:** Click **Tamil (தமிழ்)** or **Hindi (हिन्दी)**.
3. **Select Quick Preset:** Click the **"P1: Centrifugal Pump Seal Leak"** button under *Quick Demo Presets*. Notice the active target card updates instantly.
4. **Click "Diagnose":**
   - Point out the **RAG Illusion Thinking Loader**: *"Scanning Equipment Manual... Extracting Structured JSON"*.
5. **Listen to Vernacular Audio:**
   - Watch the **reactive waveform visualizer** pulse in real-time as the spoken vernacular audio plays through the speakers.
   - Point out the **"⚡ Zero-Latency Demo MP3"** cache indicator.
6. **Inspect Multi-Turn Context:**
   - Scroll down to the **Multi-Turn Memory Drawer** showing `Turn #1`.
   - Run a second test with **Motor Overheat (हिन्दी)**. The counter updates to `Turn 2/3`, simulating continuous context!
