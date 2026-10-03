import { createRequire } from 'node:module';
import { getSiteUrl, getDomain, getArticleUrl } from './config.ts';

const require = createRequire(import.meta.url);
const QRCode = require('qrcode');

export { getSiteUrl, getDomain };

/**
 * Returns the public web URL for a given article slug.
 */
export function getArticleWebUrl(slug: string): string {
  return getArticleUrl(slug);
}

/**
 * Determines the target URL that the QR code should point to.
 * 1. If an explicit sourceUrl is defined on the article, uses that.
 * 2. Otherwise, defaults to the digital article URL on the website (configured via SITE_URL / DOMAIN env vars).
 */
export function getArticleQrTargetUrl(article: { sourceUrl?: string; slug: string }): string {
  if (article.sourceUrl && article.sourceUrl.trim().length > 0) {
    return article.sourceUrl.trim();
  }
  return getArticleUrl(article.slug);
}

/**
 * Generates a Data URL (base64 image/png) for a QR code from any given URL.
 */
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

/**
 * Generates an SVG string for a QR code from any given URL.
 */
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

/**
 * Generates a QR code pointing directly to the website homepage.
 */
export async function generateSiteQrDataUrl(): Promise<string> {
  return generateQrDataUrl(getSiteUrl());
}
