import { ConversionOptions } from '../types/converter';

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

export async function performAiTransformation(
  file: File,
  targetFormat: string,
  options?: ConversionOptions
): Promise<{ text: string; blob: Blob; mimeType: string; extension: string }> {
  const isImage = file.type.startsWith('image/');
  const isAudio = file.type.startsWith('audio/');
  
  let content: string;
  let sourceType: 'image' | 'audio' | 'document' | 'text' = 'text';

  if (isImage) {
    sourceType = 'image';
    content = await fileToBase64(file);
  } else if (isAudio) {
    sourceType = 'audio';
    content = await fileToBase64(file);
  } else {
    sourceType = 'document';
    content = await fileToText(file);
  }

  // Map internal target ID to prompt format
  let formatName = targetFormat;
  let mimeType = 'text/plain';
  let extension = 'txt';

  if (targetFormat === 'ai-ocr') {
    formatName = 'Markdown with OCR extracted text and formatted tables';
    mimeType = 'text/markdown';
    extension = 'md';
  } else if (targetFormat === 'ai-svg') {
    formatName = 'Clean, valid, scalable SVG vector graphic XML';
    mimeType = 'image/svg+xml';
    extension = 'svg';
  } else if (targetFormat === 'ai-code') {
    formatName = 'Clean semantic HTML with modern Tailwind CSS markup matching the image UI';
    mimeType = 'text/html';
    extension = 'html';
  } else if (targetFormat === 'ai-json') {
    formatName = 'Structured JSON parsed from the document content/table/receipt';
    mimeType = 'application/json';
    extension = 'json';
  } else if (targetFormat === 'transcript') {
    formatName = 'Clean audio speech transcription with speaker notes';
    mimeType = 'text/plain';
    extension = 'txt';
  }

  const response = await fetch('/api/ai/transform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceType,
      targetFormat: formatName,
      content,
      mimeType: file.type,
      fileName: file.name,
      options,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Conversion failed on server' }));
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }

  const data = await response.json();
  let resultText = data.result || '';

  // Clean codeblock fences if AI wrapped it in ```markdown or ```xml or ```svg
  if (targetFormat === 'ai-svg' && resultText.includes('<svg')) {
    const svgStart = resultText.indexOf('<svg');
    const svgEnd = resultText.lastIndexOf('</svg>') + 6;
    if (svgStart !== -1 && svgEnd !== -1) {
      resultText = resultText.substring(svgStart, svgEnd);
    }
  } else if (targetFormat === 'ai-json' && resultText.includes('{')) {
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}') + 1;
    if (firstBrace !== -1 && lastBrace !== -1) {
      resultText = resultText.substring(firstBrace, lastBrace);
    }
  } else if (resultText.startsWith('```')) {
    resultText = resultText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
  }

  const blob = new Blob([resultText], { type: mimeType });
  return {
    text: resultText,
    blob,
    mimeType,
    extension,
  };
}
