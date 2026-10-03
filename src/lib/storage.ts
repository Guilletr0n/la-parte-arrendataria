import fs from 'node:fs';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';

const UPLOADS_DIR = path.resolve(process.cwd(), '.data', 'uploads', 'audio');

// Ensure local directory exists
export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

let gcsStorage: Storage | null = null;
const bucketName = process.env.GCS_BUCKET_NAME || 'la-parte-arrendataria-media';

try {
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'la-parte-arrendataria';
  const defaultKeyPath = path.resolve(process.cwd(), 'service-account.json');
  const envKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const keyPath = (envKeyPath && fs.existsSync(envKeyPath)) ? envKeyPath : (fs.existsSync(defaultKeyPath) ? defaultKeyPath : undefined);

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    gcsStorage = new Storage({ projectId, credentials });
  } else if (keyPath) {
    gcsStorage = new Storage({ projectId, keyFilename: keyPath });
  } else if (process.env.K_SERVICE || process.env.NODE_ENV === 'production') {
    // Cloud Run Application Default Credentials
    gcsStorage = new Storage({ projectId });
  }
} catch (e) {
  console.warn('GCS Storage initialization notice: Using local filesystem fallback.', e);
}

/**
 * Uploads an audio buffer to Google Cloud Storage or local fallback
 */
export async function uploadAudio(buffer: Buffer, mimeType: string): Promise<string> {
  let ext = 'webm';
  if (mimeType.includes('mp4') || mimeType.includes('aac') || mimeType.includes('m4a')) {
    ext = 'mp4';
  } else if (mimeType.includes('ogg')) {
    ext = 'ogg';
  } else if (mimeType.includes('wav')) {
    ext = 'wav';
  } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    ext = 'mp3';
  }

  const filename = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

  // Try Google Cloud Storage first if initialized
  if (gcsStorage) {
    try {
      const bucket = gcsStorage.bucket(bucketName);
      const file = bucket.file(`audios/${filename}`);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000',
        },
        resumable: false,
      });

      const publicUrl = `https://storage.googleapis.com/${bucketName}/audios/${filename}`;
      console.log(`[Storage] Audio uploaded to GCS: ${publicUrl}`);
      return publicUrl;
    } catch (gcsError) {
      console.error('[Storage] GCS upload failed, falling back to local disk:', gcsError);
    }
  }

  // Local filesystem fallback
  ensureUploadsDir();
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`[Storage] Audio saved locally: ${filePath}`);

  return `/api/audio/${filename}`;
}

/**
 * Gets a local audio file if it exists
 */
export function getLocalAudioPath(filename: string): string | null {
  ensureUploadsDir();
  const safeFilename = path.basename(filename);
  const filePath = path.join(UPLOADS_DIR, safeFilename);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
