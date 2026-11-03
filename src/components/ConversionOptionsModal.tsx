import React, { useState } from 'react';
import { X, Sliders, Check, Sparkles } from 'lucide-react';
import { ConvertedFile, ConversionOptions } from '../types/converter';

interface ConversionOptionsModalProps {
  item: ConvertedFile | null;
  onClose: () => void;
  onSave: (id: string, newOptions: ConversionOptions, targetFormat?: string) => void;
}

export const ConversionOptionsModal: React.FC<ConversionOptionsModalProps> = ({
  item,
  onClose,
  onSave,
}) => {
  if (!item) return null;

  const [options, setOptions] = useState<ConversionOptions>({
    quality: item.options.quality ?? 0.92,
    width: item.options.width,
    height: item.options.height,
    maintainAspectRatio: item.options.maintainAspectRatio ?? true,
    filter: item.options.filter ?? 'none',
    asciiWidth: item.options.asciiWidth ?? 80,
    pageSize: item.options.pageSize ?? 'a4',
    orientation: item.options.orientation ?? 'portrait',
    delimiter: item.options.delimiter ?? ',',
    prettifyJson: item.options.prettifyJson ?? true,
    customPrompt: item.options.customPrompt ?? '',
  });

  const handleSave = () => {
    onSave(item.id, options);
    onClose();
  };

  const isImageTarget = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'ico'].includes(item.targetFormat);
  const isPdfTarget = item.targetFormat === 'pdf';
  const isAsciiTarget = item.targetFormat === 'ascii';
  const isDataTarget = ['csv', 'tsv', 'json', 'sql'].includes(item.targetFormat);
  const isAiTarget = item.targetFormat.startsWith('ai-') || item.targetFormat === 'transcript';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Conversion Settings</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{item.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Target Format indicator */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
            <span className="text-slate-400">Target Output Format:</span>
            <span className="font-mono font-semibold text-indigo-400 uppercase tracking-wide">
              {item.targetFormat}
            </span>
          </div>

          {/* Image Settings */}
          {isImageTarget && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Compression & Quality</span>
                  <span className="font-mono text-indigo-400">{Math.round((options.quality ?? 0.92) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={options.quality ?? 0.92}
                  onChange={(e) => setOptions({ ...options, quality: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Smaller File Size</span>
                  <span>Max Quality</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Dimensions (Optional Resize)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400">Width (px)</span>
                    <input
                      type="number"
                      placeholder="Original"
                      value={options.width || ''}
                      onChange={(e) => setOptions({ ...options, width: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Height (px)</span>
                    <input
                      type="number"
                      placeholder="Original"
                      value={options.height || ''}
                      onChange={(e) => setOptions({ ...options, height: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.maintainAspectRatio ?? true}
                    onChange={(e) => setOptions({ ...options, maintainAspectRatio: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Lock original aspect ratio</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Color Tone Filter</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'grayscale', 'sepia', 'invert', 'vintage'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setOptions({ ...options, filter })}
                      className={`rounded-lg px-3 py-2 text-xs font-medium capitalize border transition-all cursor-pointer ${
                        options.filter === filter
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ASCII Target Settings */}
          {isAsciiTarget && (
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>ASCII Art Character Width</span>
                <span className="font-mono text-indigo-400">{options.asciiWidth} cols</span>
              </div>
              <input
                type="range"
                min="40"
                max="160"
                step="10"
                value={options.asciiWidth ?? 80}
                onChange={(e) => setOptions({ ...options, asciiWidth: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Smaller width is ideal for terminal displays and chat. Larger width captures sharper contrast and fine contours.
              </p>
            </div>
          )}

          {/* PDF Target Settings */}
          {isPdfTarget && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['portrait', 'landscape'] as const).map((ori) => (
                    <button
                      key={ori}
                      type="button"
                      onClick={() => setOptions({ ...options, orientation: ori })}
                      className={`rounded-lg px-3 py-2 text-xs font-medium capitalize border transition-all cursor-pointer ${
                        options.orientation === ori
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ori}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Page Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['a4', 'letter'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setOptions({ ...options, pageSize: sz })}
                      className={`rounded-lg px-3 py-2 text-xs font-medium uppercase border transition-all cursor-pointer ${
                        options.pageSize === sz
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Data Settings */}
          {isDataTarget && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">CSV / TSV Delimiter</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Comma (,)', val: ',' },
                    { label: 'Semicolon (;)', val: ';' },
                    { label: 'Tab (\\t)', val: '\t' },
                  ].map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setOptions({ ...options, delimiter: d.val as any })}
                      className={`rounded-lg px-2 py-2 text-xs font-medium border transition-all cursor-pointer ${
                        options.delimiter === d.val
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={options.prettifyJson ?? true}
                  onChange={(e) => setOptions({ ...options, prettifyJson: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                />
                <span>Prettify JSON output with indentation</span>
              </label>
            </div>
          )}

          {/* AI Settings */}
          {isAiTarget && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gemini AI Custom Instructions (Optional)</span>
              </div>
              <textarea
                rows={3}
                placeholder="E.g., Keep colors minimal, add comments, translate extracted text to Spanish, or output strict TypeScript interfaces..."
                value={options.customPrompt || ''}
                onChange={(e) => setOptions({ ...options, customPrompt: e.target.value })}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
