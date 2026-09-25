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

function readMedia(): Record<string, any> {
  try {
    const tmpFile = '/tmp/data/media_db.json';
    if (fs.existsSync(tmpFile)) return JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
    const baseFile = path.join(process.cwd(), 'data', 'media_db.json');
    if (fs.existsSync(baseFile)) return JSON.parse(fs.readFileSync(baseFile, 'utf-8'));
  } catch {}
  return {};
}

function writeMedia(db: Record<string, any>) {
  try {
    const isVercel = !!process.env.VERCEL;
    const dataDir = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'media_db.json'), JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write media DB:', e);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const { key } = req.query || {};
  const storageKey = typeof key === 'string' ? key : Array.isArray(key) ? key[0] : '';

  if (!storageKey) {
    return sendJson(res, 400, { success: false, error: 'Media storage key is required' });
  }

  const db = readMedia();

  if (req.method === 'GET') {
    const item = db[storageKey];
    if (item) {
      return sendJson(res, 200, item);
    }
    return sendJson(res, 404, { success: false, error: 'Media not found' });
  }

  const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string;
  let token = '';
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  }

  if (!verifyToken(token)) {
    return sendJson(res, 403, {
      success: false,
      error: 'Access Denied: Only the verified website owner can modify or delete content.',
    });
  }

  if (req.method === 'PATCH') {
    if (!db[storageKey]) {
      return sendJson(res, 404, { success: false, error: 'Media record not found' });
    }
    const body = await getJsonBody(req);
    const { title, description } = body || {};
    if (title !== undefined) db[storageKey].title = title;
    if (description !== undefined) db[storageKey].description = description;
    writeMedia(db);
    return sendJson(res, 200, { success: true, item: db[storageKey] });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const body = await getJsonBody(req);
    const now = new Date();
    const newRecord = {
      id: storageKey,
      userId: body?.userId || 'Kaviya',
      section: body?.section || 'General',
      fileName: body?.fileName || 'file',
      fileSize: Number(body?.fileSize) || 0,
      mimeType: body?.mimeType || 'application/octet-stream',
      fileUrl: body?.fileUrl || '',
      savedFileName: body?.savedFileName || body?.fileName || storageKey,
      title: body?.title || body?.fileName || storageKey,
      description: body?.description || '',
      mediaType: body?.mediaType || 'video',
      uploadDate: body?.uploadDate || now.toISOString().split('T')[0],
      uploadTime: body?.uploadTime || now.toTimeString().split(' ')[0],
      uploadedAt: body?.uploadedAt || now.toISOString(),
      uploadStatus: 'saved',
    };
    db[storageKey] = newRecord;
    writeMedia(db);
    return sendJson(res, 200, { success: true, item: newRecord });
  }

  if (req.method === 'DELETE') {
    const item = db[storageKey];
    if (item && item.savedFileName) {
      const isVercel = !!process.env.VERCEL;
      const uploadsDir = isVercel ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadsDir, item.savedFileName);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
      delete db[storageKey];
      writeMedia(db);
    }
    return sendJson(res, 200, { success: true });
  }

  return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
}
