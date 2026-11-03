import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, FileText, Music, Database, Sparkles, Clipboard, ArrowDown } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  onAddSample: (type: 'photo' | 'csv' | 'markdown' | 'audio') => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, onAddSample }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        } else if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString((text) => {
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
              const file = new File([text], 'pasted-data.json', { type: 'application/json' });
              onFilesAdded([file]);
            } else if (text.includes(',') && text.includes('\n')) {
              const file = new File([text], 'pasted-table.csv', { type: 'text/csv' });
              onFilesAdded([file]);
            } else if (text.length > 50) {
              const file = new File([text], 'pasted-notes.md', { type: 'text/markdown' });
              onFilesAdded([file]);
            }
          });
        }
      }

      if (pastedFiles.length > 0) {
        onFilesAdded(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesAdded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesAdded(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesAdded(files);
      e.target.value = ''; // reset so same file can be re-uploaded if needed
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/20 shadow-2xl shadow-indigo-500/10 scale-[1.005]'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Upload icon circle */}
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg border border-slate-700/60">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-white mb-2 max-w-xl text-balance">
          Drop any file or image here to convert
        </h3>
        <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
          Drag & drop images, documents, audio, or datasets. You can also paste screenshots or text directly from your clipboard (<span className="font-mono text-xs text-slate-300">Ctrl+V / ⌘V</span>).
        </p>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-colors pointer-events-none"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Select Files from Device</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700/50">
            <Clipboard className="h-3.5 w-3.5 text-indigo-400" />
            <span>Paste clipboard</span>
          </div>
        </div>

        {/* Quiet unboxed metadata line without pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
            Images (PNG, JPG, WebP, SVG, BMP, ICO)
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Docs (PDF, TXT, MD, HTML)
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            Data (CSV, JSON, YAML, XML, SQL)
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <Music className="h-3.5 w-3.5 text-slate-400" />
            Audio (MP3, WAV, Spectrogram)
          </span>
        </div>
      </div>

      {/* Quick sample files row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-400">
          <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
          <span>Quick test with instant sample files:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onAddSample('photo')}
            className="rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Sample Photo (Image)
          </button>
          <button
            type="button"
            onClick={() => onAddSample('csv')}
            className="rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Sample Financial Data (CSV)
          </button>
          <button
            type="button"
            onClick={() => onAddSample('markdown')}
            className="rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Sample Article (Markdown)
          </button>
          <button
            type="button"
            onClick={() => onAddSample('audio')}
            className="rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Sample Sound (WAV)
          </button>
        </div>
      </div>
    </div>
  );
};
