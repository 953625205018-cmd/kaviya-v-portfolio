import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function sendJson(res: any, statusCode: number, data: any) {
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.status === 'function') {
    if (typeof res.json === 'function') {
      return res.status(statusCode).json(data);
    }
    return res.status(statusCode).send(JSON.stringify(data));
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

async function getJsonBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf-8'));
      } catch {
        return {};
      }
    }
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    if (chunks.length > 0) {
      const str = Buffer.concat(chunks).toString('utf-8');
      return JSON.parse(str);
    }
  } catch {}
  return {};
}

const AUTHORIZED_OWNER_EMAILS = [
  '953625205018@ritrjpm.ac.in',
  'kaviya@ritrjpm.ac.in',
  'kaviya.it@ritrjpm.ac.in',
  'kaviya',
];

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.OWNER_PASSWORD || 'kaviya_portfolio_secure_session_key_2026';

function isAuthorizedOwnerEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  const envOwner = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const allowed = [...AUTHORIZED_OWNER_EMAILS.map((e) => e.toLowerCase())];
  if (envOwner) allowed.push(envOwner);
  return allowed.includes(cleanEmail);
}

function getConfiguredOwnerPassword(): string {
  if (process.env.OWNER_PASSWORD && process.env.OWNER_PASSWORD.trim()) {
    return process.env.OWNER_PASSWORD.trim();
  }

  try {
    const tmpFile = '/tmp/data/auth_config.json';
    if (fs.existsSync(tmpFile)) {
      const data = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
      if (data && typeof data.configuredPassword === 'string' && data.configuredPassword.trim()) {
        return data.configuredPassword.trim();
      }
    }
  } catch {}

  try {
    const baseFile = path.join(process.cwd(), 'data', 'auth_config.json');
    if (fs.existsSync(baseFile)) {
      const data = JSON.parse(fs.readFileSync(baseFile, 'utf-8'));
      if (data && typeof data.configuredPassword === 'string' && data.configuredPassword.trim()) {
        return data.configuredPassword.trim();
      }
    }
  } catch {}

  return 'Kaviya';
}

function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB) && a === b;
}

function validateOwnerPassword(password: string): boolean {
  if (!password || typeof password !== 'string' || !password.trim()) return false;
  const cleanPassword = password.trim();
  const configuredPassword = getConfiguredOwnerPassword();
  if (!configuredPassword) return false;
  return timingSafeCompare(cleanPassword, configuredPassword);
}

function createSignedSessionToken(email: string): string {
  const payload = {
    email,
    role: 'OWNER' as const,
    name: 'Kaviya',
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payloadBase64).digest('base64url');
  return `${payloadBase64}.${signature}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Method Not Allowed: Expected POST' });
  }

  try {
    const body = await getJsonBody(req);
    const { email, password } = body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return sendJson(res, 400, { success: false, error: 'Email is required.' });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return sendJson(res, 400, { success: false, error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isAuthorizedOwnerEmail(cleanEmail)) {
      return sendJson(res, 403, {
        success: false,
        error: 'Invalid owner credentials',
      });
    }

    if (!validateOwnerPassword(password)) {
      return sendJson(res, 401, {
        success: false,
        error: 'Invalid owner credentials',
      });
    }

    const token = createSignedSessionToken(cleanEmail);

    try {
      const isVercel = !!process.env.VERCEL;
      const dataDir = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const sessionsFile = path.join(dataDir, 'sessions_db.json');
      let sessions: Record<string, any> = {};
      if (fs.existsSync(sessionsFile)) {
        try {
          sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
        } catch {}
      }
      sessions[token] = {
        token,
        email: cleanEmail,
        role: 'OWNER',
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), 'utf-8');
    } catch {}

    return sendJson(res, 200, {
      success: true,
      token,
      user: {
        email: cleanEmail,
        role: 'OWNER',
        name: 'Kaviya',
      },
    });
  } catch (err: any) {
    console.error('Login API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
  }
}
