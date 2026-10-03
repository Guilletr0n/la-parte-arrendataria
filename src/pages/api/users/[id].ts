import type { APIRoute } from 'astro';
import { getCurrentUser, canManageUsers } from '../../../lib/auth';
import { getUserById, updateUser, deleteUser } from '../../../lib/users';
import type { UserRole } from '../../../lib/types';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const currentUser = await getCurrentUser(cookies);
  if (!currentUser || !canManageUsers(currentUser)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de usuaria inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const target = await getUserById(id);
  if (!target) {
    return new Response(JSON.stringify({ error: 'Usuaria no encontrada.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json();
    const updates: Partial<{ email: string; displayName: string; role: UserRole; password?: string }> = {};

    if (data.email !== undefined && data.email.trim()) {
      updates.email = data.email.trim().toLowerCase();
    }
    if (data.displayName !== undefined && data.displayName.trim()) {
      updates.displayName = data.displayName.trim();
    }
    if (data.role !== undefined) {
      const validRoles: UserRole[] = ['admin', 'editor', 'reader'];
      if (!validRoles.includes(data.role)) {
        return new Response(JSON.stringify({ error: 'Rol no válido. Opciones: admin, editor, reader.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Safety: Prevent removing last admin role from oneself
      if (currentUser.uid === id && data.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'No puedes degradar tu propia cuenta de administradora activa.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updates.role = data.role;
    }
    if (data.password !== undefined && data.password.trim()) {
      updates.password = data.password.trim();
    }

    const updated = await updateUser(id, updates);
    if (!updated) {
      return new Response(JSON.stringify({ error: 'No se pudo actualizar la usuaria.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { password: _, ...safeUser } = updated;
    return new Response(JSON.stringify({ success: true, user: safeUser }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Error al actualizar usuaria' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const currentUser = await getCurrentUser(cookies);
  if (!currentUser || !canManageUsers(currentUser)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de usuaria inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (currentUser.uid === id) {
    return new Response(JSON.stringify({ error: 'No puedes eliminar tu propia cuenta de administradora en sesión.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const target = await getUserById(id);
  if (!target) {
    return new Response(JSON.stringify({ error: 'Usuaria no encontrada.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // deleteUser automatically reassigns all articles authored by this user to 'Comité Editorial (Admin)'
    const ok = await deleteUser(id);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'No se pudo eliminar la usuaria.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuaria eliminada. Todos sus artículos fueron reasignados automáticamente al Comité Editorial (Admin).`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Error al eliminar usuaria' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
