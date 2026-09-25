import { getSessionFromHeaders, validateOwnerPassword, writeConfiguredOwnerPassword } from '../../src/server/backend';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const session = getSessionFromHeaders(req.headers);
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { currentPassword, newPassword } = body || {};

  if (!newPassword || typeof newPassword !== 'string' || !newPassword.trim()) {
    return res.status(400).json({ success: false, error: 'New password cannot be empty.' });
  }

  const isOwnerSession = session && session.role === 'OWNER';
  const isCurrentPasswordValid = currentPassword && validateOwnerPassword(currentPassword);

  if (!isOwnerSession && !isCurrentPasswordValid) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Only the authenticated website owner can configure the password.',
    });
  }

  writeConfiguredOwnerPassword(newPassword.trim());
  return res.status(200).json({ success: true, message: 'Owner password configured successfully.' });
}
