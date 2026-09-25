import crypto from 'crypto';

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

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.OWNER_PASSWORD || 'kaviya_portfolio_secure_session_key_2026';

function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB) && a === b;
}

function verifyToken(token: string): { email: string; role: 'OWNER'; name: string } | null {
  if (!token || typeof token !== 'string') return null;
  if (!token.includes('.')) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadBase64).digest('base64url');

  if (!timingSafeCompare(signature, expectedSig)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
    if (payload && payload.role === 'OWNER' && payload.exp && payload.exp > Date.now()) {
      return {
        email: payload.email || '953625205018@ritrjpm.ac.in',
        role: 'OWNER',
        name: payload.name || 'Kaviya',
      };
    }
  } catch {}

  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string;
    let token = '';
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = String(req.headers['x-auth-token']).trim();
    }

    const user = verifyToken(token);
    if (user) {
      return sendJson(res, 200, {
        isAuthenticated: true,
        role: 'OWNER',
        user: {
          email: user.email,
          role: 'OWNER',
          name: user.name,
        },
      });
    }

    return sendJson(res, 200, {
      isAuthenticated: false,
      role: 'PUBLIC',
      user: null,
    });
  } catch (err: any) {
    return sendJson(res, 200, {
      isAuthenticated: false,
      role: 'PUBLIC',
      user: null,
    });
  }
}
