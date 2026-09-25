import { readNotesDB, writeNotesDB, getSessionFromHeaders } from '../../src/server/backend';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { key } = req.query || {};
  const noteKey = typeof key === 'string' ? key : Array.isArray(key) ? key[0] : '';

  if (!noteKey) {
    return res.status(400).json({ success: false, error: 'Note key is required' });
  }

  const notes = readNotesDB();

  if (req.method === 'GET') {
    return res.status(200).json({ key: noteKey, content: notes[noteKey] || '' });
  }

  if (req.method === 'POST') {
    const session = getSessionFromHeaders(req.headers);
    if (!session || session.role !== 'OWNER') {
      return res.status(403).json({ success: false, error: 'Access Denied: Only owner can save notes.' });
    }
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    notes[noteKey] = body?.content || '';
    writeNotesDB(notes);
    return res.status(200).json({ success: true, content: notes[noteKey] });
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
