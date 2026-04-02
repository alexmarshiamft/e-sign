import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function embedSignaturesIntoPdf(
  base64Pdf: string,
  fields: Array<{
    type: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    value?: string;
    signatureDataUrl?: string;
  }>,
  pageDimensions: Array<{ width: number; height: number }>
): Promise<string> {
  const pdfBytes = base64ToArrayBuffer(base64Pdf);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    const pageIndex = field.pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Dimensions provided are percentages of the rendered container,
    // but we need them relative to the actual PDF page.
    const dims = pageDimensions[pageIndex];
    if (!dims) continue;

    const scaleX = pageWidth / dims.width;
    const scaleY = pageHeight / dims.height;

    const xPx = field.x * dims.width;
    const yPx = field.y * dims.height;
    const wPx = field.width * dims.width;
    const hPx = field.height * dims.height;

    // Convert from top-left origin to PDF bottom-left origin
    const pdfX = xPx * scaleX;
    const pdfY = pageHeight - (yPx + hPx) * scaleY;
    const pdfW = wPx * scaleX;
    const pdfH = hPx * scaleY;

    if (field.type === 'signature' || field.type === 'initials') {
      if (field.signatureDataUrl) {
        try {
          const imgData = dataUrlToBytes(field.signatureDataUrl);
          const mimeType = field.signatureDataUrl.split(';')[0].split(':')[1];
          let pdfImage;
          if (mimeType === 'image/png') {
            pdfImage = await pdfDoc.embedPng(imgData);
          } else {
            pdfImage = await pdfDoc.embedJpg(imgData);
          }
          page.drawImage(pdfImage, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });
        } catch {
          // fall through to text fallback
        }
      }
    } else if (field.type === 'text') {
      if (field.value) {
        const fontSize = Math.min(pdfH * 0.6, 12);
        page.drawText(field.value, {
          x: pdfX + 2,
          y: pdfY + pdfH / 2 - fontSize / 2,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }
    } else if (field.type === 'date') {
      const dateStr = field.value || new Date().toLocaleDateString();
      const fontSize = Math.min(pdfH * 0.6, 12);
      page.drawText(dateStr, {
        x: pdfX + 2,
        y: pdfY + pdfH / 2 - fontSize / 2,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  const signedBytes = await pdfDoc.save();
  return arrayBufferToBase64(signedBytes);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // strip data URI prefix if present
  const b64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryStr = atob(b64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  // Use chunked approach to avoid "Maximum call stack size exceeded" on large files
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export function downloadBlob(base64: string, filename: string) {
  const bytes = base64ToArrayBuffer(base64);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
