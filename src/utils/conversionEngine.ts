import { ConvertedFile } from '../types/converter';
import {
  loadImageFromFile,
  drawToCanvas,
  canvasToBlob,
  canvasToBmpBlob,
  canvasToIcoBlob,
  imageToAscii,
  imageToPdfBlob,
  imageToSvgXml,
} from './imageConverter';
import {
  textToPdfBlob,
  markdownToHtml,
  htmlToMarkdown,
  csvToJson,
  jsonToCsv,
  jsonToYaml,
  yamlToJson,
  jsonToXml,
  toSqlInsert,
  audioToWaveformImage,
  audioToWavBlob,
} from './documentConverter';
import { performAiTransformation, fileToBase64, fileToText } from './aiConverter';

export async function processConversion(
  item: ConvertedFile,
  onProgress?: (progress: number) => void
): Promise<Partial<ConvertedFile>> {
  const { originalFile, category, targetFormat, options } = item;
  onProgress?.(15);

  // Check if AI target format is requested
  if (targetFormat.startsWith('ai-') || targetFormat === 'transcript') {
    onProgress?.(35);
    const aiResult = await performAiTransformation(originalFile, targetFormat, options);
    onProgress?.(100);

    return {
      status: 'success',
      progress: 100,
      resultText: aiResult.text,
      resultBlob: aiResult.blob,
      resultUrl: URL.createObjectURL(aiResult.blob),
      resultSize: aiResult.blob.size,
      resultType: targetFormat === 'ai-svg' ? 'blob' : 'text',
      executionEngine: 'ai',
      convertedAt: Date.now(),
    };
  }

  // IMAGE SOURCE CONVERSIONS
  if (category === 'image') {
    onProgress?.(30);

    if (targetFormat === 'base64') {
      const b64 = await fileToBase64(originalFile);
      const blob = new Blob([b64], { type: 'text/plain' });
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultText: b64,
        resultBlob: blob,
        resultUrl: URL.createObjectURL(blob),
        resultSize: blob.size,
        resultType: 'text',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    }

    const img = await loadImageFromFile(originalFile);
    onProgress?.(50);
    const canvas = drawToCanvas(img, options);
    onProgress?.(70);

    let resultBlob: Blob;
    let resultText: string | undefined;
    let resultType: 'blob' | 'text' = 'blob';

    if (targetFormat === 'bmp') {
      resultBlob = canvasToBmpBlob(canvas);
    } else if (targetFormat === 'ico') {
      resultBlob = await canvasToIcoBlob(canvas);
    } else if (targetFormat === 'pdf') {
      resultBlob = await imageToPdfBlob(canvas);
    } else if (targetFormat === 'svg') {
      resultText = imageToSvgXml(canvas);
      resultBlob = new Blob([resultText], { type: 'image/svg+xml' });
      resultType = 'text';
    } else if (targetFormat === 'ascii') {
      resultText = imageToAscii(canvas, options.asciiWidth || 80);
      resultBlob = new Blob([resultText], { type: 'text/plain' });
      resultType = 'text';
    } else {
      // png, jpg, webp, gif
      const quality = options.quality !== undefined ? options.quality : 0.92;
      resultBlob = await canvasToBlob(canvas, targetFormat, quality);
    }

    onProgress?.(100);
    return {
      status: 'success',
      progress: 100,
      resultBlob,
      resultText,
      resultUrl: URL.createObjectURL(resultBlob),
      resultSize: resultBlob.size,
      resultType,
      executionEngine: 'client',
      convertedAt: Date.now(),
    };
  }

  // AUDIO SOURCE CONVERSIONS
  if (category === 'audio') {
    onProgress?.(40);
    if (targetFormat === 'waveform') {
      const resultBlob = await audioToWaveformImage(originalFile);
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultBlob,
        resultUrl: URL.createObjectURL(resultBlob),
        resultSize: resultBlob.size,
        resultType: 'blob',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    } else if (targetFormat === 'wav') {
      const resultBlob = await audioToWavBlob(originalFile);
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultBlob,
        resultUrl: URL.createObjectURL(resultBlob),
        resultSize: resultBlob.size,
        resultType: 'blob',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    } else if (targetFormat === 'base64') {
      const b64 = await fileToBase64(originalFile);
      const blob = new Blob([b64], { type: 'text/plain' });
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultText: b64,
        resultBlob: blob,
        resultUrl: URL.createObjectURL(blob),
        resultSize: blob.size,
        resultType: 'text',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    }
  }

  // DATA SOURCE CONVERSIONS (JSON, CSV, YAML, XML, SQL)
  if (category === 'data') {
    onProgress?.(40);
    const text = await fileToText(originalFile);
    let resultText = '';
    let mimeType = 'text/plain';

    if (targetFormat === 'json') {
      if (item.originalFormat === 'csv' || item.originalFormat === 'tsv') {
        const delimiter = item.originalFormat === 'tsv' ? '\t' : (options.delimiter || ',');
        const parsed = csvToJson(text, delimiter);
        resultText = JSON.stringify(parsed, null, options.prettifyJson !== false ? 2 : 0);
      } else if (item.originalFormat === 'yaml' || item.originalFormat === 'yml') {
        const parsed = yamlToJson(text);
        resultText = JSON.stringify(parsed, null, 2);
      } else {
        resultText = text;
      }
      mimeType = 'application/json';
    } else if (targetFormat === 'csv') {
      if (item.originalFormat === 'json') {
        resultText = jsonToCsv(text, options.delimiter || ',');
      } else {
        resultText = text;
      }
      mimeType = 'text/csv';
    } else if (targetFormat === 'yaml') {
      let data: any = text;
      if (item.originalFormat === 'csv') {
        data = csvToJson(text, ',');
      }
      resultText = jsonToYaml(data);
      mimeType = 'text/yaml';
    } else if (targetFormat === 'xml') {
      let data: any = text;
      if (item.originalFormat === 'csv') {
        data = csvToJson(text, ',');
      }
      resultText = jsonToXml(data, 'dataset');
      mimeType = 'application/xml';
    } else if (targetFormat === 'sql') {
      let records: any[] = [];
      if (item.originalFormat === 'json') {
        try { records = JSON.parse(text); } catch { records = []; }
      } else {
        records = csvToJson(text, options.delimiter || ',');
      }
      const tableName = item.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      resultText = toSqlInsert(records, tableName);
      mimeType = 'application/sql';
    } else if (targetFormat === 'pdf') {
      const pdfBlob = textToPdfBlob(text, item.name, options);
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultBlob: pdfBlob,
        resultUrl: URL.createObjectURL(pdfBlob),
        resultSize: pdfBlob.size,
        resultType: 'blob',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    }

    const blob = new Blob([resultText], { type: mimeType });
    onProgress?.(100);
    return {
      status: 'success',
      progress: 100,
      resultText,
      resultBlob: blob,
      resultUrl: URL.createObjectURL(blob),
      resultSize: blob.size,
      resultType: 'text',
      executionEngine: 'client',
      convertedAt: Date.now(),
    };
  }

  // DOCUMENT SOURCE CONVERSIONS (PDF, TXT, MD, HTML, DOCX)
  if (category === 'document') {
    onProgress?.(40);
    const text = await fileToText(originalFile);

    if (targetFormat === 'pdf') {
      const pdfBlob = textToPdfBlob(text, item.name, options);
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultBlob: pdfBlob,
        resultUrl: URL.createObjectURL(pdfBlob),
        resultSize: pdfBlob.size,
        resultType: 'blob',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    } else if (targetFormat === 'html') {
      const html = markdownToHtml(text);
      const blob = new Blob([html], { type: 'text/html' });
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultText: html,
        resultBlob: blob,
        resultUrl: URL.createObjectURL(blob),
        resultSize: blob.size,
        resultType: 'text',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    } else if (targetFormat === 'md') {
      const md = htmlToMarkdown(text);
      const blob = new Blob([md], { type: 'text/markdown' });
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultText: md,
        resultBlob: blob,
        resultUrl: URL.createObjectURL(blob),
        resultSize: blob.size,
        resultType: 'text',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    } else if (targetFormat === 'txt') {
      const plain = text.replace(/<[^>]+>/g, '').replace(/[#*_`]/g, '');
      const blob = new Blob([plain], { type: 'text/plain' });
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultText: plain,
        resultBlob: blob,
        resultUrl: URL.createObjectURL(blob),
        resultSize: blob.size,
        resultType: 'text',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    } else if (targetFormat === 'base64') {
      const b64 = await fileToBase64(originalFile);
      const blob = new Blob([b64], { type: 'text/plain' });
      onProgress?.(100);
      return {
        status: 'success',
        progress: 100,
        resultText: b64,
        resultBlob: blob,
        resultUrl: URL.createObjectURL(blob),
        resultSize: blob.size,
        resultType: 'text',
        executionEngine: 'client',
        convertedAt: Date.now(),
      };
    }
  }

  // Fallback direct text/base64 wrap
  const fallbackText = await fileToText(originalFile);
  const blob = new Blob([fallbackText], { type: 'text/plain' });
  onProgress?.(100);
  return {
    status: 'success',
    progress: 100,
    resultText: fallbackText,
    resultBlob: blob,
    resultUrl: URL.createObjectURL(blob),
    resultSize: blob.size,
    resultType: 'text',
    executionEngine: 'client',
    convertedAt: Date.now(),
  };
}
