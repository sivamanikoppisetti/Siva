import { FileCategory, FormatDefinition } from '../types/converter';

export const ALL_FORMATS: FormatDefinition[] = [
  // Images
  { id: 'png', name: 'PNG Image', extension: 'png', category: 'image', mimeType: 'image/png', badge: 'PNG', description: 'Lossless with transparent alpha' },
  { id: 'jpg', name: 'JPEG Image', extension: 'jpg', category: 'image', mimeType: 'image/jpeg', badge: 'JPG', description: 'Standard compressed photographic format' },
  { id: 'webp', name: 'WebP Image', extension: 'webp', category: 'image', mimeType: 'image/webp', badge: 'WEBP', description: 'Next-gen web format with high compression' },
  { id: 'bmp', name: 'Bitmap Image', extension: 'bmp', category: 'image', mimeType: 'image/bmp', badge: 'BMP', description: 'Uncompressed raster bitmap' },
  { id: 'ico', name: 'Windows Icon', extension: 'ico', category: 'image', mimeType: 'image/x-icon', badge: 'ICO', description: 'Favicon & application icon' },
  { id: 'svg', name: 'Vector SVG', extension: 'svg', category: 'image', mimeType: 'image/svg+xml', badge: 'SVG', description: 'Scalable vector graphics' },
  { id: 'gif', name: 'GIF Animation / Image', extension: 'gif', category: 'image', mimeType: 'image/gif', badge: 'GIF', description: 'Indexed color graphic' },
  { id: 'ascii', name: 'ASCII Text Art', extension: 'txt', category: 'image', mimeType: 'text/plain', badge: 'ASCII', description: 'Visual art formed by text characters' },
  { id: 'base64', name: 'Base64 Data URI', extension: 'txt', category: 'image', mimeType: 'text/plain', badge: 'B64', description: 'Inline embeddable data URI' },

  // Documents
  { id: 'pdf', name: 'PDF Document', extension: 'pdf', category: 'document', mimeType: 'application/pdf', badge: 'PDF', description: 'Universal printable document format' },
  { id: 'txt', name: 'Plain Text', extension: 'txt', category: 'document', mimeType: 'text/plain', badge: 'TXT', description: 'Unformatted plain text' },
  { id: 'md', name: 'Markdown Document', extension: 'md', category: 'document', mimeType: 'text/markdown', badge: 'MD', description: 'Standard formatted text with headers & links' },
  { id: 'html', name: 'HTML Web Page', extension: 'html', category: 'document', mimeType: 'text/html', badge: 'HTML', description: 'Standard hypertext markup' },
  { id: 'docx', name: 'Word Document', extension: 'docx', category: 'document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', badge: 'DOCX', description: 'Modern Word document' },
  { id: 'latex', name: 'LaTeX Document', extension: 'tex', category: 'document', mimeType: 'text/x-tex', badge: 'TEX', description: 'Scientific typesetting document' },

  // Data & Code
  { id: 'json', name: 'JSON Data', extension: 'json', category: 'data', mimeType: 'application/json', badge: 'JSON', description: 'Structured JavaScript Object Notation' },
  { id: 'csv', name: 'CSV Spreadsheet', extension: 'csv', category: 'data', mimeType: 'text/csv', badge: 'CSV', description: 'Comma-separated tabular spreadsheet' },
  { id: 'tsv', name: 'TSV Spreadsheet', extension: 'tsv', category: 'data', mimeType: 'text/tab-separated-values', badge: 'TSV', description: 'Tab-separated tabular spreadsheet' },
  { id: 'yaml', name: 'YAML Document', extension: 'yaml', category: 'data', mimeType: 'text/yaml', badge: 'YAML', description: 'Human-readable configuration data' },
  { id: 'xml', name: 'XML Data', extension: 'xml', category: 'data', mimeType: 'application/xml', badge: 'XML', description: 'Extensible markup language' },
  { id: 'sql', name: 'SQL Insert Script', extension: 'sql', category: 'data', mimeType: 'application/sql', badge: 'SQL', description: 'Database schema & INSERT statements' },

  // Audio
  { id: 'wav', name: 'WAV Audio', extension: 'wav', category: 'audio', mimeType: 'audio/wav', badge: 'WAV', description: 'Lossless audio waveform' },
  { id: 'mp3', name: 'MP3 Audio', extension: 'mp3', category: 'audio', mimeType: 'audio/mpeg', badge: 'MP3', description: 'Standard compressed audio' },
  { id: 'waveform', name: 'Audio Waveform Image', extension: 'png', category: 'audio', mimeType: 'image/png', badge: 'WAVE', description: 'Visual spectrogram rendering of audio' },
  { id: 'transcript', name: 'Audio Transcript (Text)', extension: 'txt', category: 'audio', mimeType: 'text/plain', badge: 'TRANS', description: 'Transcribed speech text' },

  // AI Transformations
  { id: 'ai-ocr', name: 'AI Vision OCR (Markdown)', extension: 'md', category: 'document', mimeType: 'text/markdown', badge: 'OCR', description: 'Extract tables, handwriting, and text with Gemini', supportsAI: true },
  { id: 'ai-svg', name: 'AI Vector Tracing (SVG)', extension: 'svg', category: 'image', mimeType: 'image/svg+xml', badge: 'AI-SVG', description: 'Recreate image into sharp vector SVG with Gemini', supportsAI: true },
  { id: 'ai-code', name: 'AI Code & Markup Generator', extension: 'html', category: 'code', mimeType: 'text/html', badge: 'AI-CODE', description: 'Convert UI screenshots into clean Tailwind HTML', supportsAI: true },
  { id: 'ai-json', name: 'AI Structured Data Extractor', extension: 'json', category: 'data', mimeType: 'application/json', badge: 'AI-JSON', description: 'Parse receipts, tables, and invoices to JSON', supportsAI: true },
];

export function detectFormat(file: File): { format: string; category: FileCategory; extension: string } {
  const nameParts = file.name.split('.');
  const rawExt = nameParts.length > 1 ? nameParts.pop()!.toLowerCase() : '';
  const mime = file.type.toLowerCase();

  // Extension matching
  let format = rawExt;
  if (rawExt === 'jpeg') format = 'jpg';
  if (rawExt === 'htm') format = 'html';
  if (rawExt === 'text') format = 'txt';
  if (rawExt === 'yml') format = 'yaml';

  // Category identification
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'svg', 'tiff', 'avif'].includes(format)) {
    return { format: format || 'png', category: 'image', extension: rawExt || 'png' };
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'weba'].includes(format)) {
    return { format: format || 'mp3', category: 'audio', extension: rawExt || 'mp3' };
  }
  if (['json', 'csv', 'tsv', 'yaml', 'yml', 'xml', 'sql'].includes(format)) {
    return { format: format || 'json', category: 'data', extension: rawExt || 'json' };
  }
  if (['pdf', 'docx', 'doc', 'txt', 'md', 'rtf', 'tex', 'html'].includes(format) || mime.startsWith('text/')) {
    return { format: format || 'txt', category: 'document', extension: rawExt || 'txt' };
  }

  return { format: format || 'bin', category: 'document', extension: rawExt || 'bin' };
}

export function getCompatibleTargetFormats(sourceFormat: string, category: FileCategory): FormatDefinition[] {
  const normSource = sourceFormat.toLowerCase();

  if (category === 'image') {
    // Images can be converted to other image formats, PDF, ASCII, Base64, and AI transformations!
    return ALL_FORMATS.filter(f => 
      ['png', 'jpg', 'webp', 'bmp', 'ico', 'pdf', 'svg', 'ascii', 'base64', 'ai-ocr', 'ai-svg', 'ai-code', 'ai-json'].includes(f.id) &&
      f.id !== normSource
    );
  }

  if (category === 'document') {
    // Documents can convert to PDF, TXT, HTML, MD, JSON (if structured), or LaTeX
    return ALL_FORMATS.filter(f => 
      ['pdf', 'txt', 'md', 'html', 'json', 'latex', 'base64'].includes(f.id) &&
      f.id !== normSource
    );
  }

  if (category === 'data') {
    // Data files can convert between JSON, CSV, TSV, YAML, XML, SQL, and PDF
    return ALL_FORMATS.filter(f => 
      ['json', 'csv', 'tsv', 'yaml', 'xml', 'sql', 'pdf', 'txt'].includes(f.id) &&
      f.id !== normSource
    );
  }

  if (category === 'audio') {
    // Audio can convert to WAV, Waveform Image, or AI Transcription
    return ALL_FORMATS.filter(f => 
      ['wav', 'waveform', 'transcript', 'base64'].includes(f.id) &&
      f.id !== normSource
    );
  }

  // Fallback: general common outputs
  return ALL_FORMATS.filter(f => ['pdf', 'txt', 'json', 'base64'].includes(f.id) && f.id !== normSource);
}

export const POPULAR_PRESETS = [
  { label: 'Image to WebP', sourceCat: 'image', targetId: 'webp', description: 'Compress photos for web' },
  { label: 'Photo to PDF', sourceCat: 'image', targetId: 'pdf', description: 'Create printable document' },
  { label: 'Image to SVG Vector', sourceCat: 'image', targetId: 'ai-svg', description: 'Recreate as scalable vector' },
  { label: 'Receipt / Image to OCR', sourceCat: 'image', targetId: 'ai-ocr', description: 'Extract text & markdown' },
  { label: 'CSV to JSON', sourceCat: 'data', targetId: 'json', description: 'Transform tables to API data' },
  { label: 'JSON to CSV', sourceCat: 'data', targetId: 'csv', description: 'Export records to spreadsheet' },
  { label: 'Markdown to PDF', sourceCat: 'document', targetId: 'pdf', description: 'Generate formatted PDF' },
  { label: 'Audio to Waveform', sourceCat: 'audio', targetId: 'waveform', description: 'Render sound spectrogram' },
];
