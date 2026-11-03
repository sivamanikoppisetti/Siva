import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileQueue } from './components/FileQueue';
import { ConversionOptionsModal } from './components/ConversionOptionsModal';
import { PreviewModal } from './components/PreviewModal';
import { FormatMatrix } from './components/FormatCatalogModal';
import { AiStudioSection } from './components/AiStudioSection';
import { DataStudioSection } from './components/DataStudioSection';
import { Footer } from './components/Footer';
import { ConvertedFile, ConversionOptions } from './types/converter';
import { detectFormat, getCompatibleTargetFormats } from './utils/formatRegistry';
import { processConversion } from './utils/conversionEngine';
import { createBatchZip, downloadBlob } from './utils/zipExporter';
import { audioToWavBlob } from './utils/documentConverter';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'converter' | 'matrix' | 'ai' | 'data'>('converter');
  const [queue, setQueue] = useState<ConvertedFile[]>([]);
  const [optionsModalItem, setOptionsModalItem] = useState<ConvertedFile | null>(null);
  const [previewModalItem, setPreviewModalItem] = useState<ConvertedFile | null>(null);
  const [isConvertingAll, setIsConvertingAll] = useState(false);

  // Add files to queue with automatic format detection
  const handleFilesAdded = useCallback((files: File[]) => {
    const newItems: ConvertedFile[] = files.map((file) => {
      const { format, category } = detectFormat(file);
      const compatible = getCompatibleTargetFormats(format, category);
      
      // Select sensible default
      let defaultTarget = compatible[0]?.id || 'png';
      if (category === 'image') defaultTarget = format === 'webp' ? 'png' : 'webp';
      else if (format === 'csv') defaultTarget = 'json';
      else if (format === 'json') defaultTarget = 'csv';
      else if (category === 'document') defaultTarget = 'pdf';
      else if (category === 'audio') defaultTarget = 'waveform';

      let previewUrl: string | undefined;
      if (category === 'image') {
        previewUrl = URL.createObjectURL(file);
      }

      return {
        id: Math.random().toString(36).substring(2, 11),
        originalFile: file,
        name: file.name,
        originalSize: file.size,
        originalFormat: format,
        category,
        previewUrl,
        targetFormat: defaultTarget,
        targetCategory: category,
        options: {
          quality: 0.92,
          maintainAspectRatio: true,
          delimiter: ',',
          prettifyJson: true,
          asciiWidth: 80,
        },
        status: 'idle',
        progress: 0,
        executionEngine: 'client',
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
    setActiveTab('converter');
  }, []);

  // Generate instant test samples
  const handleAddSample = useCallback((type: 'photo' | 'csv' | 'markdown' | 'audio') => {
    if (type === 'photo') {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      // Render aesthetic generative mountain landscape
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 800);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#312e81');
      skyGrad.addColorStop(1, '#6366f1');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1200, 800);

      // Sun
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(800, 240, 70, 0, Math.PI * 2);
      ctx.fill();

      // Mountain 1
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(100, 800);
      ctx.lineTo(450, 300);
      ctx.lineTo(800, 800);
      ctx.fill();

      // Mountain 2
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(500, 800);
      ctx.lineTo(850, 380);
      ctx.lineTo(1200, 800);
      ctx.fill();

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'aesthetic-landscape.png', { type: 'image/png' });
          handleFilesAdded([file]);
        }
      }, 'image/png');
    } else if (type === 'csv') {
      const csvContent = `quarter,product,units_sold,revenue,growth_rate
Q1,Enterprise Cloud,1420,426000,0.18
Q2,Edge Compute,2850,712500,0.24
Q3,AI Inference,5600,1680000,0.52
Q4,Storage Vault,8900,1335000,0.12`;
      const file = new File([csvContent], 'quarterly-revenue.csv', { type: 'text/csv' });
      handleFilesAdded([file]);
    } else if (type === 'markdown') {
      const mdContent = `# OmniConvert Project Brief

## 01. Universal Architecture
A high-throughput file conversion engine built with modular browser-native Web APIs and multimodal AI models.

### Key Capabilities
* **Local In-Memory Execution**: WebAssembly & HTML5 Canvas processes files privately without cloud uploads.
* **Smart Multimodal Transformations**: Multimodal extraction parses handwriting, screenshots, and audio via Gemini.
* **Lossless Batch Packaging**: Compresses converted batches directly into a unified ZIP archive.

\`\`\`json
{
  "status": "ready",
  "concurrency": "unlimited",
  "privacy": "client-side"
}
\`\`\`
`;
      const file = new File([mdContent], 'architecture-brief.md', { type: 'text/markdown' });
      handleFilesAdded([file]);
    } else if (type === 'audio') {
      // Create a short synth tone wav
      const sampleRate = 44100;
      const duration = 1.5;
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      const writeStr = (offset: number, s: string) => {
        for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      let offset = 44;
      for (let i = 0; i < numSamples; i++, offset += 2) {
        const t = i / sampleRate;
        // 440Hz + 880Hz pleasant harmonic chord with exponential decay
        const sample = (Math.sin(2 * Math.PI * 440 * t) * 0.5 + Math.sin(2 * Math.PI * 660 * t) * 0.3) * Math.exp(-t * 2);
        view.setInt16(offset, sample * 0x7fff, true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const file = new File([blob], 'harmonic-chime.wav', { type: 'audio/wav' });
      handleFilesAdded([file]);
    }
  }, [handleFilesAdded]);

  // Convert single item
  const handleConvertItem = async (id: string) => {
    const item = queue.find((i) => i.id === id);
    if (!item) return;

    setQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'converting', progress: 10, errorMessage: undefined } : i))
    );

    try {
      const result = await processConversion(item, (prog) => {
        setQueue((prev) => prev.map((i) => (i.id === id ? { ...i, progress: prog } : i)));
      });

      setQueue((prev) => prev.map((i) => (i.id === id ? { ...i, ...result } : i)));
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: 'error', progress: 0, errorMessage: err.message || 'Conversion failed' } : i
        )
      );
    }
  };

  // Convert all idle items
  const handleConvertAll = async () => {
    const idleItems = queue.filter((i) => i.status === 'idle' || i.status === 'error');
    if (idleItems.length === 0) return;

    setIsConvertingAll(true);
    await Promise.all(idleItems.map((item) => handleConvertItem(item.id)));
    setIsConvertingAll(false);
  };

  // Batch download as ZIP
  const handleDownloadZip = async () => {
    const successItems = queue.filter((i) => i.status === 'success');
    if (successItems.length === 0) return;

    const zipBlob = await createBatchZip(successItems);
    downloadBlob(zipBlob, `omniconvert-batch-${Date.now()}.zip`);
  };

  // Remove single item from queue
  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear entire queue
  const handleClearQueue = () => {
    setQueue([]);
  };

  // Change individual target format
  const handleChangeTargetFormat = (id: string, newTarget: string) => {
    setQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, targetFormat: newTarget, status: 'idle', resultBlob: undefined, resultUrl: undefined, resultText: undefined } : i))
    );
  };

  // Set all items to a target format
  const handleSetGlobalTargetFormat = (target: string) => {
    setQueue((prev) =>
      prev.map((i) => ({
        ...i,
        targetFormat: target,
        status: 'idle',
        resultBlob: undefined,
        resultUrl: undefined,
        resultText: undefined,
      }))
    );
  };

  // Save updated options from modal
  const handleSaveOptions = (id: string, newOptions: ConversionOptions) => {
    setQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, options: newOptions, status: 'idle' } : i))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={queue.length}
        onConvertAll={queue.length > 0 ? handleConvertAll : undefined}
        isConverting={isConvertingAll}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* TAB 1: UNIVERSAL CONVERTER */}
        {activeTab === 'converter' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Heading Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-900">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 text-balance">
                  Convert any file or image into anything.
                </h1>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed text-balance">
                  Private, lightning-fast file converter engine. Transform raster images, vector SVG, documents, spreadsheets, data schemas, audio, and OCR handwriting in one unified workspace.
                </p>
              </div>

              {/* Value stats (clean unboxed numbers) */}
              <div className="flex items-center gap-6 text-xs text-slate-400 shrink-0">
                <div>
                  <span className="block font-mono text-lg font-bold text-white tabular-nums">50+</span>
                  <span>Formats</span>
                </div>
                <span aria-hidden="true" className="text-slate-800">·</span>
                <div>
                  <span className="block font-mono text-lg font-bold text-white tabular-nums">100%</span>
                  <span>Private</span>
                </div>
                <span aria-hidden="true" className="text-slate-800">·</span>
                <div>
                  <span className="block font-mono text-lg font-bold text-indigo-400 tabular-nums">0s</span>
                  <span>Queue Wait</span>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <DropZone onFilesAdded={handleFilesAdded} onAddSample={handleAddSample} />

            {/* File Queue Workspace */}
            <FileQueue
              queue={queue}
              onRemoveItem={handleRemoveItem}
              onClearQueue={handleClearQueue}
              onConvertItem={handleConvertItem}
              onConvertAll={handleConvertAll}
              onDownloadZip={handleDownloadZip}
              onOpenOptions={(item) => setOptionsModalItem(item)}
              onOpenPreview={(item) => setPreviewModalItem(item)}
              onChangeTargetFormat={handleChangeTargetFormat}
              onSetGlobalTargetFormat={handleSetGlobalTargetFormat}
              isConvertingAll={isConvertingAll}
            />

            {/* Quick Feature Spotlights */}
            {queue.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8">
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-3">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Browser-Native Speed</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero upload wait times. Standard images, markdown, spreadsheets, and PDF documents process directly in your browser memory via WebAssembly and Canvas.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-3">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">AI Vision & OCR Engine</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Powered by Gemini 3.8 Flash. Convert UI screenshots to responsive Tailwind code, vectorize sketches to clean SVG, or extract tables from invoices to JSON.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-3">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Bulk Batch Archiving</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Convert 50 files simultaneously. Package all transformed files with one click into a structured, compressed ZIP archive ready for download.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FORMAT MATRIX */}
        {activeTab === 'matrix' && (
          <FormatMatrix
            onSelectPreset={(preset) => {
              handleAddSample(preset.sourceCat === 'image' ? 'photo' : preset.sourceCat === 'data' ? 'csv' : 'markdown');
            }}
          />
        )}

        {/* TAB 3: AI MAGIC */}
        {activeTab === 'ai' && <AiStudioSection />}

        {/* TAB 4: DATA STUDIO */}
        {activeTab === 'data' && <DataStudioSection />}
      </main>

      {/* Conversion Options Modal */}
      <ConversionOptionsModal
        item={optionsModalItem}
        onClose={() => setOptionsModalItem(null)}
        onSave={handleSaveOptions}
      />

      {/* Preview Inspection Modal */}
      <PreviewModal
        item={previewModalItem}
        onClose={() => setPreviewModalItem(null)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
