import type { APIRoute } from 'astro';
import { getArticleById, incrementArticleVote } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json().catch(() => ({}));
    const { articleId } = data;

    if (!articleId || typeof articleId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Identificador de artículo obligatorio (articleId).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const article = await getArticleById(articleId);
    if (!article) {
      return new Response(
        JSON.stringify({ error: 'Artículo no encontrado.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (article.status !== 'published') {
      return new Response(
        JSON.stringify({ error: 'Sólo se pueden apoyar artículos publicados.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newVoteCount = await incrementArticleVote(articleId);

    return new Response(
      JSON.stringify({
        success: true,
        articleId,
        votes: newVoteCount,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error procesando voto:', err);
    return new Response(
      JSON.stringify({ error: 'Error del servidor al registrar el apoyo popular.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
