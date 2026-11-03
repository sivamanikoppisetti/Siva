import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Music,
  Database,
  Trash2,
  Play,
  Download,
  Eye,
  Sliders,
  Archive,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ConvertedFile, FileCategory } from '../types/converter';
import { ALL_FORMATS, getCompatibleTargetFormats } from '../utils/formatRegistry';
import { formatBytes, downloadBlob } from '../utils/zipExporter';

interface FileQueueProps {
  queue: ConvertedFile[];
  onRemoveItem: (id: string) => void;
  onClearQueue: () => void;
  onConvertItem: (id: string) => void;
  onConvertAll: () => void;
  onDownloadZip: () => void;
  onOpenOptions: (item: ConvertedFile) => void;
  onOpenPreview: (item: ConvertedFile) => void;
  onChangeTargetFormat: (id: string, newTarget: string) => void;
  onSetGlobalTargetFormat: (target: string) => void;
  isConvertingAll: boolean;
}

export const FileQueue: React.FC<FileQueueProps> = ({
  queue,
  onRemoveItem,
  onClearQueue,
  onConvertItem,
  onConvertAll,
  onDownloadZip,
  onOpenOptions,
  onOpenPreview,
  onChangeTargetFormat,
  onSetGlobalTargetFormat,
  isConvertingAll,
}) => {
  if (queue.length === 0) return null;

  const successCount = queue.filter((i) => i.status === 'success').length;
  const isAnyConverting = queue.some((i) => i.status === 'converting');

  const getCategoryIcon = (cat: FileCategory) => {
    switch (cat) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-emerald-400" />;
      case 'document':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'audio':
        return <Music className="h-4 w-4 text-purple-400" />;
      case 'data':
      case 'code':
        return <Database className="h-4 w-4 text-amber-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full mt-8 space-y-4">
      {/* Batch Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-400">
            {queue.length} {queue.length === 1 ? 'file' : 'files'} in queue
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          
          {/* Universal Format Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Set all to:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onSetGlobalTargetFormat(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Select target format...</option>
              <optgroup label="Images">
                <option value="webp">WebP (Compressed)</option>
                <option value="png">PNG (Lossless)</option>
                <option value="jpg">JPG (Photo)</option>
                <option value="bmp">BMP (Bitmap)</option>
                <option value="ico">ICO (Favicon)</option>
                <option value="ascii">ASCII Text Art</option>
              </optgroup>
              <optgroup label="Documents">
                <option value="pdf">PDF Document</option>
                <option value="txt">Plain Text</option>
                <option value="md">Markdown</option>
                <option value="html">HTML</option>
              </optgroup>
              <optgroup label="Data">
                <option value="json">JSON Data</option>
                <option value="csv">CSV Spreadsheet</option>
                <option value="yaml">YAML</option>
                <option value="xml">XML</option>
                <option value="sql">SQL INSERT Script</option>
              </optgroup>
              <optgroup label="AI Transformations">
                <option value="ai-ocr">AI Vision OCR (Markdown)</option>
                <option value="ai-svg">AI Vector Tracing (SVG)</option>
                <option value="ai-code">AI Code Generator (HTML/Tailwind)</option>
                <option value="ai-json">AI Structured Data (JSON)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          {successCount > 0 && (
            <button
              onClick={onDownloadZip}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-750 hover:text-white transition-colors cursor-pointer"
            >
              <Archive className="h-3.5 w-3.5 text-indigo-400" />
              <span>Download ZIP ({successCount})</span>
            </button>
          )}

          <button
            onClick={onConvertAll}
            disabled={isAnyConverting}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isAnyConverting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>{isAnyConverting ? 'Converting...' : 'Convert All'}</span>
          </button>

          <button
            onClick={onClearQueue}
            disabled={isAnyConverting}
            title="Clear Queue"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* File Item Rows */}
      <div className="space-y-2.5">
        {queue.map((item) => {
          const compatibleFormats = getCompatibleTargetFormats(item.originalFormat, item.category);
          const percentDelta =
            item.originalSize && item.resultSize
              ? Math.round(((item.resultSize - item.originalSize) / item.originalSize) * 100)
              : 0;

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                item.status === 'converting'
                  ? 'bg-slate-900/90 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                  : item.status === 'success'
                  ? 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700'
                  : item.status === 'error'
                  ? 'bg-rose-950/20 border-rose-900/50'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Left Column: File Info & Preview */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getCategoryIcon(item.category)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate max-w-xs md:max-w-md">
                      {item.name}
                    </span>
                    {item.targetFormat.startsWith('ai-') && (
                      <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                        <Sparkles className="h-2.5 w-2.5" /> AI
                      </span>
                    )}
                  </div>

                  {/* Clean unboxed metadata line */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="uppercase font-mono text-[11px] text-slate-300">
                      {item.originalFormat}
                    </span>
                    <span aria-hidden="true" className="text-slate-700">·</span>
                    <span className="tabular-nums font-mono text-[11px]">
                      {formatBytes(item.originalSize)}
                    </span>

                    {item.status === 'success' && item.resultSize && (
                      <>
                        <span aria-hidden="true" className="text-slate-700">→</span>
                        <span className="tabular-nums font-mono text-[11px] text-indigo-300 font-semibold">
                          {formatBytes(item.resultSize)}
                        </span>
                        <span
                          className={`tabular-nums font-mono text-[11px] font-medium ${
                            percentDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          ({percentDelta <= 0 ? `${percentDelta}%` : `+${percentDelta}%`})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Column: Target Format & Settings */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 sm:inline hidden">To:</span>
                <select
                  value={item.targetFormat}
                  disabled={item.status === 'converting'}
                  onChange={(e) => onChangeTargetFormat(item.id, e.target.value)}
                  className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {compatibleFormats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.badge} - {f.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  title="Conversion Options"
                  onClick={() => onOpenOptions(item)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  <Sliders className="h-4 w-4" />
                </button>
              </div>

              {/* Right Column: Actions & Progress */}
              <div className="flex items-center gap-2 shrink-0 justify-end">
                {item.status === 'idle' && (
                  <button
                    onClick={() => onConvertItem(item.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    <Play className="h-3 w-3" />
                    <span>Convert</span>
                  </button>
                )}

                {item.status === 'converting' && (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-indigo-500/30">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    <span className="text-xs font-mono text-indigo-300 tabular-nums">
                      {item.progress}%
                    </span>
                  </div>
                )}

                {item.status === 'success' && (
                  <>
                    <button
                      onClick={() => onOpenPreview(item)}
                      title="Inspect Result"
                      className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => {
                        if (item.resultBlob) {
                          const baseName = item.name.replace(/\.[^/.]+$/, '');
                          const ext = item.targetFormat.replace('ai-', '');
                          downloadBlob(item.resultBlob, `${baseName}.${ext}`);
                        }
                      }}
                      title="Download Converted File"
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </>
                )}

                {item.status === 'error' && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-rose-400 truncate max-w-xs">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.errorMessage || 'Conversion failed'}</span>
                    </span>
                    <button
                      onClick={() => onConvertItem(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Retry"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  title="Remove"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={item.status === 'converting'}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
