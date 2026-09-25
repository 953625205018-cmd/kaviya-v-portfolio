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
    return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string;
  let token = '';
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  }

  const isOwner = verifyToken(token);
  if (!isOwner) {
    return sendJson(res, 403, {
      success: false,
      error: 'Access Denied: Only the authenticated website owner can configure the password.',
    });
  }

  const body = await getJsonBody(req);
  const { newPassword } = body || {};

  if (!newPassword || typeof newPassword !== 'string' || !newPassword.trim()) {
    return sendJson(res, 400, { success: false, error: 'New password cannot be empty.' });
  }

  try {
    const isVercel = !!process.env.VERCEL;
    const dataDir = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const authFile = path.join(dataDir, 'auth_config.json');
    const config = {
      configuredPassword: newPassword.trim(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(authFile, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('Error saving password config:', err);
  }

  return sendJson(res, 200, { success: true, message: 'Owner password configured successfully.' });
}
