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
      try { return JSON.parse(req.body); } catch { return {}; }
    }
    if (Buffer.isBuffer(req.body)) {
      try { return JSON.parse(req.body.toString('utf-8')); } catch { return {}; }
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

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.OWNER_PASSWORD || 'kaviya_portfolio_secure_session_key_2026';

function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB) && a === b;
}

function verifyToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (!token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadBase64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadBase64).digest('base64url');
  if (!timingSafeCompare(signature, expectedSig)) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
    return payload && payload.role === 'OWNER' && payload.exp && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function readNotes(): Record<string, string> {
  try {
    const tmpFile = '/tmp/data/notes_db.json';
    if (fs.existsSync(tmpFile)) return JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
    const baseFile = path.join(process.cwd(), 'data', 'notes_db.json');
    if (fs.existsSync(baseFile)) return JSON.parse(fs.readFileSync(baseFile, 'utf-8'));
  } catch {}
  return {};
}

function writeNotes(notes: Record<string, string>) {
  try {
    const isVercel = !!process.env.VERCEL;
    const dataDir = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'notes_db.json'), JSON.stringify(notes, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write notes DB:', e);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const { key } = req.query || {};
  const noteKey = typeof key === 'string' ? key : Array.isArray(key) ? key[0] : '';

  if (!noteKey) {
    return sendJson(res, 400, { success: false, error: 'Note key is required' });
  }

  const notes = readNotes();

  if (req.method === 'GET') {
    return sendJson(res, 200, { key: noteKey, content: notes[noteKey] || '' });
  }

  if (req.method === 'POST') {
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string;
    let token = '';
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = String(req.headers['x-auth-token']).trim();
    }

    if (!verifyToken(token)) {
      return sendJson(res, 403, { success: false, error: 'Access Denied: Only owner can save notes.' });
    }

    const body = await getJsonBody(req);
    notes[noteKey] = body?.content || '';
    writeNotes(notes);
    return sendJson(res, 200, { success: true, content: notes[noteKey] });
  }

  return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
}
