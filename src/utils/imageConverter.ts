import { jsPDF } from 'jspdf';
import { ConversionOptions } from '../types/converter';

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file: ' + err));
    };
    img.src = url;
  });
}

// Applies filters and resize onto canvas
export function drawToCanvas(
  img: HTMLImageElement,
  options?: ConversionOptions
): HTMLCanvasElement {
  let targetWidth = options?.width || img.naturalWidth || img.width;
  let targetHeight = options?.height || img.naturalHeight || img.height;

  if (options?.maintainAspectRatio && options.width && !options.height) {
    const ratio = img.naturalHeight / img.naturalWidth;
    targetHeight = Math.round(options.width * ratio);
  } else if (options?.maintainAspectRatio && options.height && !options.width) {
    const ratio = img.naturalWidth / img.naturalHeight;
    targetWidth = Math.round(options.height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, targetWidth);
  canvas.height = Math.max(1, targetHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Draw base image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Apply visual filters if requested
  if (options?.filter && options.filter !== 'none') {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (options.filter === 'grayscale') {
        const avg = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      } else if (options.filter === 'sepia') {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      } else if (options.filter === 'invert') {
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      } else if (options.filter === 'vintage') {
        data[i] = Math.min(255, r * 1.1 + 15);
        data[i + 1] = Math.min(255, g * 0.95);
        data[i + 2] = Math.min(255, b * 0.8);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}

// Convert canvas to Blob based on format
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  targetFormat: string,
  quality: number = 0.92
): Promise<Blob> {
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
  };

  const mime = mimeMap[targetFormat.toLowerCase()] || 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas serialization failed'));
      },
      mime,
      quality
    );
  });
}

// Generate genuine binary BMP blob
export function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BMP Header
  view.setUint16(0, 0x4d42, false); // "BM"
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true); // reserved
  view.setUint32(10, 54, true); // pixel offset

  // DIB Header (BITMAPINFOHEADER)
  view.setUint32(14, 40, true); // DIB header size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // positive = bottom-to-top
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bits per pixel (24-bit RGB)
  view.setUint32(30, 0, true); // BI_RGB (no compression)
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // ~72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // Fill pixel data bottom to top
  const uint8 = new Uint8Array(buffer);
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    let rowOffset = offset;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      uint8[rowOffset++] = data[i + 2]; // Blue
      uint8[rowOffset++] = data[i + 1]; // Green
      uint8[rowOffset++] = data[i];     // Red
    }
    offset += rowSize;
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

// Convert canvas to ICO icon container
export async function canvasToIcoBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  // ICO wrapping PNG payload (standard modern Windows format)
  // Scale down to max 256x256 if larger
  let iconCanvas = canvas;
  if (canvas.width > 256 || canvas.height > 256) {
    iconCanvas = document.createElement('canvas');
    iconCanvas.width = 128;
    iconCanvas.height = 128;
    const ictx = iconCanvas.getContext('2d')!;
    ictx.drawImage(canvas, 0, 0, 128, 128);
  }

  const pngBlob = await canvasToBlob(iconCanvas, 'png');
  const pngArrayBuffer = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngArrayBuffer);

  // ICO header: 6 bytes + 16 bytes directory entry + png data
  const totalLength = 6 + 16 + pngBytes.length;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type: 1 for Icon (.ICO)
  view.setUint16(4, 1, true); // 1 Image entry

  // ICONDIRENTRY
  const w = iconCanvas.width >= 256 ? 0 : iconCanvas.width;
  const h = iconCanvas.height >= 256 ? 0 : iconCanvas.height;
  view.setUint8(6, w);
  view.setUint8(7, h);
  view.setUint8(8, 0); // Palette count
  view.setUint8(9, 0); // Reserved
  view.setUint16(10, 1, true); // Color planes
  view.setUint16(12, 32, true); // Bits per pixel
  view.setUint32(14, pngBytes.length, true); // Size of image data in bytes
  view.setUint32(18, 22, true); // Offset of image data (6 + 16 = 22)

  const outputBytes = new Uint8Array(buffer);
  outputBytes.set(pngBytes, 22);

  return new Blob([buffer], { type: 'image/x-icon' });
}

// Convert image to ASCII text art
export function imageToAscii(canvas: HTMLCanvasElement, targetCharWidth: number = 80): string {
  const chars = '@%#*+=-:. ';
  const aspect = canvas.height / canvas.width;
  const charHeight = Math.max(1, Math.round(targetCharWidth * aspect * 0.55)); // 0.55 compensates for font height

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = targetCharWidth;
  tempCanvas.height = charHeight;
  const ctx = tempCanvas.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0, targetCharWidth, charHeight);

  const imgData = ctx.getImageData(0, 0, targetCharWidth, charHeight);
  const data = imgData.data;

  let ascii = '';
  for (let y = 0; y < charHeight; y++) {
    for (let x = 0; x < targetCharWidth; x++) {
      const idx = (y * targetCharWidth + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const avg = 0.299 * r + 0.587 * g + 0.114 * b;
      const charIdx = Math.floor((avg / 255) * (chars.length - 1));
      ascii += chars[charIdx];
    }
    ascii += '\n';
  }

  return ascii;
}

// Convert image to PDF document
export async function imageToPdfBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const isLandscape = canvas.width > canvas.height;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;

  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;

  let imgWidth = canvas.width;
  let imgHeight = canvas.height;

  const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
  const renderWidth = imgWidth * scale;
  const renderHeight = imgHeight * scale;

  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight);

  return pdf.output('blob');
}

// Convert canvas to SVG container
export function imageToSvgXml(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/png');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}" />
</svg>`;
}
