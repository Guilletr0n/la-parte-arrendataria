import type { APIRoute } from 'astro';
import { getCurrentUser, canPublish } from '../../../lib/auth';
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

  try {
    const data = await request.json();
    const { title, excerpt, content, photoUrl, photoCaption, speakPipeAudioUrl, sourceUrl, status } = data;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Título y contenido son obligatorios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    const newArticle = await createArticle({
      title,
      slug: slug || 'articulo-' + Date.now(),
      author: user.displayName || user.email.split('@')[0],
      authorRole: user.role,
      authorUid: user.uid,
      excerpt: excerpt || '',
      content,
      photoUrl: photoUrl || '',
      photoCaption: photoCaption || '',
      speakPipeAudioUrl: speakPipeAudioUrl || '',
      sourceUrl: sourceUrl || '',
      status: finalStatus,
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
