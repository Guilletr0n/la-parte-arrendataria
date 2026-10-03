import type { APIRoute } from 'astro';
import { getCurrentUser, canManageUsers } from '../../../lib/auth';
import { getUsers, createUser } from '../../../lib/users';
import type { UserRole } from '../../../lib/types';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getCurrentUser(cookies);
  if (!user || !canManageUsers(user)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado: sólo para administradoras.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const users = await getUsers();
  // Strip sensitive fields
  const safeUsers = users.map(({ password, ...rest }) => rest);

  return new Response(JSON.stringify(safeUsers), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUser(cookies);
  if (!user || !canManageUsers(user)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado: sólo para administradoras.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json();
    const { email, displayName, role, password } = data;

    if (!email || !displayName) {
      return new Response(JSON.stringify({ error: 'Email y nombre público son obligatorios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validRoles: UserRole[] = ['admin', 'editor', 'reader'];
    const assignedRole: UserRole = validRoles.includes(role) ? role : 'reader';

    const newUser = await createUser({
      email,
      displayName,
      role: assignedRole,
      password: password || 'lpa' + Math.random().toString(36).substring(2, 7),
    });

    const { password: _, ...safeUser } = newUser;
    return new Response(JSON.stringify({ success: true, user: safeUser }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Error al crear usuaria' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
