import React, { useState } from 'react';
import { Sparkles, UploadCloud, Copy, Check, Download, Eye, Code, RefreshCw } from 'lucide-react';
import { performAiTransformation, fileToBase64 } from '../utils/aiConverter';
import { downloadBlob } from '../utils/zipExporter';

interface AiStudioSectionProps {
  onAddConvertedItem?: (item: any) => void;
}

export const AiStudioSection: React.FC<AiStudioSectionProps> = () => {
  const [selectedTool, setSelectedTool] = useState<'ai-ocr' | 'ai-svg' | 'ai-code' | 'ai-json'>('ai-svg');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [promptInstructions, setPromptInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tools = [
    {
      id: 'ai-svg' as const,
      title: 'Image to SVG Vector',
      desc: 'Vectorize raster logos, drawings, and photos into scalable SVG code',
      badge: 'SVG Vectorizer',
      promptPlaceholder: 'E.g., Simplify outlines, keep primary brand colors, optimize paths...',
    },
    {
      id: 'ai-ocr' as const,
      title: 'Vision OCR & LaTeX',
      desc: 'Extract handwritten notes, documents, formulas, and tabular reports into Markdown',
      badge: 'OCR & Math',
      promptPlaceholder: 'E.g., Format mathematical expressions with LaTeX syntax ($...$), keep table alignments...',
    },
    {
      id: 'ai-code' as const,
      title: 'UI Mockup to HTML & Tailwind',
      desc: 'Transform wireframes, app screenshots, or UI designs into responsive frontend code',
      badge: 'UI to Tailwind',
      promptPlaceholder: 'E.g., Use clean Tailwind flexbox layout, include hover states, use semantic HTML5...',
    },
    {
      id: 'ai-json' as const,
      title: 'Document & Receipt to JSON',
      desc: 'Parse invoices, order slips, receipts, and forms into strict structured JSON',
      badge: 'Structured Data',
      promptPlaceholder: 'E.g., Extract items with name, quantity, unit price, total, tax, and merchant details...',
    },
  ];

  const currentTool = tools.find((t) => t.id === selectedTool)!;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setResult(null);

      if (selected.type.startsWith('image/')) {
        const url = URL.createObjectURL(selected);
        setPreview(url);
      }
    }
  };

  const handleRunTransformation = async () => {
    if (!file) {
      setError('Please choose an image or document first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await performAiTransformation(file, selectedTool, {
        customPrompt: promptInstructions,
      });
      setResult(res.text);
      setResultBlob(res.blob);
    } catch (err: any) {
      setError(err.message || 'Transformation failed. Ensure the server is connected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (resultBlob && file) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const ext = selectedTool === 'ai-svg' ? 'svg' : selectedTool === 'ai-ocr' ? 'md' : selectedTool === 'ai-json' ? 'json' : 'html';
      downloadBlob(resultBlob, `${baseName}-converted.${ext}`);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Multimodal AI Transformation Lab
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Powered by Gemini 3.8 Flash. Go beyond simple pixel-format conversions: recreate graphics into vector SVG, translate UI screenshots into code, or extract unstructured documents into clean schema.
        </p>
      </div>

      {/* Tool Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTool(t.id);
              setResult(null);
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              selectedTool === t.id
                ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">{t.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Input Box */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <span>1. Choose Source File</span>
              <span className="text-xs text-slate-400 font-normal">{currentTool.badge}</span>
            </h3>

            {/* Drop / Picker */}
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/60 p-6 hover:border-slate-700 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf,.txt,.md,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={preview}
                    alt="Source"
                    className="max-h-40 rounded-lg object-contain shadow-md"
                  />
                  <span className="text-xs text-indigo-400 font-medium truncate max-w-xs">
                    {file?.name}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <UploadCloud className="h-8 w-8 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">Click to upload file</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WebP, PDF or Docs</span>
                </div>
              )}
            </label>

            {/* Prompt customization */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Custom Transformation Instructions (Optional)
              </label>
              <textarea
                rows={3}
                placeholder={currentTool.promptPlaceholder}
                value={promptInstructions}
                onChange={(e) => setPromptInstructions(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            {error && (
              <div className="flex items-start justify-between gap-3 text-xs text-amber-300 mb-3 bg-amber-950/30 p-3 rounded-xl border border-amber-800/50">
                <p className="flex-1 leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={handleRunTransformation}
                  disabled={isProcessing}
                  className="rounded-lg bg-amber-600/30 hover:bg-amber-600/50 px-2.5 py-1 text-[11px] font-semibold text-amber-200 transition-colors shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            <button
              onClick={handleRunTransformation}
              disabled={isProcessing || !file}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing with Gemini 3.8 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Execute {currentTool.title}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Box */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-semibold text-white">2. Transformed Result</h3>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            {isProcessing ? (
              <div className="text-center space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
                <p className="text-xs text-slate-400">Synthesizing structure & code...</p>
              </div>
            ) : result ? (
              <div className="w-full h-full max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs font-mono text-slate-200">
                {selectedTool === 'ai-svg' && result.includes('<svg') ? (
                  <div className="space-y-4">
                    <div
                      className="p-4 bg-slate-900 rounded-lg flex items-center justify-center max-h-48 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: result }}
                    />
                    <pre className="whitespace-pre-wrap text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                      {result}
                    </pre>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap leading-relaxed">{result}</pre>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center max-w-xs">
                Upload a file on the left and click execute to view live AI code or extracted content.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
