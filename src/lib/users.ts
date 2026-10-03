import fs from 'node:fs';
import path from 'node:path';
import type { User, UserRole } from './types';
import { Firestore } from '@google-cloud/firestore';
import { reassignAuthorArticles, updateAuthorDisplayName } from './db.ts';

// Initialize Google Cloud Firestore connection
let firestoreDb: Firestore | null = null;

try {
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'la-parte-arrendataria';
  const defaultKeyPath = path.resolve(process.cwd(), 'service-account.json');
  const envKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const keyPath = (envKeyPath && fs.existsSync(envKeyPath)) ? envKeyPath : (fs.existsSync(defaultKeyPath) ? defaultKeyPath : undefined);

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    firestoreDb = new Firestore({
      projectId,
      credentials,
      databaseId: '(default)',
    });
  } else if (keyPath) {
    firestoreDb = new Firestore({
      projectId,
      keyFilename: keyPath,
      databaseId: '(default)',
    });
  } else if (process.env.K_SERVICE || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    firestoreDb = new Firestore({
      projectId,
      databaseId: '(default)',
    });
  }
} catch (e) {
  console.warn('Firestore users init notice: using local fallback', e);
}

// Local persistent JSON storage fallback
const DATA_DIR = path.resolve(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const INITIAL_USERS: User[] = [
  {
    uid: 'user-admin-01',
    email: 'arrendataria@zohomail.eu',
    displayName: 'Comité Editorial (Admin)',
    role: 'admin',
    password: 'admin123',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  {
    uid: 'user-editor-01',
    email: 'editor@lapartearrendataria.org',
    displayName: 'Redacción Guerrilla (Editor)',
    role: 'editor',
    password: 'editor123',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
];

function ensureUsersFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(INITIAL_USERS, null, 2), 'utf-8');
  }
}

function readLocalUsers(): User[] {
  ensureUsersFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

function writeLocalUsers(users: User[]) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export async function getUsers(): Promise<User[]> {
  if (firestoreDb) {
    try {
      const snap = await firestoreDb.collection('users').get();
      if (!snap.empty) {
        const users = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        return users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
      } else {
        // Seed Firestore if empty
        const initial = readLocalUsers();
        for (const u of initial) {
          await firestoreDb.collection('users').doc(u.uid).set(u);
        }
        return initial;
      }
    } catch (e) {
      console.warn('Firestore getUsers error, using local file', e);
    }
  }

  const list = readLocalUsers();
  return list.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
}

export async function getUserById(uid: string): Promise<User | null> {
  if (firestoreDb) {
    try {
      const doc = await firestoreDb.collection('users').doc(uid).get();
      if (doc.exists) {
        return { uid: doc.id, ...doc.data() } as User;
      }
    } catch (e) {
      console.warn('Firestore getUserById error', e);
    }
  }

  const list = readLocalUsers();
  return list.find(u => u.uid === uid) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();

  if (firestoreDb) {
    try {
      const snap = await firestoreDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        return { uid: doc.id, ...doc.data() } as User;
      }
    } catch (e) {
      console.warn('Firestore getUserByEmail error', e);
    }
  }

  const list = readLocalUsers();
  return list.find(u => u.email.trim().toLowerCase() === cleanEmail) || null;
}

export async function createUser(data: {
  email: string;
  displayName: string;
  password?: string;
  role?: UserRole;
}): Promise<User> {
  const now = new Date().toISOString();
  const uid = 'user-' + Math.random().toString(36).substring(2, 9);
  const newUser: User = {
    uid,
    email: data.email.trim().toLowerCase(),
    displayName: data.displayName.trim(),
    role: data.role || 'reader',
    password: data.password || 'reader123',
    createdAt: now,
    updatedAt: now,
  };

  if (firestoreDb) {
    try {
      await firestoreDb.collection('users').doc(uid).set(newUser);
    } catch (e) {
      console.warn('Firestore createUser error', e);
    }
  }

  const list = readLocalUsers();
  list.push(newUser);
  writeLocalUsers(list);

  return newUser;
}

export async function updateUser(
  uid: string,
  updates: Partial<Pick<User, 'email' | 'displayName' | 'role' | 'password'>>
): Promise<User | null> {
  const now = new Date().toISOString();
  const cleanUpdates: any = { updatedAt: now };

  if (updates.email !== undefined) cleanUpdates.email = updates.email.trim().toLowerCase();
  if (updates.displayName !== undefined) cleanUpdates.displayName = updates.displayName.trim();
  if (updates.role !== undefined) cleanUpdates.role = updates.role;
  if (updates.password !== undefined) cleanUpdates.password = updates.password;

  if (firestoreDb) {
    try {
      await firestoreDb.collection('users').doc(uid).set(cleanUpdates, { merge: true });
    } catch (e) {
      console.warn('Firestore updateUser error', e);
    }
  }

  const list = readLocalUsers();
  const index = list.findIndex(u => u.uid === uid);
  if (index === -1) return null;

  const updated: User = {
    ...list[index],
    ...cleanUpdates,
  };
  list[index] = updated;
  writeLocalUsers(list);

  // If displayName changed, also update all published/draft articles authored by this user
  if (updates.displayName) {
    await updateAuthorDisplayName(uid, updates.displayName.trim());
  }

  return updated;
}

export async function deleteUser(uid: string): Promise<boolean> {
  // 1. Reassign all articles of this user to the Admin Editorial Committee
  await reassignAuthorArticles(uid, {
    uid: 'user-admin-01',
    name: 'Comité Editorial (Admin)',
    role: 'admin',
  });

  // 2. Delete user from Firestore
  if (firestoreDb) {
    try {
      await firestoreDb.collection('users').doc(uid).delete();
    } catch (e) {
      console.warn('Firestore deleteUser error', e);
    }
  }

  // 3. Delete user from local file store
  const list = readLocalUsers();
  const filtered = list.filter(u => u.uid !== uid);
  if (filtered.length === list.length) return false;

  writeLocalUsers(filtered);
  return true;
}
