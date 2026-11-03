import React, { useState } from 'react';
import { X, Download, Copy, Check, Eye, Code, FileText, Image as ImageIcon, Volume2 } from 'lucide-react';
import { ConvertedFile } from '../types/converter';
import { downloadBlob, formatBytes } from '../utils/zipExporter';

interface PreviewModalProps {
  item: ConvertedFile | null;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'original'>('preview');

  const hasResult = item.status === 'success' && (item.resultUrl || item.resultText);
  const isImage = item.targetFormat.match(/png|jpg|jpeg|webp|bmp|gif|waveform/i);
  const isSvg = item.targetFormat === 'svg' || item.targetFormat === 'ai-svg';
  const isAudio = item.targetFormat === 'wav' || item.targetFormat === 'mp3';
  const isPdf = item.targetFormat === 'pdf';

  const handleCopy = () => {
    if (item.resultText) {
      navigator.clipboard.writeText(item.resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (item.resultBlob) {
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      const ext = item.targetFormat.replace('ai-', '');
      downloadBlob(item.resultBlob, `${baseName}.${ext}`);
    }
  };

  const sizeDelta = item.resultSize && item.originalSize ? item.resultSize - item.originalSize : 0;
  const percentDelta = item.originalSize && item.resultSize
    ? Math.round(((item.resultSize - item.originalSize) / item.originalSize) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              {isImage ? <ImageIcon className="h-5 w-5" /> : isAudio ? <Volume2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white truncate max-w-md">{item.name}</h3>
              {/* Unboxed metadata line */}
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{item.originalFormat.toUpperCase()}</span>
                <span aria-hidden="true">→</span>
                <span className="font-semibold text-indigo-400 uppercase">{item.targetFormat.replace('ai-', '')}</span>
                <span aria-hidden="true">·</span>
                <span>{formatBytes(item.originalSize)}</span>
                {item.resultSize ? (
                  <>
                    <span aria-hidden="true">→</span>
                    <span className="tabular-nums text-slate-200">{formatBytes(item.resultSize)}</span>
                    <span className={`tabular-nums font-medium ${percentDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      ({percentDelta <= 0 ? `${percentDelta}%` : `+${percentDelta}%`})
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item.resultText && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Tabs if applicable */}
        {(item.resultText || isImage || isSvg) && (
          <div className="flex items-center gap-1 px-6 pt-3 bg-slate-900 border-b border-slate-800/80">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Output Preview</span>
            </button>
            {item.resultText && (
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'code'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Raw Code / Text</span>
              </button>
            )}
            {item.previewUrl && (
              <button
                onClick={() => setActiveTab('original')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'original'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Original File</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60 flex flex-col items-center justify-center min-h-[350px]">
          {activeTab === 'preview' && (
            <div className="w-full flex flex-col items-center justify-center">
              {isImage && item.resultUrl && (
                <div className="relative max-h-[500px] overflow-auto rounded-lg border border-slate-800 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] p-4 flex items-center justify-center">
                  <img
                    src={item.resultUrl}
                    alt={item.name}
                    className="max-h-[460px] max-w-full object-contain rounded shadow-lg"
                  />
                </div>
              )}

              {isSvg && item.resultText && (
                <div
                  className="w-full max-h-[500px] overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-6 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: item.resultText }}
                />
              )}

              {isAudio && item.resultUrl && (
                <div className="w-full max-w-md bg-slate-900 p-6 rounded-xl border border-slate-800 text-center space-y-4">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400">
                    <Volume2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-sm font-medium text-white">{item.name}</h4>
                  <audio controls className="w-full" src={item.resultUrl} />
                </div>
              )}

              {isPdf && item.resultUrl && (
                <div className="w-full h-[520px] rounded-lg border border-slate-800 overflow-hidden bg-slate-900">
                  <iframe src={item.resultUrl} className="w-full h-full" title="PDF Preview" />
                </div>
              )}

              {!isImage && !isSvg && !isAudio && !isPdf && item.resultText && (
                <div className="w-full h-[450px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200">
                  <pre className="whitespace-pre-wrap">{item.resultText}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'code' && item.resultText && (
            <div className="w-full h-[450px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200">
              <pre className="whitespace-pre-wrap">{item.resultText}</pre>
            </div>
          )}

          {activeTab === 'original' && item.previewUrl && (
            <div className="max-h-[500px] overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-4 flex items-center justify-center">
              <img
                src={item.previewUrl}
                alt="Original"
                className="max-h-[460px] max-w-full object-contain rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
