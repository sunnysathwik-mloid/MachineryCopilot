import React from 'react';
import { Languages, Check } from 'lucide-react';
import { SUPPORTED_DIALECTS, DialectOption } from '../types/diagnostic';

interface DialectSelectorProps {
  selectedDialect: string;
  onSelectDialect: (code: string) => void;
  disabled?: boolean;
}

export const DialectSelector: React.FC<DialectSelectorProps> = ({
  selectedDialect,
  onSelectDialect,
  disabled = false,
}) => {
  const current = SUPPORTED_DIALECTS.find((d) => d.code === selectedDialect) || SUPPORTED_DIALECTS[0];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Languages className="w-4 h-4 text-amber-400" />
          Field Worker Dialect / vernacular
        </label>
        <span className="text-[11px] font-mono text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
          Selected: {current.name} ({current.nativeName})
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SUPPORTED_DIALECTS.map((dialect: DialectOption) => {
          const isSelected = dialect.code === selectedDialect;
          return (
            <button
              key={dialect.code}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDialect(dialect.code)}
              className={`relative flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{dialect.flag}</span>
                  <span className="text-sm font-semibold truncate">{dialect.nativeName}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {dialect.name} <span className="opacity-60 font-mono">({dialect.code})</span>
                </div>
              </div>
              {isSelected && (
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
