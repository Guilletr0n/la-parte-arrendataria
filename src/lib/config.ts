/**
 * Centralized Application Configuration
 * All values read from environment variables with sensible defaults.
 */

export const config = {
  // Public Web & Domain Configuration
  siteUrl: (process.env.SITE_URL || (process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'https://www.arrendataria.org')).replace(/\/+$/, ''),
  domain: process.env.DOMAIN ? process.env.DOMAIN.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : 'www.arrendataria.org',

  // Google Cloud Platform
  gcpProjectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'la-parte-arrendataria',
  gcsBucketName: process.env.GCS_BUCKET_NAME || 'la-parte-arrendataria-media',

  // Server
  port: parseInt(process.env.PORT || '4321', 10),
  host: process.env.HOST || '0.0.0.0',
  isProduction: process.env.NODE_ENV === 'production',
};

export function getSiteUrl(): string {
  return config.siteUrl;
}

export function getDomain(): string {
  return config.domain;
}

export function getArticleUrl(slug: string): string {
  return `${config.siteUrl}/articulo/${slug}`;
}
