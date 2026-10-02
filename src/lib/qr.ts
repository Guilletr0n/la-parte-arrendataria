import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const QRCode = require('qrcode');

export async function generateQrDataUrl(url: string): Promise<string> {
  if (!url) return '';
  try {
    return await QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export async function generateQrSvg(url: string): Promise<string> {
  if (!url) return '';
  try {
    return await QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR SVG:', err);
    return '';
  }
}
