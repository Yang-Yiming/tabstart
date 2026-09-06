/**
 * IndexedDB-backed storage for the custom background image. Blobs are too
 * large for localStorage/chrome.storage, so only the background state
 * metadata goes there; the image itself lives here.
 *
 * A single fixed key is used: the homepage has one active background, so
 * each upload overwrites the previous image instead of accumulating rows.
 */

export interface StoredBackgroundImage {
  blob: Blob
  name: string
  type: string
  addedAt: number
}

const DB_NAME = 'tabstart-backgrounds'
const DB_VERSION = 1
const STORE_NAME = 'backgrounds'
const BACKGROUND_KEY = 'current'

function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
    request.onblocked = () => reject(new Error('IndexedDB open blocked'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openImageDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const request = run(tx.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
    })
  } finally {
    db.close()
  }
}

export async function saveBackgroundImage(file: Blob, name: string): Promise<void> {
  const record: StoredBackgroundImage = {
    blob: file,
    name,
    type: file.type,
    addedAt: Date.now(),
  }
  await withStore('readwrite', (store) => store.put(record, BACKGROUND_KEY))
}

/** Resolves null when nothing is stored or storage cannot be opened. */
export async function loadBackgroundImage(): Promise<StoredBackgroundImage | null> {
  try {
    const record = await withStore<StoredBackgroundImage | undefined>(
      'readonly',
      (store) => store.get(BACKGROUND_KEY),
    )
    return record ?? null
  } catch {
    return null
  }
}

export async function deleteBackgroundImage(): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(BACKGROUND_KEY))
  } catch {
    // Nothing stored or storage unavailable; leaving nothing behind is fine.
  }
}
