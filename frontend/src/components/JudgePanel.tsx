import React from 'react';
import { JudgeResult } from '../types/diagnostic';
import { ShieldCheck, AlertTriangle, BookOpen, Shield, CheckSquare, Languages, Award, Sparkles, RefreshCw } from 'lucide-react';

interface JudgePanelProps {
  judge: JudgeResult;
}

const criteriaConfig = [
  {
    key: 'manual_grounding' as const,
    label: 'Manual Grounding',
    description: 'Steps traceable to ISO 5199 / API 610',
    icon: BookOpen,
    color: 'cyan',
  },
  {
    key: 'safety_compliance' as const,
    label: 'Safety & LOTO Compliance',
    description: 'Lockout/Tagout protocol presence',
    icon: Shield,
    color: 'rose',
  },
  {
    key: 'step_completeness' as const,
    label: 'Step Completeness',
    description: 'All critical manual steps present',
    icon: CheckSquare,
    color: 'emerald',
  },
  {
    key: 'vernacular_accuracy' as const,
    label: 'Vernacular Accuracy',
    description: 'Dialect coherence and technical correctness',
    icon: Languages,
    color: 'purple',
  },
];

const colorMap: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  cyan:    { bar: 'bg-cyan-400',    text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30' },
  rose:    { bar: 'bg-rose-400',    text: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30' },
  emerald: { bar: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  purple:  { bar: 'bg-purple-400',  text: 'text-purple-300',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.round((score / 10) * 100);
  const c = colorMap[color] || colorMap.cyan;
  return (
    <div className="w-full bg-slate-800 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${c.bar}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export const JudgePanel: React.FC<JudgePanelProps> = ({ judge }) => {
  const isPass = judge.verdict === 'PASS';
  const scoreColor =
    judge.overall_score >= 8
      ? 'text-emerald-400'
      : judge.overall_score >= 7
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className={`rounded-2xl border p-5 ${isPass ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl ${isPass ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            {isPass
              ? <ShieldCheck className="w-5 h-5 text-emerald-400" />
              : <AlertTriangle className="w-5 h-5 text-rose-400" />
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-tight">LLM Judge Evaluation</h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                isPass
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                {judge.verdict.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gemini Flash evaluating response vs. ISO 5199 / API 610 manual
            </p>
          </div>
        </div>

        {/* Overall Score Circle */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className={`text-3xl font-black tabular-nums ${scoreColor}`}>
            {judge.overall_score.toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono uppercase">/10</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Award className={`w-3 h-3 ${scoreColor}`} />
            <span className={`text-[10px] font-bold ${scoreColor}`}>Overall</span>
          </div>
        </div>
      </div>

      {/* Self-Healing / Retry Badge */}
      {judge.self_healing_applied && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2.5 text-amber-200">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-amber-300">
              Self-Healing Critique Loop Activated:
            </span>{' '}
            Initial diagnosis was scored{' '}
            <span className="font-mono font-bold text-rose-300">{judge.original_score?.toFixed(1) ?? 'N/A'}/10 (NEEDS REVIEW)</span>
            . Generator automatically revised steps based on Judge critique and achieved{' '}
            <span className="font-mono font-bold text-emerald-300">{judge.overall_score.toFixed(1)}/10 ({judge.verdict})</span>!
          </div>
        </div>
      )}

      {/* 4 Criteria Score Bars */}
      <div className="space-y-3 mb-4">
        {criteriaConfig.map((c) => {
          const score = judge.criteria_scores[c.key];
          const Icon = c.icon;
          const colors = colorMap[c.color];
          return (
            <div key={c.key} className={`p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                  <span className="text-xs font-semibold text-slate-200">{c.label}</span>
                </div>
                <span className={`text-sm font-black tabular-nums ${colors.text}`}>
                  {score}/10
                </span>
              </div>
              <ScoreBar score={score} color={c.color} />
              <p className="text-[10px] text-slate-500 mt-1">{c.description}</p>
            </div>
          );
        })}
      </div>

      {/* Judge Reasoning */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-3">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
          Judge Reasoning:
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{judge.judge_reasoning}</p>
      </div>

      {/* Corrective Notes — only when NEEDS_REVIEW */}
      {!isPass && judge.corrective_notes && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3">
          <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Corrective Actions Required:
          </div>
          <p className="text-xs text-rose-200 leading-relaxed">{judge.corrective_notes}</p>
        </div>
      )}
    </div>
  );
};
