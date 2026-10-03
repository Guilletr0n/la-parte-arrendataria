export type UserRole = 'admin' | 'editor' | 'reader';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ArticleStatus = 'draft' | 'published';

export type FanzineCategory = 'destacado' | 'portada' | 'interior' | 'none';

export interface Article {
  id: string;
  title: string;
  slug: string;
  author: string;
  authorRole: UserRole;
  authorUid?: string;
  excerpt?: string; // Extracto para el feed público
  content: string; // Markdown
  photoUrl: string; // Restricción de 1 foto
  photoCaption?: string;
  speakPipeAudioUrl?: string; // Voice-note SpeakPipe (máx. 2 min)
  sourceUrl?: string; // Enlace a fuente original (usado para QR en PDF)
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
  selectedForPrint?: boolean;
  printOrder?: number;
  fanzineCategory?: FanzineCategory;
  includeInInterior?: boolean;
  votes?: number;
}

export interface FanzineIssue {
  id: string;
  number: string;
  title: string;
  date: string;
  articleIds: string[];
  createdAt: string;
}
