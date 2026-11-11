/**
 * Local device video storage using IndexedDB
 * Allows users to upload and persist video files directly from their device (phone/PC)
 * without exceeding localStorage quotas.
 */

const DB_NAME = 'gymhub_device_db';
const DB_VERSION = 1;
const STORE_NAME = 'device_videos';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this device.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredDeviceVideo {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  addedAt: string;
}

// In-memory object URL cache to avoid creating duplicate URLs
const objectUrlCache = new Map<string, string>();

/**
 * Save a video file to IndexedDB
 */
export async function saveDeviceVideoFile(id: string, file: File | Blob, fileName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const entry: StoredDeviceVideo = {
        id,
        name: fileName || (file as File).name || 'device_video.mp4',
        type: file.type || 'video/mp4',
        size: file.size,
        blob: file,
        addedAt: new Date().toISOString(),
      };

      const putRequest = store.put(entry);
      putRequest.onsuccess = () => resolve({ success: true });
      putRequest.onerror = () => resolve({ success: false, error: 'Failed to write video to device storage.' });
    });
  } catch (err: any) {
    console.error('Error saving device video:', err);
    return { success: false, error: err?.message || 'Storage error' };
  }
}

/**
 * Retrieve a device video blob and create/return an Object URL for playback
 */
export async function getDeviceVideoUrl(id: string): Promise<string | null> {
  if (objectUrlCache.has(id)) {
    return objectUrlCache.get(id)!;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const result = req.result as StoredDeviceVideo | undefined;
        if (result && result.blob) {
          const url = URL.createObjectURL(result.blob);
          objectUrlCache.set(id, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Error retrieving device video:', err);
    return null;
  }
}

/**
 * Delete a device video from IndexedDB and revoke its object URL
 */
export async function deleteDeviceVideoFile(id: string): Promise<boolean> {
  if (objectUrlCache.has(id)) {
    URL.revokeObjectURL(objectUrlCache.get(id)!);
    objectUrlCache.delete(id);
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Extract duration and basic metadata from a local device video file
 */
export function extractVideoDuration(file: File): Promise<{
  durationStr: string;
  durationMinutes: number;
  durationSeconds: number;
}> {
  return new Promise((resolve) => {
    try {
      const tempUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = tempUrl;

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(tempUrl);
        const totalSecs = Math.round(video.duration || 0);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        resolve({
          durationStr: formatted,
          durationMinutes: Math.max(1, Math.round(totalSecs / 60)),
          durationSeconds: totalSecs,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve({
          durationStr: '10:00',
          durationMinutes: 10,
          durationSeconds: 600,
        });
      };
    } catch {
      resolve({
        durationStr: '10:00',
        durationMinutes: 10,
        durationSeconds: 600,
      });
    }
  });
}
