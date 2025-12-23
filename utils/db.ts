// utils/db.ts

const DB_NAME = 'CityTaskDB';
const DB_VERSION = 1;
const STORE_ALARMS_AUDIO = 'alarms_audio';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject('IndexedDB error: ' + (event.target as any).errorCode);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ALARMS_AUDIO)) {
        db.createObjectStore(STORE_ALARMS_AUDIO);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

export const saveAudioBlob = async (alarmId: string, blob: Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ALARMS_AUDIO], 'readwrite');
    const store = transaction.objectStore(STORE_ALARMS_AUDIO);
    const request = store.put(blob, alarmId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAudioBlob = async (alarmId: string): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ALARMS_AUDIO], 'readonly');
    const store = transaction.objectStore(STORE_ALARMS_AUDIO);
    const request = store.get(alarmId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const deleteAudioBlob = async (alarmId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_ALARMS_AUDIO], 'readwrite');
    const store = transaction.objectStore(STORE_ALARMS_AUDIO);
    const request = store.delete(alarmId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
