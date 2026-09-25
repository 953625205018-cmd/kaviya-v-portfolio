import {
  isAuthorizedOwnerEmail,
  validateOwnerPassword,
  createSignedSessionToken,
  readSessionsDB,
  writeSessionsDB,
  SessionData
} from '../../src/server/backend';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed: Expected POST' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { email, password } = body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isAuthorizedOwnerEmail(cleanEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid owner credentials',
      });
    }

    if (!validateOwnerPassword(password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid owner credentials',
      });
    }

    const token = createSignedSessionToken(cleanEmail);
    try {
      const sessions = readSessionsDB();
      const session: SessionData = {
        token,
        email: cleanEmail,
        role: 'OWNER',
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      sessions[token] = session;
      writeSessionsDB(sessions);
    } catch {}

    return res.status(200).json({
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
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
}
