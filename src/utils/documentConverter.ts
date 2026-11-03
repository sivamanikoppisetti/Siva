import { jsPDF } from 'jspdf';
import { ConversionOptions } from '../types/converter';

// Convert text or markdown to PDF with clean styling and pagination
export function textToPdfBlob(text: string, title: string = 'Document', options?: ConversionOptions): Blob {
  const pdf = new jsPDF({
    orientation: options?.orientation || 'portrait',
    unit: 'pt',
    format: options?.pageSize || 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Header / Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(30, 41, 59);
  pdf.text(title.replace(/\.[^/.]+$/, ''), margin, cursorY);
  cursorY += 28;

  // Hairline separator
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(1);
  pdf.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 24;

  // Body content
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(51, 65, 85);

  const lines = text.split('\n');
  for (const rawLine of lines) {
    // Check if line looks like a markdown heading
    if (rawLine.startsWith('# ')) {
      cursorY += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.setTextColor(15, 23, 42);
      pdf.text(rawLine.replace(/^#\s+/, ''), margin, cursorY);
      cursorY += 18;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(51, 65, 85);
      continue;
    } else if (rawLine.startsWith('## ')) {
      cursorY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(30, 41, 59);
      pdf.text(rawLine.replace(/^##\s+/, ''), margin, cursorY);
      cursorY += 16;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(51, 65, 85);
      continue;
    }

    const wrapped = pdf.splitTextToSize(rawLine || ' ', contentWidth);
    for (const wLine of wrapped) {
      if (cursorY > pageHeight - margin - 20) {
        pdf.addPage();
        cursorY = margin;
      }
      pdf.text(wLine, margin, cursorY);
      cursorY += 15;
    }
  }

  return pdf.output('blob');
}

// Markdown to HTML conversion
export function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-slate-800 my-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-900 my-3 pb-1 border-b border-slate-200">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-slate-950 my-4">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="px-1.5 py-0.5 bg-slate-100 text-slate-800 font-mono text-xs rounded">$1</code>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto my-3">$1</pre>')
    .replace(/^\s*\n\*/gm, '<ul>\n*')
    .replace(/^(\*.+)\s*\n([^\*])/gm, '$1\n</ul>\n\n$2')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-700">$1</li>')
    .replace(/^\s*\n\d\./gm, '<ol>\n1.')
    .replace(/^(\d\..+)\s*\n([^\d\.])/gm, '$1\n</ol>\n\n$2')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-slate-700">$1</li>')
    .replace(/\n$/gim, '<br />');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Converted Document</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1, h2, h3 { color: #0f172a; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
    code { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

// HTML to Markdown
export function htmlToMarkdown(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(processNode).join('');

    switch (tag) {
      case 'h1': return `\n# ${children.trim()}\n\n`;
      case 'h2': return `\n## ${children.trim()}\n\n`;
      case 'h3': return `\n### ${children.trim()}\n\n`;
      case 'p': return `\n${children.trim()}\n\n`;
      case 'strong': case 'b': return `**${children}**`;
      case 'em': case 'i': return `*${children}*`;
      case 'code': return `\`${children}\``;
      case 'pre': return `\n\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
      case 'li': return `- ${children.trim()}\n`;
      case 'ul': return `\n${children}\n`;
      case 'ol': return `\n${children}\n`;
      case 'br': return `\n`;
      case 'hr': return `\n---\n\n`;
      case 'a': return `[${children}](${el.getAttribute('href') || '#'})`;
      default: return children;
    }
  }

  return processNode(tempDiv).trim();
}

// CSV to JSON
export function csvToJson(csv: string, delimiter: string = ','): any[] {
  const lines = csv.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse header line respecting quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: Record<string, any> = {};
    headers.forEach((header, idx) => {
      let val: any = values[idx] ?? '';
      // Parse numbers/booleans if applicable
      if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
      else if (val.toLowerCase() === 'true') val = true;
      else if (val.toLowerCase() === 'false') val = false;
      obj[header || `col_${idx + 1}`] = val;
    });
    rows.push(obj);
  }

  return rows;
}

// JSON to CSV
export function jsonToCsv(jsonInput: any, delimiter: string = ','): string {
  let array: any[] = [];
  if (typeof jsonInput === 'string') {
    try {
      array = JSON.parse(jsonInput);
    } catch {
      throw new Error('Invalid JSON format');
    }
  } else {
    array = jsonInput;
  }

  if (!Array.isArray(array)) {
    array = [array];
  }

  if (array.length === 0) return '';

  // Extract all distinct keys
  const keys = Array.from(
    new Set(array.flatMap(item => (typeof item === 'object' && item !== null ? Object.keys(item) : ['value'])))
  );

  const escapeVal = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = keys.map(k => escapeVal(k)).join(delimiter);
  const dataRows = array.map(item => {
    if (typeof item !== 'object' || item === null) {
      return escapeVal(item);
    }
    return keys.map(k => escapeVal(item[k])).join(delimiter);
  });

  return [headerRow, ...dataRows].join('\n');
}

// JSON to YAML
export function jsonToYaml(obj: any, indent: number = 0): string {
  let parsed = obj;
  if (typeof obj === 'string') {
    try {
      parsed = JSON.parse(obj);
    } catch {
      return obj;
    }
  }

  const spaces = ' '.repeat(indent);
  if (parsed === null) return 'null\n';
  if (typeof parsed !== 'object') return `${JSON.stringify(parsed)}\n`;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return '[]\n';
    return parsed.map(item => `${spaces}- ${jsonToYaml(item, indent + 2).trimStart()}`).join('');
  }

  const entries = Object.entries(parsed);
  if (entries.length === 0) return '{}\n';
  return entries.map(([key, val]) => {
    if (typeof val === 'object' && val !== null) {
      return `${spaces}${key}:\n${jsonToYaml(val, indent + 2)}`;
    }
    return `${spaces}${key}: ${JSON.stringify(val)}\n`;
  }).join('');
}

// YAML to JSON (basic robust parser)
export function yamlToJson(yamlStr: string): any {
  const lines = yamlStr.split('\n');
  const root: Record<string, any> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > -1) {
      const key = trimmed.slice(0, colonIndex).trim();
      let val: any = trimmed.slice(colonIndex + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      else if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
      else if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      root[key] = val;
    }
  }
  return root;
}

// JSON to XML
export function jsonToXml(obj: any, rootName: string = 'root'): string {
  let data = obj;
  if (typeof obj === 'string') {
    try { data = JSON.parse(obj); } catch { data = { content: obj }; }
  }

  function toXmlNodes(val: any, tag: string): string {
    if (val === null || val === undefined) return `<${tag}/>`;
    if (Array.isArray(val)) {
      return val.map(item => toXmlNodes(item, tag)).join('\n');
    }
    if (typeof val === 'object') {
      const inner = Object.entries(val).map(([k, v]) => toXmlNodes(v, k)).join('\n');
      return `<${tag}>\n${inner}\n</${tag}>`;
    }
    const escaped = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<${tag}>${escaped}</${tag}>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${toXmlNodes(data, rootName)}`;
}

// JSON/CSV to SQL INSERT script
export function toSqlInsert(records: any[], tableName: string = 'records'): string {
  if (!records || records.length === 0) return `-- No records to insert`;
  const keys = Object.keys(records[0]);
  const columns = keys.map(k => `\`${k}\``).join(', ');

  const escapeSql = (val: any) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const values = records.map(r => {
    const rowVals = keys.map(k => escapeSql(r[k])).join(', ');
    return `  (${rowVals})`;
  }).join(',\n');

  return `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n${keys.map(k => `  \`${k}\` TEXT`).join(',\n')}\n);\n\nINSERT INTO \`${tableName}\` (${columns}) VALUES\n${values};\n`;
}

// Render Audio file to visual waveform spectrogram PNG image
export async function audioToWaveformImage(file: File, width: number = 800, height: number = 240): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#020617');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < width; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += 40) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Draw audio waveform channels
  const channelData = audioBuffer.getChannelData(0);
  const step = Math.ceil(channelData.length / width);
  const amp = height / 2.2;
  const centerY = height / 2;

  // Wave gradient
  const waveGradient = ctx.createLinearGradient(0, 0, width, 0);
  waveGradient.addColorStop(0, '#6366f1');
  waveGradient.addColorStop(0.5, '#a855f7');
  waveGradient.addColorStop(1, '#06b6d4');

  ctx.fillStyle = waveGradient;

  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    const startIdx = i * step;
    for (let j = 0; j < step; j++) {
      const datum = channelData[startIdx + j] || 0;
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    const barHeight = Math.max(2, (max - min) * amp);
    ctx.fillRect(i, centerY - barHeight / 2, 1, barHeight);
  }

  // Baseline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

// Convert Audio to standard WAV file with Web Audio API
export async function audioToWavBlob(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const interleaved = interleaveChannels(audioBuffer);
  const dataByteLength = interleaved.length * (bitDepth / 8);
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // BlockAlign
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function interleaveChannels(audioBuffer: AudioBuffer): Float32Array {
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * channels;
  const result = new Float32Array(length);

  for (let i = 0; i < audioBuffer.length; i++) {
    for (let c = 0; c < channels; c++) {
      result[i * channels + c] = audioBuffer.getChannelData(c)[i];
    }
  }
  return result;
}
