/**
 * PashuPulse IndexedDB Storage Engine
 * Clean, lightweight, zero-dependency promise wrapper around standard window.indexedDB.
 */

const DB_NAME = 'pashupulse_db';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Animals store
      if (!db.objectStoreNames.contains('animals')) {
        const animalStore = db.createObjectStore('animals', { keyPath: 'id' });
        animalStore.createIndex('user_id', 'user_id', { unique: false });
        animalStore.createIndex('status', 'status', { unique: false });
      }

      // 2. Health events store
      if (!db.objectStoreNames.contains('health_events')) {
        const eventStore = db.createObjectStore('health_events', { keyPath: 'id' });
        eventStore.createIndex('animal_id', 'animal_id', { unique: false });
        eventStore.createIndex('user_id', 'user_id', { unique: false });
      }

      // 3. Reminders store
      if (!db.objectStoreNames.contains('reminders')) {
        const remStore = db.createObjectStore('reminders', { keyPath: 'id' });
        remStore.createIndex('user_id', 'user_id', { unique: false });
        remStore.createIndex('due_date', 'due_date', { unique: false });
      }

      // 4. Cached symptom rules store (offline triage)
      if (!db.objectStoreNames.contains('symptom_rules')) {
        const ruleStore = db.createObjectStore('symptom_rules', { keyPath: 'id' });
        ruleStore.createIndex('species', 'species', { unique: false });
        ruleStore.createIndex('symptom_key', 'symptom_key', { unique: false });
      }

      // 5. Offline mutation sync queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        queueStore.createIndex('client_timestamp', 'client_timestamp', { unique: false });
      }

      // 6. Key-value meta store (tokens, sync watermarks)
      if (!db.objectStoreNames.contains('app_meta')) {
        db.createObjectStore('app_meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function tx(storeNames, mode, callback) {
  const db = await getDB();
  const transaction = db.transaction(storeNames, mode);
  return new Promise((resolve, reject) => {
    let result;
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('Transaction aborted'));

    try {
      result = callback(transaction);
    } catch (err) {
      reject(err);
    }
  });
}

// Simple store operations
export async function getAllFromStore(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getByIdFromStore(storeName, id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putToStore(storeName, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFromStore(storeName, id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearStore(storeName) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
