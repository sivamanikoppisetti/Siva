import JSZip from 'jszip';
import { ConvertedFile } from '../types/converter';

export async function createBatchZip(files: ConvertedFile[]): Promise<Blob> {
  const zip = new JSZip();

  for (const item of files) {
    if (item.status !== 'success') continue;

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}.${item.targetFormat.replace('ai-', '')}`;

    if (item.resultBlob) {
      zip.file(filename, item.resultBlob);
    } else if (item.resultText) {
      zip.file(filename, item.resultText);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
