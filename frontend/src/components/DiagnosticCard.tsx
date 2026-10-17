import React, { useState } from 'react';
import {
  ShieldAlert,
  Wrench,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DiagnoseResponse } from '../types/diagnostic';
import { WaveformPlayer } from './WaveformPlayer';
import { JudgePanel } from './JudgePanel';
import { resolveAudioUrl } from '../api/client';

interface DiagnosticCardProps {
  diagnosis: DiagnoseResponse;
  language: string;
  onReset: () => void;
}

export const DiagnosticCard: React.FC<DiagnosticCardProps> = ({
  diagnosis,
  language,
  onReset,
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showJudge, setShowJudge] = useState<boolean>(true);
  const [showManualRef, setShowManualRef] = useState<boolean>(false);

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const isCritical = diagnosis.severity === 'CRITICAL';
  const isPass = diagnosis.judge?.verdict === 'PASS';

  return (
    <div className="space-y-4">
      {/* ── Diagnosis Header Card ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        {/* Severity Banner */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-start space-x-3">
            <div className={`p-2.5 rounded-2xl flex-shrink-0 ${
              isCritical
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase border ${
                  isCritical
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {diagnosis.severity}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Fault: {diagnosis.fault_id}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  AI Confidence: {(diagnosis.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {diagnosis.equipment_type}
              </h2>
              <p className="text-sm text-amber-300 font-semibold mt-0.5">{diagnosis.detected_anomaly}</p>
            </div>
          </div>

          {/* Manual Reference badge */}
          <button
            type="button"
            onClick={() => setShowManualRef(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 font-mono transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manual Ref</span>
            {showManualRef ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Manual section reference expandable */}
        {showManualRef && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
            <span className="text-slate-400">Grounding Source: </span>
            {diagnosis.manual_section_referenced}
          </div>
        )}

        {/* LOTO Safety Banner */}
        {diagnosis.safety_lockout_required && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start space-x-3 text-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold text-rose-300 uppercase tracking-wide">
                MANDATORY LOTO SAFETY PROTOCOL:
              </strong>{' '}
              De-energise 415V motor at main switchboard. Apply padlock + personal danger tag.
              Vent casing to 0 bar. Confirm isolation with calibrated voltage tester.
            </div>
          </div>
        )}

        {/* Vernacular Audio Player */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Vernacular Audio Instructions
            </label>
          </div>
          <WaveformPlayer
            audioUrl={resolveAudioUrl(diagnosis.vernacular_audio_url)}
            vernacularText={diagnosis.vernacular_text}
            language={language}
            audioSource={diagnosis.audio_source}
            autoPlay={true}
          />
        </div>

        {/* Step Checklist */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Manual-Grounded Diagnostic Procedure
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {completedSteps.length}/{diagnosis.diagnostic_steps.length} completed
            </span>
          </div>

          <div className="space-y-2">
            {diagnosis.diagnostic_steps.map((step, idx) => {
              const isChecked = completedSteps.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-start space-x-3 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-70'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
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
                  <p className={`text-xs sm:text-sm font-medium leading-relaxed flex-1 ${isChecked ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 active:scale-95"
          >
            ← New Inspection
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            Grounded: ISO 5199 / API 610
          </span>
        </div>
      </div>

      {/* ── LLM Judge Panel ── */}
      {diagnosis.judge && (
        <div>
          <button
            type="button"
            onClick={() => setShowJudge(v => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-bold transition mb-2 ${
              isPass
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/50'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-950/50'
            }`}
          >
            <span className="flex items-center gap-2">
              {isPass
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertTriangle className="w-4 h-4" />
              }
              LLM Judge Score: {diagnosis.judge.overall_score?.toFixed(1) ?? 'N/A'}/10 — {diagnosis.judge.verdict?.replace('_', ' ') ?? 'EVALUATING'}
            </span>
            {showJudge ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showJudge && <JudgePanel judge={diagnosis.judge} />}
        </div>
      )}
    </div>
  );
};
