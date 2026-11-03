export type FileCategory = 'image' | 'document' | 'audio' | 'data' | 'code' | 'archive';

export interface FormatDefinition {
  id: string; // e.g. 'png', 'webp', 'pdf'
  name: string; // e.g. 'Portable Network Graphics'
  extension: string; // '.png'
  category: FileCategory;
  mimeType: string;
  badge: string; // 'PNG'
  description: string;
  supportsAI?: boolean;
}

export type ConversionStatus = 'idle' | 'converting' | 'success' | 'error';

export interface ConversionOptions {
  // Image options
  quality?: number; // 0.1 to 1.0 (default 0.9)
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  filter?: 'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage';
  asciiWidth?: number; // for ascii art conversion

  // PDF options
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';

  // Delimiter for CSV / Data
  delimiter?: ',' | ';' | '\t';
  prettifyJson?: boolean;

  // AI instructions
  aiMode?: 'ocr' | 'svg' | 'code' | 'summary' | 'table' | 'transcribe';
  customPrompt?: string;
}

export interface ConvertedFile {
  id: string;
  originalFile: File;
  name: string;
  originalSize: number;
  originalFormat: string;
  category: FileCategory;
  previewUrl?: string; // object URL or data URL
  
  targetFormat: string;
  targetCategory: FileCategory;
  options: ConversionOptions;
  
  status: ConversionStatus;
  progress: number; // 0 to 100
  errorMessage?: string;
  
  resultBlob?: Blob;
  resultUrl?: string;
  resultSize?: number;
  resultText?: string; // For text/code/svg/json
  resultType?: 'blob' | 'text';
  executionEngine: 'client' | 'ai';
  convertedAt?: number;
}
