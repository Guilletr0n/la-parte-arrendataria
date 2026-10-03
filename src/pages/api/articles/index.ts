import type { APIRoute } from 'astro';
import { getCurrentUser, canPublish, canCreateArticle } from '../../../lib/auth';
import { createArticle, getArticles } from '../../../lib/db';
import type { ArticleStatus } from '../../../lib/types';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const statusParam = url.searchParams.get('status') as ArticleStatus | null;
  const articles = await getArticles(statusParam ? { status: statusParam } : undefined);
  return new Response(JSON.stringify(articles), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUser(cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado. Debes iniciar sesión.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!canCreateArticle(user)) {
    return new Response(JSON.stringify({ error: 'Permisos insuficientes: una cuenta lectora no tiene permisos de redacción.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json();
    const { title, excerpt, content, photoUrl, photoCaption, audioUrl, speakPipeAudioUrl, sourceUrl, status, isAudioOnly, tags } = data;
    const finalAudioUrl = audioUrl || speakPipeAudioUrl || '';
    const audioOnly = !!isAudioOnly || (Array.isArray(tags) && tags.includes('audio'));

    if (!title) {
      return new Response(JSON.stringify({ error: 'El título es obligatorio.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (audioOnly) {
      if (!finalAudioUrl) {
        return new Response(JSON.stringify({ error: 'Una nota de audio requiere haber grabado un clip de voz.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      if (!content) {
        return new Response(JSON.stringify({ error: 'Título y contenido son obligatorios para artículos de prensa.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // RBAC: Editors can only create drafts. Only Admins can set status to 'published'.
    let finalStatus: ArticleStatus = 'draft';
    if (status === 'published') {
      if (canPublish(user)) {
        finalStatus = 'published';
      } else {
        return new Response(
          JSON.stringify({ error: 'Permisos insuficientes: el rol Editor sólo puede guardar borradores.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const finalTags = Array.isArray(tags) ? tags : (audioOnly ? ['audio'] : []);

    const newArticle = await createArticle({
      title,
      slug: slug || 'articulo-' + Date.now(),
      author: user.displayName || user.email.split('@')[0],
      authorRole: user.role,
      authorUid: user.uid,
      excerpt: excerpt || (audioOnly ? 'Nota de voz de crónica y contrainformación inquilina (máx. 2 min).' : ''),
      content: content || (audioOnly ? 'Nota de voz de 2 minutos grabada para La Parte Arrendataria.' : ''),
      photoUrl: photoUrl || '',
      photoCaption: photoCaption || '',
      audioUrl: finalAudioUrl,
      speakPipeAudioUrl: finalAudioUrl,
      sourceUrl: sourceUrl || '',
      status: finalStatus,
      isAudioOnly: audioOnly,
      tags: finalTags,
    });

    return new Response(JSON.stringify({ success: true, article: newArticle }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error al crear artículo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
