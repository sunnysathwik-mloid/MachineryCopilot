import React from 'react';
import { History, Clock, Activity, RotateCcw, Volume2 } from 'lucide-react';
import { SessionTurn } from '../types/diagnostic';
import { resolveAudioUrl } from '../api/client';

interface ContextHistoryProps {
  history: SessionTurn[];
  onClear: () => void;
  onPlayAudio?: (url: string) => void;
}

export const ContextHistory: React.FC<ContextHistoryProps> = ({
  history,
  onClear,
}) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
        <History className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
        <p className="text-xs text-slate-400 font-medium">No prior conversational turns in session.</p>
        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
          Simulated memory maintains last 3 interactions in FastAPI RAM.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Multi-Turn In-Memory Context ({history.length}/3 Turns)
          </h3>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
          title="Clear conversational memory"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {history.map((turn, index) => {
          return (
            <div
              key={index}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-[10px]">
                    Turn #{turn.turn}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-none">
                    Centrifugal Pump
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{turn.timestamp}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500">Query: </span>
                <span className="italic font-medium">"{(turn as any).query || (turn as any).user_query}"</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                <span className="text-amber-300 truncate max-w-[140px]">
                  {(turn as any).fault || (turn as any).anomaly}
                </span>
                <div className="flex items-center gap-1.5">
                  {(turn as any).judge_score !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      (turn as any).judge_verdict === 'PASS' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                    }`}>
                      Judge: {(turn as any).judge_score?.toFixed(1)}/10
                    </span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                    turn.severity === 'CRITICAL' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'
                  }`}>
                    {turn.severity}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
