import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface MediaItem {
  id: string; // Unique file ID / storageKey
  userId: string; // User ID
  section: string; // Page/section name
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  savedFileName: string;
  title: string;
  description: string;
  mediaType: 'video' | 'audio' | 'pdf' | 'image';
  uploadDate: string; // YYYY-MM-DD
  uploadTime: string; // HH:MM:SS
  uploadedAt: string; // ISO string
  uploadStatus: 'saved' | 'uploading' | 'synced';
}

export interface SessionData {
  token: string;
  email: string;
  role: 'OWNER';
  createdAt: number;
  lastActiveAt: number;
}

export const isVercel = !!process.env.VERCEL;

// Storage directories
export const BASE_UPLOADS_DIR = path.join(process.cwd(), 'uploads');
export const BASE_DATA_DIR = path.join(process.cwd(), 'data');

// On Vercel, the filesystem is read-only except /tmp
export const UPLOADS_DIR = isVercel ? '/tmp/uploads' : BASE_UPLOADS_DIR;
export const DATA_DIR = isVercel ? '/tmp/data' : BASE_DATA_DIR;

export const DB_FILE = path.join(DATA_DIR, 'media_db.json');
export const NOTES_FILE = path.join(DATA_DIR, 'notes_db.json');
export const SESSIONS_FILE = path.join(DATA_DIR, 'sessions_db.json');
export const AUTH_CONFIG_FILE = path.join(DATA_DIR, 'auth_config.json');
export const CHUNKS_DIR = path.join(UPLOADS_DIR, '.chunks');

// Initialize directories and copy seed data if in Vercel
export function initStorage() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    if (isVercel && fs.existsSync(BASE_DATA_DIR)) {
      ['media_db.json', 'notes_db.json', 'sessions_db.json', 'auth_config.json'].forEach((file) => {
        const src = path.join(BASE_DATA_DIR, file);
        const dest = path.join(DATA_DIR, file);
        if (fs.existsSync(src) && !fs.existsSync(dest)) {
          try {
            fs.copyFileSync(src, dest);
          } catch {}
        }
      });
    }
  } catch (err) {
    console.warn('Storage initialization warning:', err);
  }
}
initStorage();

export const AUTHORIZED_OWNER_EMAILS = [
  '953625205018@ritrjpm.ac.in',
  'kaviya@ritrjpm.ac.in',
  'kaviya.it@ritrjpm.ac.in',
  'kaviya',
];

export const AUTH_SECRET = process.env.AUTH_SECRET || process.env.OWNER_PASSWORD || 'kaviya_portfolio_secure_session_key_2026';

export function isAuthorizedOwnerEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  const envOwner = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const allowed = [...AUTHORIZED_OWNER_EMAILS.map((e) => e.toLowerCase())];
  if (envOwner) allowed.push(envOwner);
  return allowed.includes(cleanEmail);
}

export function getConfiguredOwnerPassword(): string {
  if (process.env.OWNER_PASSWORD && process.env.OWNER_PASSWORD.trim()) {
    return process.env.OWNER_PASSWORD.trim();
  }

  try {
    if (fs.existsSync(AUTH_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_CONFIG_FILE, 'utf-8'));
      if (data && typeof data.configuredPassword === 'string' && data.configuredPassword.trim()) {
        return data.configuredPassword.trim();
      }
    }
    const baseAuthFile = path.join(BASE_DATA_DIR, 'auth_config.json');
    if (fs.existsSync(baseAuthFile)) {
      const data = JSON.parse(fs.readFileSync(baseAuthFile, 'utf-8'));
      if (data && typeof data.configuredPassword === 'string' && data.configuredPassword.trim()) {
        return data.configuredPassword.trim();
      }
    }
  } catch (err) {
    console.error('Error reading auth_config.json:', err);
  }

  return 'Kaviya';
}

export function writeConfiguredOwnerPassword(password: string): void {
  try {
    const config = {
      configuredPassword: password,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(AUTH_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    if (!isVercel && BASE_DATA_DIR !== DATA_DIR) {
      try {
        fs.writeFileSync(path.join(BASE_DATA_DIR, 'auth_config.json'), JSON.stringify(config, null, 2), 'utf-8');
      } catch {}
    }
  } catch (err) {
    console.error('Error writing auth_config.json:', err);
  }
}

export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB) && a === b;
}

export function validateOwnerPassword(password: string): boolean {
  if (!password || typeof password !== 'string' || !password.trim()) return false;
  const cleanPassword = password.trim();
  const configuredPassword = getConfiguredOwnerPassword();
  if (!configuredPassword) return false;
  return timingSafeCompare(cleanPassword, configuredPassword);
}

export function readMediaDB(): Record<string, MediaItem> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
    const repoFile = path.join(BASE_DATA_DIR, 'media_db.json');
    if (fs.existsSync(repoFile)) {
      const data = fs.readFileSync(repoFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading media DB:', err);
  }
  return {};
}

export function writeMediaDB(db: Record<string, MediaItem>): void {
  try {
    const tmpPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_FILE);
  } catch (err) {
    console.error('Error writing media DB:', err);
  }
}

export function readNotesDB(): Record<string, string> {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const data = fs.readFileSync(NOTES_FILE, 'utf-8');
      return JSON.parse(data);
    }
    const repoFile = path.join(BASE_DATA_DIR, 'notes_db.json');
    if (fs.existsSync(repoFile)) {
      const data = fs.readFileSync(repoFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading notes DB:', err);
  }
  return {};
}

export function writeNotesDB(db: Record<string, string>): void {
  try {
    const tmpPath = `${NOTES_FILE}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, NOTES_FILE);
  } catch (err) {
    console.error('Error writing notes DB:', err);
  }
}

export function readSessionsDB(): Record<string, SessionData> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading sessions DB:', err);
  }
  return {};
}

export function writeSessionsDB(db: Record<string, SessionData>): void {
  try {
    const tmpPath = `${SESSIONS_FILE}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, SESSIONS_FILE);
  } catch (err) {
    console.error('Error writing sessions DB:', err);
  }
}

export function createSignedSessionToken(email: string): string {
  const payload = {
    email,
    role: 'OWNER' as const,
    name: 'Kaviya',
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payloadBase64).digest('base64url');
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string): SessionData | null {
  if (!token || typeof token !== 'string') return null;

  if (token.includes('.')) {
    const parts = token.split('.');
    if (parts.length === 2) {
      const [payloadBase64, signature] = parts;
      const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadBase64).digest('base64url');
      if (timingSafeCompare(signature, expectedSig)) {
        try {
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
          if (payload && payload.role === 'OWNER' && payload.exp && payload.exp > Date.now()) {
            return {
              token,
              email: payload.email || '953625205018@ritrjpm.ac.in',
              role: 'OWNER',
              createdAt: payload.iat || Date.now(),
              lastActiveAt: Date.now(),
            };
          }
        } catch {}
      }
    }
  }

  try {
    const sessions = readSessionsDB();
    const session = sessions[token];
    if (session && session.role === 'OWNER') {
      if (Date.now() - session.lastActiveAt <= 30 * 24 * 60 * 60 * 1000) {
        session.lastActiveAt = Date.now();
        writeSessionsDB(sessions);
        return session;
      }
    }
  } catch {}

  return null;
}

export function getSessionFromHeaders(headers: Record<string, string | string[] | undefined>): SessionData | null {
  const authHeader = (headers['authorization'] || headers['Authorization']) as string;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (headers['x-auth-token']) {
    token = String(headers['x-auth-token']).trim();
  }
  return token ? verifySessionToken(token) : null;
}

export function getExistingFilePath(filename: string): string | null {
  const cleanName = path.basename(filename);
  const p1 = path.join(UPLOADS_DIR, cleanName);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(BASE_UPLOADS_DIR, cleanName);
  if (fs.existsSync(p2)) return p2;
  return null;
}
