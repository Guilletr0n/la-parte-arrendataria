import type { APIRoute } from 'astro';
import { getUserByEmail, createUser } from '../../../lib/users';
import { setAuthCookie } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json().catch(() => ({}));
    const { email, password, displayName } = data;

    if (!email || !password || !displayName) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son obligatorios (nombre, correo y contraseña).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Ya existe una cuenta con este correo electrónico.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // New registrations always start with role 'reader' (lectora registrada)
    const newUser = await createUser({
      email,
      displayName,
      password,
      role: 'reader',
    });

    // Auto-login upon registration
    setAuthCookie(cookies, {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
    });

    const { password: _, ...safeUser } = newUser;
    return new Response(JSON.stringify({ success: true, user: safeUser }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message || 'Error en el proceso de registro.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
