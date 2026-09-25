/**
 * Safe local and cloud synchronization utilities for user inputs and notes
 */
import { getAuthHeaders } from './api';

/**
 * Synchronous local storage reader with type safety and fallback
 */
export function getStoredMetadata<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    try {
      return JSON.parse(item) as T;
    } catch {
      // If raw string was stored
      return item as unknown as T;
    }
  } catch (err) {
    console.warn(`Error reading key "${key}" from localStorage:`, err);
    return fallback;
  }
}

/**
 * Synchronous local storage writer with automatic backend sync for cross-device support
 */
export function setStoredMetadata<T>(key: string, value: T): void {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, typeof value === 'string' ? JSON.stringify(value) : serialized);

    // Asynchronously synchronize with backend notes database for multi-device support
    fetch(`/api/notes/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ content: typeof value === 'string' ? value : serialized }),
    }).catch((err) => {
      console.warn(`Background note sync failed for ${key}:`, err);
    });
  } catch (err) {
    console.error(`Error saving metadata for key "${key}":`, err);
  }
}

/**
 * Async note loader from cloud backend with localStorage caching
 */
export async function fetchStoredNote(key: string, fallback = ''): Promise<string> {
  try {
    const res = await fetch(`/api/notes/${encodeURIComponent(key)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.content !== undefined && data.content !== null && data.content !== '') {
        localStorage.setItem(key, JSON.stringify(data.content));
        return data.content;
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch cloud note for "${key}", using local fallback:`, e);
  }
  return getStoredMetadata<string>(key, fallback);
}

/**
 * Async note saver to cloud backend
 */
export async function saveStoredNote(key: string, content: string): Promise<void> {
  setStoredMetadata(key, content);
}
