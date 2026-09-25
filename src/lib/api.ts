import { upload as vercelBlobUpload } from '@vercel/blob/client';

export interface MediaItem {
  id: string; // Unique file ID / storageKey
  userId: string; // User ID (e.g. 'Kaviya')
  section: string; // Section name (e.g. 'Communication Skills', 'Podcast', 'Listening Skills')
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  savedFileName: string;
  title: string;
  description: string;
  mediaType: 'video' | 'audio' | 'pdf' | 'image';
  uploadDate: string; // e.g. '2026-09-12'
  uploadTime: string; // e.g. '10:31:08'
  uploadedAt: string; // Full ISO timestamp
  uploadStatus: 'saved' | 'uploading' | 'synced';
}

const DEFAULT_USER_ID = 'Kaviya';
const TOKEN_KEY = 'portfolio_owner_auth_token';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.warn('Could not update auth token in localStorage:', err);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }
  return headers;
}

export interface AuthUser {
  email: string;
  role: 'OWNER' | 'PUBLIC';
  name: string;
}

/**
 * Login with owner account (e.g. 953625205018@ritrjpm.ac.in)
 */
export async function loginOwner(
  email: string,
  password?: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const rawText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (!data) {
      return {
        success: false,
        error: `Login server returned an invalid response (HTTP ${res.status}). Please check the deployed /api/auth/login endpoint.`,
      };
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        error:
          data?.error ||
          'Authentication rejected. Only the authorized website owner has administrative access.',
      };
    }

    if (data.token) {
      setStoredAuthToken(data.token);
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err.message ||
        'Unable to connect to authentication server.',
    };
  }
}

/**
 * Check if the current browser session has verified owner authentication
 */
export async function checkAuthStatus(): Promise<{ 
  isAuthenticated: boolean; 
  role: 'OWNER' | 'PUBLIC'; 
  user: AuthUser | null 
}> {
  try {
    const token = getStoredAuthToken();
    if (!token) {
      return { isAuthenticated: false, role: 'PUBLIC', user: null };
    }
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      setStoredAuthToken(null);
      return { isAuthenticated: false, role: 'PUBLIC', user: null };
    }
    const rawText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
    if (data && data.isAuthenticated && data.role === 'OWNER') {
      return { isAuthenticated: true, role: 'OWNER', user: data.user };
    }
    setStoredAuthToken(null);
    return { isAuthenticated: false, role: 'PUBLIC', user: null };
  } catch {
    return { isAuthenticated: false, role: 'PUBLIC', user: null };
  }
}

/**
 * Log out owner and revert to public view-only access
 */
export async function logoutOwner(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // Continue even if network fails
  } finally {
    setStoredAuthToken(null);
  }
}

/**
 * Fetch all media items stored in the backend database
 */
export async function fetchAllMedia(): Promise<Record<string, MediaItem>> {
  try {
    const res = await fetch('/api/media');
    if (!res.ok) return {};
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return {};
    return await res.json();
  } catch (err) {
    console.error('Error in fetchAllMedia:', err);
    return {};
  }
}

/**
 * Fetch a specific media item by its storage key
 */
export async function fetchMedia(key: string): Promise<MediaItem | null> {
  try {
    const res = await fetch(`/api/media/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return await res.json();
  } catch (err) {
    console.error(`Error in fetchMedia(${key}):`, err);
    return null;
  }
}

function determineMediaType(fileName: string, mimeType?: string): 'video' | 'audio' | 'pdf' | 'image' {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const mime = (mimeType || '').toLowerCase();
  if (ext === '.pdf' || mime.includes('pdf') || ext === '.doc' || ext === '.docx') {
    return 'pdf';
  }
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext) || mime.startsWith('image/')) {
    return 'image';
  }
  if (['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(ext) || mime.startsWith('audio/')) {
    return 'audio';
  }
  return 'video';
}

/**
 * Upload a media file (Video, Audio, Image, PDF, or Document) to cloud storage and register in DB.
 * Uses Vercel Blob direct browser streaming for large files, with chunked fallback.
 */
export async function uploadMediaFile(
  file: File,
  storageKey: string,
  metadata?: { 
    title?: string; 
    description?: string; 
    section?: string;
    userId?: string;
  },
  onProgress?: (percent: number) => void
): Promise<MediaItem> {
  const mediaType = determineMediaType(file.name, file.type);
  const now = new Date();

  // 1. PRIMARY ARCHITECTURE: Vercel Blob direct browser-to-cloud upload
  // Bypasses serverless payload limits, supports large files (up to 1GB+) with live progress.
  try {
    const cleanExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() || '';
    const safeBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniquePathname = `${storageKey}_${Date.now()}_${safeBaseName}${cleanExt}`;

    const blob = await vercelBlobUpload(uniquePathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload/blob',
      headers: getAuthHeaders(),
      onUploadProgress: (progress) => {
        if (onProgress) {
          onProgress(Math.min(99, Math.round(progress.percentage)));
        }
      },
    });

    if (blob && blob.url) {
      const newRecord: MediaItem = {
        id: storageKey,
        userId: metadata?.userId || DEFAULT_USER_ID,
        section: metadata?.section || 'General',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || blob.contentType || 'application/octet-stream',
        fileUrl: blob.url,
        savedFileName: blob.pathname || uniquePathname,
        title: metadata?.title || file.name.replace(/\.[^/.]+$/, ''),
        description: metadata?.description || '',
        mediaType,
        uploadDate: now.toISOString().split('T')[0],
        uploadTime: now.toTimeString().split(' ')[0],
        uploadedAt: now.toISOString(),
        uploadStatus: 'saved',
      };

      const regRes = await fetch(`/api/media/${encodeURIComponent(storageKey)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newRecord),
      });

      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.success && regData.item) {
          if (onProgress) onProgress(100);
          return regData.item;
        }
      }

      if (onProgress) onProgress(100);
      return newRecord;
    }
  } catch (blobErr: any) {
    if (blobErr.message && blobErr.message.includes('Access Denied')) {
      throw blobErr;
    }
    console.warn('Vercel Blob direct upload bypassed/fallback:', blobErr?.message);
  }

  // 2. FALLBACK ARCHITECTURE: Safe chunked streaming (3MB chunks safely below Vercel's 4.5MB limit)
  if (file.size <= 3 * 1024 * 1024) {
    try {
      return await uploadDirectFile(file, storageKey, metadata, onProgress);
    } catch (directErr: any) {
      if (directErr.message && (
        directErr.message.includes('Access Denied') || 
        directErr.message.includes('Only the authorized website owner')
      )) {
        throw directErr;
      }
      console.warn('Direct upload fallback to chunked upload:', directErr);
    }
  }

  return uploadChunkedFile(file, storageKey, metadata, onProgress);
}

async function uploadChunkedFile(
  file: File,
  storageKey: string,
  metadata?: {
    title?: string;
    description?: string;
    section?: string;
    userId?: string;
  },
  onProgress?: (percent: number) => void
): Promise<MediaItem> {
  const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB chunks (strictly under Vercel Serverless 4.5MB limit)
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `${storageKey}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let lastResult: MediaItem | null = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunkBlob = file.slice(start, end);
    const chunkBuffer = await chunkBlob.arrayBuffer();

    let attempt = 0;
    const maxAttempts = 3;
    let chunkSuccess = false;
    let lastError: Error | null = null;

    while (attempt < maxAttempts && !chunkSuccess) {
      attempt++;
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/octet-stream',
          'x-upload-id': uploadId,
          'x-chunk-index': String(chunkIndex),
          'x-total-chunks': String(totalChunks),
          'x-file-name': encodeURIComponent(file.name),
          'x-file-size': String(file.size),
          'x-storage-key': encodeURIComponent(storageKey),
          'x-title': encodeURIComponent(metadata?.title || ''),
          'x-description': encodeURIComponent(metadata?.description || ''),
          'x-section': encodeURIComponent(metadata?.section || 'General'),
          'x-user-id': encodeURIComponent(metadata?.userId || DEFAULT_USER_ID),
          ...getAuthHeaders(),
        };

        const res = await fetch('/api/upload/chunk', {
          method: 'POST',
          headers,
          body: chunkBuffer,
        });

        if (res.status === 403 || res.status === 401) {
          throw new Error('Access Denied: Only the authorized website owner can upload or replace files. Public users have view-only access.');
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Upload server responded with error code ${res.status}.`);
        }

        const data = await res.json();
        if (data.item) {
          lastResult = data.item;
        }
        chunkSuccess = true;

        if (onProgress) {
          const progressPercent = Math.min(99, Math.round(((chunkIndex + 1) / totalChunks) * 100));
          onProgress(progressPercent);
        }
      } catch (err: any) {
        lastError = err;
        if (err.message && err.message.includes('Access Denied')) {
          throw err;
        }
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }
      }
    }

    if (!chunkSuccess) {
      throw lastError || new Error(`Upload of chunk ${chunkIndex + 1}/${totalChunks} failed. Please retry.`);
    }
  }

  if (onProgress) {
    onProgress(100);
  }

  if (!lastResult) {
    throw new Error('Upload completed but database record was not returned.');
  }

  return lastResult;
}

function uploadDirectFile(
  file: File,
  storageKey: string,
  metadata?: {
    title?: string;
    description?: string;
    section?: string;
    userId?: string;
  },
  onProgress?: (percent: number) => void
): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storageKey', storageKey);
    formData.append('userId', metadata?.userId || DEFAULT_USER_ID);
    if (metadata?.section) formData.append('section', metadata.section);
    if (metadata?.title) formData.append('title', metadata.title);
    if (metadata?.description) formData.append('description', metadata.description);

    xhr.open('POST', '/api/upload');

    const authHeaders = getAuthHeaders();
    Object.entries(authHeaders).forEach(([k, v]) => {
      xhr.setRequestHeader(k, v);
    });

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (onProgress) onProgress(100);

      const contentType = xhr.getResponseHeader('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (xhr.status === 403 || xhr.status === 401) {
          return reject(new Error('Access Denied: Only the authorized website owner can upload or replace files. Public users have view-only access.'));
        }
        return reject(new Error(`Upload server responded with status ${xhr.status}. Please retry in a moment.`));
      }

      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success && data.item) {
          resolve(data.item);
        } else {
          reject(new Error(data?.error || 'Upload failed. Please try again.'));
        }
      } catch {
        reject(new Error('Unexpected response format from upload server.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network connection issue: Unable to reach the storage server. Please verify your connection and retry.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Please check your internet connection and retry.'));
    };

    xhr.send(formData);
  });
}

/**
 * Update media title or description in the cloud database
 */
export async function updateMediaMetadata(
  storageKey: string,
  metadata: { title?: string; description?: string }
): Promise<MediaItem> {
  const res = await fetch(`/api/media/${encodeURIComponent(storageKey)}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(metadata),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 403 || res.status === 401) {
      throw new Error('Access Denied: Only the authorized website owner can update content.');
    }
    throw new Error('Failed to update media details due to invalid server response.');
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error || 'Failed to update metadata');
  }

  return data.item;
}

/**
 * Delete a media file and its database record permanently from cloud storage
 */
export async function deleteMediaFile(storageKey: string): Promise<boolean> {
  const res = await fetch(`/api/media/${encodeURIComponent(storageKey)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'Failed to delete media');
    }
  } else if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      throw new Error('Access Denied: Only the authorized website owner can delete content.');
    }
    throw new Error('Failed to delete media from storage.');
  }

  return true;
}

/**
 * Fetch persistent note from cloud database
 */
export async function fetchNote(key: string, fallback = ''): Promise<string> {
  try {
    const res = await fetch(`/api/notes/${encodeURIComponent(key)}`);
    if (!res.ok) return fallback;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return fallback;
    const data = await res.json();
    return data.content || fallback;
  } catch (err) {
    console.error(`Error in fetchNote(${key}):`, err);
    return fallback;
  }
}

/**
 * Save persistent note to cloud database
 */
export async function saveNote(key: string, content: string): Promise<string> {
  try {
    const res = await fetch(`/api/notes/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Failed to save note');
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return content;
    const data = await res.json();
    return data.content;
  } catch (err) {
    console.error(`Error in saveNote(${key}):`, err);
    throw err;
  }
}
