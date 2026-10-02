import type { AstroCookies } from 'astro';
import type { User, UserRole } from './types';
import admin from 'firebase-admin';

const AUTH_COOKIE_NAME = 'lpa_session_user';

// Mock credentials for zero-config local operation & staging tests
const SYSTEM_USERS: User[] = [
  {
    uid: 'user-admin-01',
    email: 'admin@lapartearrendataria.org',
    displayName: 'Comité Editorial (Admin)',
    role: 'admin',
  },
  {
    uid: 'user-editor-01',
    email: 'editor@lapartearrendataria.org',
    displayName: 'Redacción Guerrilla (Editor)',
    role: 'editor',
  },
];

export async function authenticateWithPassword(email: string, pass: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Check local mock users for rapid development & fallback
  if (cleanEmail === 'admin@lapartearrendataria.org' && pass === 'admin123') {
    return SYSTEM_USERS[0];
  }
  if (cleanEmail === 'editor@lapartearrendataria.org' && pass === 'editor123') {
    return SYSTEM_USERS[1];
  }

  // 2. Check Firebase Auth if configured
  try {
    if (admin.apps.length) {
      const fbUser = await admin.auth().getUserByEmail(cleanEmail);
      if (fbUser) {
        const customClaims = fbUser.customClaims || {};
        const role: UserRole = customClaims.role === 'admin' ? 'admin' : 'editor';
        return {
          uid: fbUser.uid,
          email: fbUser.email || cleanEmail,
          displayName: fbUser.displayName || cleanEmail.split('@')[0],
          role,
        };
      }
    }
  } catch (err) {
    console.warn('Firebase Auth verify notice:', err);
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

export function canEditArticle(user: User | null, articleAuthorUid?: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'editor') {
    // Editor can edit draft articles
    return true;
  }
  return false;
}
