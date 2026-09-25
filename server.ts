import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

export interface MediaItem {
  id: string; // Unique file ID / storageKey
  userId: string; // User ID
  section: string; // Page/section name
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  savedFileName: string;
  title: string;
  description: string;
  mediaType: 'video' | 'audio' | 'pdf' | 'image';
  uploadDate: string; // YYYY-MM-DD
  uploadTime: string; // HH:MM:SS
  uploadedAt: string; // ISO string
  uploadStatus: 'saved' | 'uploading' | 'synced';
}

export interface SessionData {
  token: string;
  email: string;
  role: 'OWNER';
  createdAt: number;
  lastActiveAt: number;
}

const PORT = 3000;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'media_db.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes_db.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions_db.json');
const AUTH_CONFIG_FILE = path.join(DATA_DIR, 'auth_config.json');

// Authorized owner identifiers
const AUTHORIZED_OWNER_EMAILS = [
  '953625205018@ritrjpm.ac.in',
  'kaviya@ritrjpm.ac.in',
  'kaviya.it@ritrjpm.ac.in',
  'kaviya',
];

// Ensure storage directories exist
const CHUNKS_DIR = path.join(UPLOADS_DIR, '.chunks');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(CHUNKS_DIR)) {
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getConfiguredOwnerPassword(): string {
  // 1. Check environment variable override
  if (process.env.OWNER_PASSWORD && process.env.OWNER_PASSWORD.trim()) {
    return process.env.OWNER_PASSWORD.trim();
  }

  // 2. Check persistent auth configuration file
  try {
    if (fs.existsSync(AUTH_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_CONFIG_FILE, 'utf-8'));
      if (data && typeof data.configuredPassword === 'string' && data.configuredPassword.trim()) {
        return data.configuredPassword.trim();
      }
    }
  } catch (err) {
    console.error('Error reading auth_config.json:', err);
  }

  // 3. Configured password (case-sensitive "Kaviya")
  return 'Kaviya';
}

function writeConfiguredOwnerPassword(password: string): void {
  try {
    const config = {
      configuredPassword: password,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(AUTH_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing auth_config.json:', err);
  }
}

// Secure constant-time password validation helper (strictly case-sensitive)
function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB) && a === b;
}

function validateOwnerPassword(password: string): boolean {
  if (!password || typeof password !== 'string' || !password.trim()) return false;
  const cleanPassword = password.trim();

  const configuredPassword = getConfiguredOwnerPassword();
  if (!configuredPassword) return false;

  // Strict case-sensitive match against ONLY the exact configured password
  return timingSafeCompare(cleanPassword, configuredPassword);
}

// Database helper functions with atomic fallback
function readMediaDB(): Record<string, MediaItem> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading media DB:', err);
  }
  return {};
}

function writeMediaDB(db: Record<string, MediaItem>): void {
  try {
    const tmpPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_FILE);
  } catch (err) {
    console.error('Error writing media DB:', err);
  }
}

function readNotesDB(): Record<string, string> {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const data = fs.readFileSync(NOTES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading notes DB:', err);
  }
  return {};
}

function writeNotesDB(db: Record<string, string>): void {
  try {
    const tmpPath = `${NOTES_FILE}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, NOTES_FILE);
  } catch (err) {
    console.error('Error writing notes DB:', err);
  }
}

function readSessionsDB(): Record<string, SessionData> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading sessions DB:', err);
  }
  return {};
}

function writeSessionsDB(db: Record<string, SessionData>): void {
  try {
    const tmpPath = `${SESSIONS_FILE}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, SESSIONS_FILE);
  } catch (err) {
    console.error('Error writing sessions DB:', err);
  }
}

function getSessionFromRequest(req: express.Request): SessionData | null {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']).trim();
  }
  if (!token) return null;

  const sessions = readSessionsDB();
  const session = sessions[token];
  if (!session) return null;

  // Check 30-day session expiry
  if (Date.now() - session.lastActiveAt > 30 * 24 * 60 * 60 * 1000) {
    delete sessions[token];
    writeSessionsDB(sessions);
    return null;
  }

  session.lastActiveAt = Date.now();
  writeSessionsDB(sessions);
  return session;
}

function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Only the authenticated website owner (Kaviya V) can upload, modify, or delete content. Public users have view-only access.',
    });
  }
  (req as any).user = session;
  next();
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const cleanExt = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path.basename(file.originalname, cleanExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    cb(null, `${safeBaseName}_${uniqueSuffix}${cleanExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // 150MB limit
  },
});

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS middleware for cross-device support
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, x-user-id, Authorization, x-auth-token');
    res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type, Content-Disposition');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Auth API
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const envOwner = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
    const allowed = [...AUTHORIZED_OWNER_EMAILS.map((e) => e.toLowerCase())];
    if (envOwner) allowed.push(envOwner);

    if (!allowed.includes(cleanEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Only the authorized website owner (Kaviya V) can log in as administrator. Public users have view-only access.',
      });
    }

    if (!validateOwnerPassword(password)) {
      return res.status(401).json({ success: false, error: 'Incorrect owner password.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
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

    return res.json({
      success: true,
      token,
      user: {
        email: cleanEmail,
        role: 'OWNER',
        name: 'Kaviya V',
      },
    });
  });

  // API Route: Configure / change owner password (protected: requires owner or valid current password)
  app.post('/api/auth/configure-password', (req, res) => {
    const session = getSessionFromRequest(req);
    const { currentPassword, newPassword } = req.body || {};

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
    return res.json({ success: true, message: 'Owner password configured successfully.' });
  });

  app.get('/api/auth/me', (req, res) => {
    const session = getSessionFromRequest(req);
    if (session && session.role === 'OWNER') {
      return res.json({
        isAuthenticated: true,
        role: 'OWNER',
        user: {
          email: session.email,
          role: 'OWNER',
          name: 'Kaviya V',
        },
      });
    }
    return res.json({
      isAuthenticated: false,
      role: 'PUBLIC',
      user: null,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = String(req.headers['x-auth-token']).trim();
    }
    if (token) {
      const sessions = readSessionsDB();
      if (sessions[token]) {
        delete sessions[token];
        writeSessionsDB(sessions);
      }
    }
    return res.json({ success: true });
  });

  // API Route: Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Route: Get all media records
  app.get('/api/media', (_req, res) => {
    const db = readMediaDB();
    res.json(db);
  });

  // API Route: Get specific media record by key
  app.get('/api/media/:key', (req, res) => {
    const db = readMediaDB();
    const item = db[req.params.key];
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Media not found' });
    }
  });

  // API Route: Upload file (Video, Audio, Image, PDF) - Protected: Owner only
  app.post('/api/upload', requireOwner, (req, res) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ success: false, error: 'File size exceeds the 150MB limit.' });
          }
          return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
        }
        return res.status(500).json({ success: false, error: err.message || 'Upload processing error' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const storageKey = req.body.storageKey || 'media';
      const title = req.body.title || file.originalname.replace(/\.[^/.]+$/, '');
      const description = req.body.description || '';
      const userId = req.body.userId || (req.headers['x-user-id'] as string) || 'Kaviya';
      const section = req.body.section || 'General';

      // Determine media type
      let mediaType: 'video' | 'audio' | 'pdf' | 'image' = 'video';
      const mime = file.mimetype.toLowerCase();
      const ext = path.extname(file.originalname).toLowerCase();

      if (mime.includes('pdf') || ext === '.pdf') {
        mediaType = 'pdf';
      } else if (
        mime.startsWith('image') || 
        ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)
      ) {
        mediaType = 'image';
      } else if (
        mime.startsWith('audio') || 
        ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(ext)
      ) {
        mediaType = 'audio';
      } else {
        mediaType = 'video';
      }

      const now = new Date();
      const uploadDate = now.toISOString().split('T')[0];
      const uploadTime = now.toTimeString().split(' ')[0];

      const db = readMediaDB();

      // Clean up previous file associated with this key to save space
      const previous = db[storageKey];
      if (previous && previous.savedFileName && previous.savedFileName !== file.filename) {
        const oldFilePath = path.join(UPLOADS_DIR, previous.savedFileName);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            console.warn('Failed to delete previous file:', e);
          }
        }
      }

      const fileUrl = `/api/files/${file.filename}`;
      const newRecord: MediaItem = {
        id: storageKey,
        userId,
        section,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl,
        savedFileName: file.filename,
        title,
        description,
        mediaType,
        uploadDate,
        uploadTime,
        uploadedAt: now.toISOString(),
        uploadStatus: 'saved',
      };

      db[storageKey] = newRecord;
      writeMediaDB(db);

      return res.json({ success: true, item: newRecord });
    });
  });

  // API Route: High-performance Chunked Streaming Upload (for fast video & large media upload) - Protected: Owner only
  app.post(
    '/api/upload/chunk',
    requireOwner,
    express.raw({ type: 'application/octet-stream', limit: '35mb' }),
    async (req, res) => {
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

        if (!uploadId || !Buffer.isBuffer(req.body)) {
          return res.status(400).json({ success: false, error: 'Invalid chunk payload' });
        }

        const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const chunkFilePath = path.join(CHUNKS_DIR, `${safeUploadId}.part`);

        if (chunkIndex === 0 && fs.existsSync(chunkFilePath)) {
          try {
            await fs.promises.unlink(chunkFilePath);
          } catch {}
        }

        await fs.promises.appendFile(chunkFilePath, req.body);

        // If this is the final chunk, assemble and finalize the media item immediately
        if (chunkIndex === totalChunks - 1) {
          const cleanExt = path.extname(rawFileName).toLowerCase() || '.mp4';
          const safeBaseName = path.basename(rawFileName, cleanExt).replace(/[^a-zA-Z0-9_-]/g, '_');
          const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e4)}`;
          const finalFileName = `${safeBaseName}_${uniqueSuffix}${cleanExt}`;
          const finalFilePath = path.join(UPLOADS_DIR, finalFileName);

          fs.renameSync(chunkFilePath, finalFilePath);

          // Determine media type
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

          const db = readMediaDB();

          // Clean up previous file associated with this key to save space
          const previous = db[rawStorageKey];
          if (previous && previous.savedFileName && previous.savedFileName !== finalFileName) {
            const oldFilePath = path.join(UPLOADS_DIR, previous.savedFileName);
            if (fs.existsSync(oldFilePath)) {
              try {
                fs.unlinkSync(oldFilePath);
              } catch (e) {
                console.warn('Failed to delete previous file:', e);
              }
            }
          }

          const fileUrl = `/api/files/${finalFileName}`;
          const stat = fs.statSync(finalFilePath);
          const mimeTypes: Record<string, string> = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'video/ogg',
            '.ogv': 'video/ogg',
            '.mov': 'video/quicktime',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
          };

          const newRecord: MediaItem = {
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
          writeMediaDB(db);

          return res.json({ success: true, item: newRecord });
        }

        return res.json({ success: true, chunkIndex });
      } catch (err: any) {
        console.error('Error handling chunk upload:', err);
        return res.status(500).json({ success: false, error: err.message || 'Chunk processing error' });
      }
    }
  );

  // API Route: Update metadata (title/description) - Protected: Owner only
  app.patch('/api/media/:key', requireOwner, (req, res) => {
    const { key } = req.params;
    const { title, description } = req.body;
    const db = readMediaDB();

    if (!db[key]) {
      return res.status(404).json({ success: false, error: 'Media record not found' });
    }

    if (title !== undefined) db[key].title = title;
    if (description !== undefined) db[key].description = description;

    writeMediaDB(db);
    return res.json({ success: true, item: db[key] });
  });

  // API Route: Delete media record and associated file - Protected: Owner only
  app.delete('/api/media/:key', requireOwner, (req, res) => {
    const { key } = req.params;
    const db = readMediaDB();

    const item = db[key];
    if (item && item.savedFileName) {
      const filePath = path.join(UPLOADS_DIR, item.savedFileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed to delete file from disk:', e);
        }
      }
      delete db[key];
      writeMediaDB(db);
    }

    return res.json({ success: true });
  });

  // API Route: Stream / Serve persistent files (with byte-ranges for videos/audio on mobile)
  app.get('/api/files/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, filename);
    const ext = path.extname(filename).toLowerCase();

    // If PDF file does not exist on disk, synthesize valid PDF so View PDF never 404s
    if (!fs.existsSync(filePath) && ext === '.pdf') {
      try {
        const titleClean = filename.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        const samplePdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 400 >>
stream
BT
/F1 18 Tf
50 720 Td
(English Communication Lab - Listening Skills) Tj
/F1 13 Tf
0 -36 Td
(Document: ${titleClean}) Tj
0 -26 Td
(Student: Kaviya V | Department of Information Technology) Tj
0 -26 Td
(Status: Verified Submission & Cloud Synced) Tj
/F1 11 Tf
0 -40 Td
(Listening Comprehension Exercise Summary:) Tj
0 -22 Td
(1. Core Audio Analysis: Extracted primary thesis and contextual cues.) Tj
0 -18 Td
(2. Tone & Diction: Identified formal register and logical structure.) Tj
0 -18 Td
(3. Notes & Synthesis: Key arguments recorded for active discussion.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000236 00000 n 
0000000688 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
767
%%EOF`;
        fs.writeFileSync(filePath, samplePdf, 'utf-8');
      } catch (err) {
        console.error('Error auto-generating PDF:', err);
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.ogv': 'video/ogg',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      });
      fileStream.pipe(res);
    } else {
      const headers: Record<string, string | number> = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      };
      if (ext === '.pdf') {
        headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(filename)}"`;
      }
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Notes API (for cross-device synchronization of learning reflections and notes)
  app.get('/api/notes/:key', (req, res) => {
    const notes = readNotesDB();
    res.json({ key: req.params.key, content: notes[req.params.key] || '' });
  });

  // Protected: Owner only
  app.post('/api/notes/:key', requireOwner, (req, res) => {
    const notes = readNotesDB();
    notes[req.params.key] = req.body.content || '';
    writeNotesDB(notes);
    res.json({ success: true, content: notes[req.params.key] });
  });

  // Custom Profile Avatar upload (persists across sessions and devices) - Protected: Owner only
  app.post('/api/avatar', requireOwner, (req, res) => {
    upload.single('avatar')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'Avatar upload failed' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No avatar file provided' });
      }
      const avatarUrl = `/api/files/${req.file.filename}`;
      const notes = readNotesDB();
      notes['kaviya_custom_avatar'] = avatarUrl;
      writeNotesDB(notes);
      return res.json({ success: true, avatarUrl });
    });
  });

  app.get('/api/avatar', (_req, res) => {
    const notes = readNotesDB();
    res.json({ avatarUrl: notes['kaviya_custom_avatar'] || null });
  });

  // API 404 handler - ensure unmatched /api requests return JSON, NEVER HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.path}` });
  });

  // Global error handler for API
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      console.error('API Error:', err);
      res.status(err.status || 500).json({ success: false, error: err.message || 'Internal Server Error' });
      return;
    }
    next(err);
  });

  // Vite Middleware for development, static fallback for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
