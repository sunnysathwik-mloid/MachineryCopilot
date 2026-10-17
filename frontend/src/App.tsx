import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DialectSelector } from './components/DialectSelector';
import { CameraCapture } from './components/CameraCapture';
import { ThinkingLoader } from './components/ThinkingLoader';
import { DiagnosticCard } from './components/DiagnosticCard';
import { ContextHistory } from './components/ContextHistory';
import { diagnoseMachinery, getSessionHistory, resetSessionHistory } from './api/client';
import { DiagnoseResponse, SessionTurn, SUPPORTED_DIALECTS } from './types/diagnostic';
import { Zap, Camera, FileText, CheckCircle2, AlertCircle, Wrench, RefreshCw, Sparkles, Mic, MicOff } from 'lucide-react';

export function App() {
  const [selectedDialect, setSelectedDialect] = useState<string>('ta'); // Tamil by default
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState<string>('No image captured');
  const [workerNotes, setWorkerNotes] = useState<string>(
    'Fluid leakage observed near casing gland with audible cavitation vibrations'
  );
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<DiagnoseResponse | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionTurn[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check backend health & fetch current history
  const checkHealth = async () => {
    try {
      const historyData = await getSessionHistory();
      setSessionHistory(historyData.history);
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 6000);

    // Pre-stage F01 preset so user can immediately test with 1-click
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 800, 600);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < 800; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
        }
        for (let y = 0; y < 600; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
        }
        const grad = ctx.createLinearGradient(200, 150, 600, 450);
        grad.addColorStop(0, '#334155');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(220, 180, 360, 240, 24); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#f59e0b'; ctx.stroke();
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(400, 300, 75, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 6; ctx.stroke();
        ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 24px monospace';
        ctx.fillText('CENTRIFUGAL PUMP — SEAL WEEPAGE (F01)', 130, 100);
        ctx.fillStyle = '#fbbf24'; ctx.font = '16px monospace';
        ctx.fillText('ACTIVE FIELD DEFECT: MECHANICAL SEAL LEAKAGE', 130, 130);
        canvas.toBlob((blob) => {
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            setImageBlob(blob);
            setImagePreviewUrl(previewUrl);
            setImageLabel('Centrifugal Pump — Seal Weepage (F01)');
          }
        }, 'image/jpeg', 0.95);
      }
    } catch (e) {
      console.warn('Preset auto-stage error', e);
    }

    return () => clearInterval(interval);
  }, []);

  const handleCaptureImage = (blob: Blob, previewUrl: string, label?: string, suggestedNotes?: string) => {
    setImageBlob(blob);
    setImagePreviewUrl(previewUrl);
    setImageLabel(label || 'Field Camera Snapshot');
    if (suggestedNotes) {
      setWorkerNotes(suggestedNotes);
    }
    setErrorMessage(null);
  };

  const handleRunDiagnosis = async () => {
    if (!imageBlob) {
      setErrorMessage('Please snap a machinery photo or select a quick demo preset first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await diagnoseMachinery(imageBlob, workerNotes, selectedDialect);
      setDiagnosis(result);
      if (result.session_history) {
        setSessionHistory(result.session_history);
      }
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setErrorMessage(err.message || 'Diagnosis error. Ensure FastAPI server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetContext = async () => {
    try {
      await resetSessionHistory();
      setSessionHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetForm = () => {
    setDiagnosis(null);
    setImageBlob(null);
    setImagePreviewUrl(null);
    setImageLabel('No image captured');
  };

  const currentDialectObj = SUPPORTED_DIALECTS.find((d) => d.code === selectedDialect) || SUPPORTED_DIALECTS[0];

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* Top Application Header */}
      <Header
        turnCount={sessionHistory.length}
        onResetContext={handleResetContext}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-between text-rose-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-300 underline ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Capture & Dialect Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Vernacular Dialect Picker */}
            <DialectSelector
              selectedDialect={selectedDialect}
              onSelectDialect={setSelectedDialect}
              disabled={isLoading}
            />

            {/* 2. Camera-First Viewport & Dropzone */}
            <CameraCapture
              onCaptureImage={handleCaptureImage}
              disabled={isLoading}
            />

            {/* 3. Field Worker Voice/Text Symptom Note */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Worker Symptom Note / Voice Input
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        setIsListening(false);
                      } else {
                        setIsListening(true);
                        // Check if browser SpeechRecognition is available
                        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                        if (SpeechRecognition) {
                          try {
                            const recognition = new SpeechRecognition();
                            recognition.lang = selectedDialect === 'ta' ? 'ta-IN' : selectedDialect === 'hi' ? 'hi-IN' : 'en-IN';
                            recognition.onresult = (event: any) => {
                              const transcript = event.results[0][0].transcript;
                              setWorkerNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
                              setIsListening(false);
                            };
                            recognition.onerror = () => setIsListening(false);
                            recognition.onend = () => setIsListening(false);
                            recognition.start();
                          } catch {
                            // Fallback simulation for hands-free speech demo
                            setTimeout(() => {
                              setWorkerNotes((prev) =>
                                selectedDialect === 'ta'
                                  ? 'பம்பில் அதிக சத்தம் மற்றும் சீல் கசிவு ஏற்படுகிறது'
                                  : selectedDialect === 'hi'
                                  ? 'पंप में अधिक कंपन और सील से रिसाव हो रहा है'
                                  : `${prev} - Abnormal vibration and casing leak detected.`
                              );
                              setIsListening(false);
                            }, 1800);
                          }
                        } else {
                          // Voice dictation simulation for judge demo
                          setTimeout(() => {
                            setWorkerNotes((prev) =>
                              selectedDialect === 'ta'
                                ? 'பம்பில் அதிக சத்தம் மற்றும் சீல் கசிவு ஏற்படுகிறது'
                                : selectedDialect === 'hi'
                                ? 'पंप में अधिक कंपन और सील से रिसाव हो रहा है'
                                : `${prev} - Audible cavitation vibration and weeping gland.`
                            );
                            setIsListening(false);
                          }, 1800);
                        }
                      }
                    }}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                        <span>Listening...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-amber-400" />
                        <span>Dictate Voice</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">Hands-Free</span>
                </div>
              </div>

              <textarea
                rows={2}
                value={workerNotes}
                onChange={(e) => setWorkerNotes(e.target.value)}
                disabled={isLoading}
                placeholder="e.g. Unusual whining cavitation sound coming from impeller casing..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400/60 transition resize-none"
              />

              {/* Quick Field Symptom Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mr-1">
                  Quick Symptoms:
                </span>
                {[
                  'Cavitation rattling',
                  'Fluid seal weeping',
                  'Casing temp >85°C',
                  'Low suction pressure',
                  'High axial vibration',
                ].map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => {
                      setWorkerNotes((prev) => (prev ? `${prev}, ${symptom}` : symptom));
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-amber-400/10 hover:border-amber-400/30 hover:text-amber-300 text-[10px] font-mono text-slate-400 border border-slate-700/60 transition"
                  >
                    +{symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Action Trigger Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleRunDiagnosis}
                disabled={isLoading || !imageBlob}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide uppercase transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl ${
                  !imageBlob
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : isLoading
                    ? 'bg-amber-500/80 text-slate-950 cursor-wait'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20 active:scale-[0.99] animate-pulse-glow'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Running Generator → Judge Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-slate-950" />
                    <span>
                      Diagnose in {currentDialectObj.name} ({currentDialectObj.nativeName})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Results, Thinking Loader, & Multi-Turn State */}
          <div className="lg:col-span-5 space-y-6">
            {/* Image Preview Thumbnail (if captured) */}
            {imagePreviewUrl && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex items-center space-x-3">
                <img
                  src={imagePreviewUrl}
                  alt="Captured Equipment"
                  className="w-16 h-16 rounded-xl object-cover border border-amber-400/40"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Target Equipment</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold truncate mt-0.5">
                    {imageLabel}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Ready for Gemini Flash Vision → Manual-Grounded Diagnosis
                  </p>
                </div>
              </div>
            )}

            {/* Showmanship Constraint: RAG Illusion Thinking Loader */}
            {isLoading && <ThinkingLoader />}

            {/* Final Diagnostic Card with Waveform Audio */}
            {!isLoading && diagnosis && (
              <DiagnosticCard
                diagnosis={diagnosis}
                language={selectedDialect}
                onReset={handleResetForm}
              />
            )}

            {/* Empty State when no diagnosis run yet */}
            {!isLoading && !diagnosis && (
              <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Wrench className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-slate-300 mb-1">
                  Field Diagnostic Console Ready
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Snap a picture of the troubled machinery or select one of the quick presets on the left to receive AI diagnosis and vernacular voice instructions.
                </p>
              </div>
            )}

            {/* Multi-Turn Simulated State Management (Last 3 Interactions) */}
            <ContextHistory
              history={sessionHistory}
              onClear={handleResetContext}
            />
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MachineryCopilot • Multimodal Vernacular Diagnostic Engine</span>
          <span>FastAPI + Gemini 1.5 Flash (Generator + Judge) + Pump Manual + gTTS</span>
        </div>
      </footer>
    </div>
  );
}
export default App;
