import React from 'react';
import { Cpu, Database, Volume2, History, RotateCcw, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  turnCount: number;
  onResetContext: () => void;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  turnCount,
  onResetContext,
  isBackendConnected,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
            <ShieldAlert className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Machinery<span className="text-amber-400">Copilot</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded-full">
                Hackathon Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multimodal Vernacular Field Diagnostic Assistant
            </p>
          </div>
        </div>

        {/* AI & Stack Badges */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">Gemini 1.5 Flash</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">ChromaDB RAG</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono">gTTS Vernacular</span>
          </div>
        </div>

        {/* State Management & Status */}
        <div className="flex items-center space-x-2">
          {/* Simulated 3-Turn Context Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/90 border border-slate-700 rounded-lg text-xs">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Memory:</span>
            <span className="font-mono font-bold text-amber-400">{turnCount}/3 turns</span>
            {turnCount > 0 && (
              <button
                onClick={onResetContext}
                title="Reset Conversational Context"
                className="ml-1 text-slate-400 hover:text-rose-400 transition"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Connection Status Pill */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
              isBackendConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="hidden sm:inline">
              {isBackendConnected ? 'API Live (8000)' : 'API Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
