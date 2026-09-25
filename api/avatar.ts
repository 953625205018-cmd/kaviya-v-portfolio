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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  let avatarUrl = null;
  try {
    const tmpFile = '/tmp/data/notes_db.json';
    if (fs.existsSync(tmpFile)) {
      const notes = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'));
      avatarUrl = notes['kaviya_custom_avatar'] || null;
    }
    if (!avatarUrl) {
      const baseFile = path.join(process.cwd(), 'data', 'notes_db.json');
      if (fs.existsSync(baseFile)) {
        const notes = JSON.parse(fs.readFileSync(baseFile, 'utf-8'));
        avatarUrl = notes['kaviya_custom_avatar'] || null;
      }
    }
  } catch {}

  return sendJson(res, 200, { avatarUrl });
}
