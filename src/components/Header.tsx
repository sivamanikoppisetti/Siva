import React from 'react';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'converter' | 'matrix' | 'ai' | 'data';
  setActiveTab: (tab: 'converter' | 'matrix' | 'ai' | 'data') => void;
  queueCount: number;
  onConvertAll?: () => void;
  isConverting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  onConvertAll,
  isConverting,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand title, one line wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('converter');
          }}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-indigo-400 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Layers className="h-4 w-4" />
          </div>
          <span>OmniConvert</span>
        </a>

        {/* Zone 2: 4-5 nav links, 1-2 word labels, single-line text links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('converter')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === 'converter' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Universal Converter
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === 'matrix' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Format Matrix
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === 'ai' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Transform</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === 'data' ? 'text-indigo-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Data Lab
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {queueCount > 0 && onConvertAll ? (
            <button
              onClick={onConvertAll}
              disabled={isConverting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isConverting ? 'Processing Queue...' : `Convert All (${queueCount})`}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('ai')}
              className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-700/80 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Smart AI Tools</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
