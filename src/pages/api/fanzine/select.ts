import type { APIRoute } from 'astro';
import { getCurrentUser, canExportPdf } from '../../../lib/auth';
import { updatePrintSelection } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUser(cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!canExportPdf(user)) {
    return new Response(
      JSON.stringify({ error: 'Permisos insuficientes: sólo administradores pueden configurar la edición de fanzine.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const data = await request.json();
    const selections = data.selections || data.selectedArticleIds;

    if (!Array.isArray(selections)) {
      return new Response(JSON.stringify({ error: 'Se requiere una lista de selecciones de artículos.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await updatePrintSelection(selections);

    return new Response(JSON.stringify({ success: true, count: updated.length, articles: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error al guardar selección' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
