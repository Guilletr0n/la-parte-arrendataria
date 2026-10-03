import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/auth';
import { uploadAudio } from '../../../lib/storage';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUser(cookies);
  if (!user || user.role === 'reader') {
    return new Response(JSON.stringify({ error: 'No tienes permisos para subir notas de voz.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;
    let mimeType = 'audio/webm';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('audio') as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: 'No se ha proporcionado archivo de audio.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      mimeType = file.type || 'audio/webm';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Direct raw binary upload
      mimeType = contentType || 'audio/webm';
      const arrayBuffer = await request.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    if (!buffer || buffer.length === 0) {
      return new Response(JSON.stringify({ error: 'El archivo de audio está vacío.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Limit to 10MB (2 minutes of compressed audio is typically < 1MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'El archivo de audio supera el límite de 10 MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const audioUrl = await uploadAudio(buffer, mimeType);

    return new Response(JSON.stringify({ success: true, audioUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error uploading audio:', err);
    return new Response(JSON.stringify({ error: err.message || 'Error al procesar el audio' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
