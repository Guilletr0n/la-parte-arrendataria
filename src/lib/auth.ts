import type { AstroCookies } from 'astro';
import type { User, UserRole } from './types';
import { getUserByEmail } from './users';

const AUTH_COOKIE_NAME = 'lpa_session_user';

export async function authenticateWithPassword(email: string, pass: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Look up user in persistent store (Firestore / local JSON)
  const dbUser = await getUserByEmail(cleanEmail);
  if (dbUser) {
    if (dbUser.password && dbUser.password === pass) {
      return {
        uid: dbUser.uid,
        email: dbUser.email,
        displayName: dbUser.displayName,
        role: dbUser.role,
      };
    }
  }

  // 2. Fallback to initial credentials for rapid development
  if (cleanEmail === 'admin@lapartearrendataria.org' && pass === 'admin123') {
    return {
      uid: 'user-admin-01',
      email: 'admin@lapartearrendataria.org',
      displayName: 'Comité Editorial (Admin)',
      role: 'admin',
    };
  }
  if (cleanEmail === 'editor@lapartearrendataria.org' && pass === 'editor123') {
    return {
      uid: 'user-editor-01',
      email: 'editor@lapartearrendataria.org',
      displayName: 'Redacción Guerrilla (Editor)',
      role: 'editor',
    };
  }

  return null;
}

export function setAuthCookie(cookies: AstroCookies, user: User) {
  cookies.set(AUTH_COOKIE_NAME, JSON.stringify(user), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearAuthCookie(cookies: AstroCookies) {
  cookies.delete(AUTH_COOKIE_NAME, {
    path: '/',
  });
}

export async function getCurrentUser(cookies: AstroCookies): Promise<User | null> {
  const cookie = cookies.get(AUTH_COOKIE_NAME);
  if (!cookie || !cookie.value) return null;

  try {
    const user = JSON.parse(cookie.value) as User;
    return user;
  } catch {
    return null;
  }
}

// RBAC Permissions Checkers
export function canPublish(user: User | null): boolean {
  return user?.role === 'admin';
}

export function canDelete(user: User | null): boolean {
  return user?.role === 'admin';
}

export function canExportPdf(user: User | null): boolean {
  return user?.role === 'admin';
}

export function canManageUsers(user: User | null): boolean {
  return user?.role === 'admin';
}

export function canCreateArticle(user: User | null): boolean {
  return user?.role === 'admin' || user?.role === 'editor';
}

export function canEditArticle(user: User | null, articleAuthorUid?: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'editor') {
    // Un usuario editor puede editar los que él ha subido, no los de los demás
    return !!articleAuthorUid && articleAuthorUid === user.uid;
  }
  return false;
}

