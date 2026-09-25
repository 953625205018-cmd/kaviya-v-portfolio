import { getSessionFromHeaders } from '../../src/server/backend';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const session = getSessionFromHeaders(req.headers);
    if (session && session.role === 'OWNER') {
      return res.status(200).json({
        isAuthenticated: true,
        role: 'OWNER',
        user: {
          email: session.email,
          role: 'OWNER',
          name: 'Kaviya',
        },
      });
    }

    return res.status(200).json({
      isAuthenticated: false,
      role: 'PUBLIC',
      user: null,
    });
  } catch (err: any) {
    return res.status(200).json({
      isAuthenticated: false,
      role: 'PUBLIC',
      user: null,
    });
  }
}
