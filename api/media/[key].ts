import fs from 'fs';
import path from 'path';
import { readMediaDB, writeMediaDB, getSessionFromHeaders, UPLOADS_DIR } from '../../src/server/backend';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { key } = req.query || {};
  const storageKey = typeof key === 'string' ? key : Array.isArray(key) ? key[0] : '';

  if (!storageKey) {
    return res.status(400).json({ success: false, error: 'Media storage key is required' });
  }

  const db = readMediaDB();

  if (req.method === 'GET') {
    const item = db[storageKey];
    if (item) {
      return res.status(200).json(item);
    }
    return res.status(404).json({ success: false, error: 'Media not found' });
  }

  // Owner verification for mutations
  const session = getSessionFromHeaders(req.headers);
  if (!session || session.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Only the verified website owner can modify or delete content.',
    });
  }

  if (req.method === 'PATCH') {
    if (!db[storageKey]) {
      return res.status(404).json({ success: false, error: 'Media record not found' });
    }
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { title, description } = body || {};
    if (title !== undefined) db[storageKey].title = title;
    if (description !== undefined) db[storageKey].description = description;
    writeMediaDB(db);
    return res.status(200).json({ success: true, item: db[storageKey] });
  }

  if (req.method === 'DELETE') {
    const item = db[storageKey];
    if (item && item.savedFileName) {
      const filePath = path.join(UPLOADS_DIR, item.savedFileName);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
      delete db[storageKey];
      writeMediaDB(db);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
