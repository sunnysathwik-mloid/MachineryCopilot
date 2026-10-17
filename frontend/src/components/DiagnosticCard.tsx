import React, { useState } from 'react';
import { ShieldAlert, CheckSquare, Square, Wrench, Sparkles, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { DiagnoseResponse } from '../types/diagnostic';
import { WaveformPlayer } from './WaveformPlayer';

interface DiagnosticCardProps {
  diagnosis: DiagnoseResponse;
  language: string;
  imagePreviewUrl?: string | null;
  onReset: () => void;
}

export const DiagnosticCard: React.FC<DiagnosticCardProps> = ({
  diagnosis,
  language,
  imagePreviewUrl,
  onReset,
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const isCritical = diagnosis.severity === 'CRITICAL';

  return (
    <div className="space-y-6">
      {/* Main Diagnostic Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Severity Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl ${
              isCritical
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase border ${
                  isCritical
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  SEVERITY: {diagnosis.severity}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Confidence: {(diagnosis.confidence_score * 100).toFixed(1)}%
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {diagnosis.equipment_type}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Detected Defect</span>
            <span className="text-sm sm:text-base font-bold text-amber-300">
              {diagnosis.detected_anomaly}
            </span>
          </div>
        </div>

        {/* Safety Lockout (LOTO) Alert Banner */}
        {diagnosis.safety_lockout_required && (
          <div className="my-5 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start space-x-3 text-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold text-rose-300 uppercase tracking-wide">
                MANDATORY LOTO SAFETY PROTOCOL:
              </strong>{' '}
              Isolate 415V 3-phase mains circuit and lock out breaker. Depressurize internal fluid casing before applying mechanical tools.
            </div>
          </div>
        )}

        {/* Waveform Player & Spoken Vernacular Instructions */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Vernacular Audio Assistant Playback
            </label>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Ready for Field Technician
            </span>
          </div>

          <WaveformPlayer
            audioUrl={diagnosis.vernacular_audio_url}
            vernacularText={diagnosis.vernacular_text}
            language={language}
            audioSource={diagnosis.audio_source}
            autoPlay={true}
          />
        </div>

        {/* Interactive Step-by-Step Diagnostic Checklist */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Actionable Troubleshooting Procedure
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Completed: {completedSteps.length}/{diagnosis.diagnostic_steps.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {diagnosis.diagnostic_steps.map((step, idx) => {
              const isChecked = completedSteps.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-start space-x-3 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300 opacity-75'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-100 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-slate-600 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
                    <span className={isChecked ? 'line-through text-slate-400' : ''}>
                      {step}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95 border border-slate-700"
          >
            ← Capture Next Machinery Inspection
          </button>
          
          <div className="text-[11px] font-mono text-slate-500">
            Grounding Source: ChromaDB Local Manual
          </div>
        </div>
      </div>
    </div>
  );
};
