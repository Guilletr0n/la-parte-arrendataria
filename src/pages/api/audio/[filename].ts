import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { getLocalAudioPath } from '../../../lib/storage';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { filename } = params;
  if (!filename) {
    return new Response('Not Found', { status: 404 });
  }

  const filePath = getLocalAudioPath(filename);
  if (!filePath) {
    return new Response('Audio file not found', { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let mimeType = 'audio/webm';
  if (ext === '.mp4' || ext === '.m4a') mimeType = 'audio/mp4';
  else if (ext === '.ogg') mimeType = 'audio/ogg';
  else if (ext === '.mp3') mimeType = 'audio/mpeg';
  else if (ext === '.wav') mimeType = 'audio/wav';

  const fileStream = fs.readFileSync(filePath);

  return new Response(fileStream, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': stat.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
