import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/auth';
import { getUserById, updateUser } from '../../../lib/users';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionUser = await getCurrentUser(cookies);
  if (!sessionUser) {
    return new Response(JSON.stringify({ error: 'Debes iniciar sesión para cambiar tu contraseña.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = data;

    if (!currentPassword) {
      return new Response(JSON.stringify({ error: 'Debes introducir tu contraseña actual.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (newPassword !== confirmPassword) {
      return new Response(JSON.stringify({ error: 'La nueva contraseña y su repetición no coinciden.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify current password from database
    const dbUser = await getUserById(sessionUser.uid);
    const expectedPassword = dbUser?.password || (sessionUser.role === 'admin' ? 'admin123' : sessionUser.role === 'editor' ? 'editor123' : null);
    if (expectedPassword && currentPassword !== expectedPassword) {
      return new Response(JSON.stringify({ error: 'La contraseña actual no es correcta.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update password in DB (Firestore & local fallback)
    const updated = await updateUser(sessionUser.uid, { password: newPassword });
    if (!updated) {
      return new Response(JSON.stringify({ error: 'No se pudo actualizar la contraseña en la base de datos.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: '¡Contraseña cambiada con éxito!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error al procesar la solicitud.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
