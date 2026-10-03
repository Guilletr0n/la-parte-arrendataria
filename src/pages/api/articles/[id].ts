import type { APIRoute } from 'astro';
import { getCurrentUser, canPublish, canDelete, canEditArticle } from '../../../lib/auth';
import { getArticleById, updateArticle, deleteArticle } from '../../../lib/db';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const user = await getCurrentUser(cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const existing = await getArticleById(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Artículo no encontrado.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check author ownership for editors
  if (!canEditArticle(user, existing.authorUid)) {
    return new Response(
      JSON.stringify({ error: 'Permisos insuficientes: un editor sólo puede modificar los artículos que él ha redactado.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const data = await request.json();
    const updates: any = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.excerpt !== undefined) updates.excerpt = data.excerpt;
    if (data.content !== undefined) updates.content = data.content;
    if (data.photoUrl !== undefined) updates.photoUrl = data.photoUrl;
    if (data.photoCaption !== undefined) updates.photoCaption = data.photoCaption;
    if (data.speakPipeAudioUrl !== undefined) updates.speakPipeAudioUrl = data.speakPipeAudioUrl;
    if (data.sourceUrl !== undefined) updates.sourceUrl = data.sourceUrl;

    if (data.status !== undefined) {
      if (data.status === 'published' && !canPublish(user)) {
        return new Response(
          JSON.stringify({ error: 'Permisos insuficientes: los editores no pueden publicar artículos.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updates.status = data.status;
    }

    const updated = await updateArticle(id, updates);
    return new Response(JSON.stringify({ success: true, article: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error al actualizar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const user = await getCurrentUser(cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // RBAC: Only Admin can delete articles
  if (!canDelete(user)) {
    return new Response(
      JSON.stringify({ error: 'Permisos insuficientes: sólo los administradores pueden eliminar artículos.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const success = await deleteArticle(id);
  if (!success) {
    return new Response(JSON.stringify({ error: 'Artículo no encontrado o no se pudo eliminar.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
