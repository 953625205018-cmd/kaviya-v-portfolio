import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, x-upload-id, x-chunk-index, x-total-chunks, x-file-name, x-storage-key, x-title, x-description, x-section, x-user-id, x-file-size');
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

  if (!verifyToken(token)) {
    return sendJson(res, 403, {
      success: false,
      error: 'Access Denied: Only the verified website owner can upload content.',
    });
  }

  try {
    const uploadId = (req.headers['x-upload-id'] as string) || '';
    const chunkIndex = parseInt((req.headers['x-chunk-index'] as string) || '0', 10);
    const totalChunks = parseInt((req.headers['x-total-chunks'] as string) || '1', 10);
    const rawFileName = decodeURIComponent((req.headers['x-file-name'] as string) || 'video.mp4');
    const rawStorageKey = decodeURIComponent((req.headers['x-storage-key'] as string) || 'media');
    const rawTitle = decodeURIComponent((req.headers['x-title'] as string) || '');
    const rawDesc = decodeURIComponent((req.headers['x-description'] as string) || '');
    const rawSection = decodeURIComponent((req.headers['x-section'] as string) || 'General');
    const rawUserId = decodeURIComponent((req.headers['x-user-id'] as string) || 'Kaviya');
    const fileSize = parseInt((req.headers['x-file-size'] as string) || '0', 10);

    if (!uploadId) {
      return sendJson(res, 400, { success: false, error: 'Missing upload ID' });
    }

    // Collect chunk buffer from request stream
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const chunkBuffer = Buffer.concat(chunks);

    const isVercel = !!process.env.VERCEL;
    const uploadsDir = isVercel ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
    const chunksDir = path.join(uploadsDir, '.chunks');

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir, { recursive: true });

    const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const chunkFilePath = path.join(chunksDir, `${safeUploadId}.part`);

    if (chunkIndex === 0 && fs.existsSync(chunkFilePath)) {
      try { await fs.promises.unlink(chunkFilePath); } catch {}
    }

    await fs.promises.appendFile(chunkFilePath, chunkBuffer);

    if (chunkIndex === totalChunks - 1) {
      const cleanExt = path.extname(rawFileName).toLowerCase() || '.mp4';
      const safeBaseName = path.basename(rawFileName, cleanExt).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e4)}`;
      const finalFileName = `${safeBaseName}_${uniqueSuffix}${cleanExt}`;
      const finalFilePath = path.join(uploadsDir, finalFileName);

      await fs.promises.rename(chunkFilePath, finalFilePath);

      let mediaType: 'video' | 'audio' | 'pdf' | 'image' = 'video';
      if (cleanExt === '.pdf') {
        mediaType = 'pdf';
      } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(cleanExt)) {
        mediaType = 'image';
      } else if (['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(cleanExt)) {
        mediaType = 'audio';
      } else {
        mediaType = 'video';
      }

      const now = new Date();
      const uploadDate = now.toISOString().split('T')[0];
      const uploadTime = now.toTimeString().split(' ')[0];

      const db = readMedia();
      const previous = db[rawStorageKey];
      if (previous && previous.savedFileName && previous.savedFileName !== finalFileName) {
        const oldFilePath = path.join(uploadsDir, previous.savedFileName);
        if (fs.existsSync(oldFilePath)) {
          try { fs.unlinkSync(oldFilePath); } catch {}
        }
      }

      const fileUrl = `/api/files/${finalFileName}`;
      const stat = fs.statSync(finalFilePath);
      const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };

      const newRecord = {
        id: rawStorageKey,
        userId: rawUserId,
        section: rawSection,
        fileName: rawFileName,
        fileSize: stat.size || fileSize,
        mimeType: mimeTypes[cleanExt] || 'application/octet-stream',
        fileUrl,
        savedFileName: finalFileName,
        title: rawTitle || rawFileName.replace(/\.[^/.]+$/, ''),
        description: rawDesc,
        mediaType,
        uploadDate,
        uploadTime,
        uploadedAt: now.toISOString(),
        uploadStatus: 'saved',
      };

      db[rawStorageKey] = newRecord;
      writeMedia(db);

      return sendJson(res, 200, { success: true, item: newRecord });
    }

    return sendJson(res, 200, { success: true, chunkIndex });
  } catch (err: any) {
    console.error('Error handling chunk upload:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Chunk processing error' });
  }
}
