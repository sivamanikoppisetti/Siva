import React, { useState } from 'react';
import { Search, Layers, ArrowRight, Sparkles, Check } from 'lucide-react';
import { ALL_FORMATS, POPULAR_PRESETS } from '../utils/formatRegistry';
import { FileCategory } from '../types/converter';

interface FormatMatrixProps {
  onSelectPreset?: (preset: typeof POPULAR_PRESETS[0]) => void;
}

export const FormatMatrix: React.FC<FormatMatrixProps> = ({ onSelectPreset }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all');

  const filteredFormats = ALL_FORMATS.filter((f) => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase()) ||
      f.extension.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Title & Description */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          Universal Format Matrix
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          OmniConvert supports bidirectional conversion across raster images, vector graphics, formatted documents, tabular datasets, configuration files, audio waveforms, and AI multimodal extractions.
        </p>
      </div>

      {/* Popular Quick Presets Bar */}
      <div>
        <span className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          Popular Conversion Presets
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {POPULAR_PRESETS.map((preset) => (
            <div
              key={preset.label}
              onClick={() => onSelectPreset?.(preset)}
              className="group p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {preset.label}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{preset.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          {(['all', 'image', 'document', 'data', 'audio'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Formats' : cat.charAt(0).toUpperCase() + cat.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search format or extension..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Formats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredFormats.map((format) => (
          <div
            key={format.id}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center rounded bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-indigo-400">
                    .{format.extension}
                  </span>
                  <span className="text-xs font-semibold text-white truncate">{format.name}</span>
                </div>
                {format.supportsAI && (
                  <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                    <Sparkles className="h-2.5 w-2.5" /> AI Engine
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{format.description}</p>
            </div>

            {/* Unboxed category spec */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="capitalize">{format.category}</span>
              <span className="font-mono">{format.mimeType}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
