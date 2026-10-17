import React, { useEffect, useState } from 'react';
import { Search, FileCode2, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

interface ThinkingLoaderProps {
  elapsedTimeMs?: number;
}

export const ThinkingLoader: React.FC<ThinkingLoaderProps> = () => {
  const [phase, setPhase] = useState(0);

  const steps = [
    {
      title: 'Multimodal Vision Analysis',
      detail: 'Gemini 1.5 Flash inspecting optical defects, wear patterns & thermal discoloration',
      icon: Cpu,
      color: 'text-cyan-400',
    },
    {
      title: 'Scanning Equipment Manual... Extracting Structured JSON',
      detail: 'ChromaDB querying OEM troubleshooting manuals for torque, NPSH & seal tolerances',
      icon: Search,
      color: 'text-amber-400',
    },
    {
      title: 'Synthesizing Vernacular Audio & Action Steps',
      detail: 'Translating technical diagnostic into dialect-specific vocal speech via gTTS',
      icon: Sparkles,
      color: 'text-purple-400',
    },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 500);
    const timer2 = setTimeout(() => setPhase(2), 1100);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 shadow-2xl shadow-amber-500/10">
      {/* Laser Scan Line Animation */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scan shadow-[0_0_15px_#f59e0b]" />

      {/* Main Banner */}
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center animate-pulse">
            <FileCode2 className="w-5 h-5 text-amber-400" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              RAG Knowledge Pipeline Active
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              1.5s Deliberate Scan
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Scanning Equipment Manual... Extracting Structured JSON
          </h3>
        </div>
      </div>

      {/* Progressive Stepper Skeleton */}
      <div className="space-y-4">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isDone = phase > index;
          const isCurrent = phase === index;

          return (
            <div
              key={s.title}
              className={`flex items-start space-x-3 p-3 rounded-xl transition-all duration-300 border ${
                isCurrent
                  ? 'bg-slate-800/80 border-amber-500/40 ring-1 ring-amber-400/30'
                  : isDone
                  ? 'bg-slate-800/40 border-emerald-500/30 text-slate-300'
                  : 'bg-slate-900/40 border-slate-800 opacity-40 text-slate-500'
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Icon className={`w-5 h-5 ${isCurrent ? s.color + ' animate-spin' : 'text-slate-500'}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold tracking-wide ${isCurrent ? 'text-white' : ''}`}>
                    {s.title}
                  </h4>
                  {isCurrent && (
                    <span className="text-[10px] font-mono font-medium text-amber-400 animate-pulse">
                      PROCESSING...
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-mono font-medium text-emerald-400">
                      RESOLVED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skeleton Pulse Visual */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-4 gap-2">
        <div className="h-2 rounded bg-slate-800 animate-pulse" />
        <div className="h-2 rounded bg-amber-500/40 animate-pulse col-span-2" />
        <div className="h-2 rounded bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
};
