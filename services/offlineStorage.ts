import { Order, Product, Category, User, Supplier, Shift } from '../types.ts';
import { SYNC_CONFIG } from './syncConfig.ts';

const IDB_NAME = 'SouqAlAsrDB';
const IDB_VERSION = 2; // Incremented version to support offline_queue and sync_logs

export interface OfflineQueueItem<T = any> {
  localUuid: string;
  entity: 'orders' | 'returns' | 'expenses' | 'inventory';
  payload: T;
  createdAt: number;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'conflict' | 'synced';
  syncError?: string;
  lastSyncAttempt?: number;
}

export interface SyncLog {
  id: string;
  startTime: number;
  endTime: number;
  processedCount: number;
  requestsSentCount: number;
  status: 'success' | 'failed' | 'cancelled';
  details: string;
}

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Cache store (reused or created)
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
      
      // Offline queue store
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'localUuid' });
      }
      
      // Sync log store
      if (!db.objectStoreNames.contains('sync_logs')) {
        db.createObjectStore('sync_logs', { keyPath: 'id' });
      }
    };
  });
};

// Generic read operation
const idbGet = async <T>(storeName: string, key: string): Promise<T | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`IDB Get Error in ${storeName} for key ${key}:`, e);
    return null;
  }
};

// Generic transactional write operation
const idbSet = async (storeName: string, key: string, value: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put(value, key);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  } catch (e) {
    console.error(`IDB Set Error in ${storeName} for key ${key}:`, e);
    throw e;
  }
};

// Generic transactional put directly (for keyed stores)
const idbPutItem = async (storeName: string, item: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put(item);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Transaction aborted'));
    });
  } catch (e) {
    console.error(`IDB PutItem Error in ${storeName}:`, e);
    throw e;
  }
};

// Generic delete operation
const idbDelete = async (storeName: string, key: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.delete(key);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    console.error(`IDB Delete Error in ${storeName} for key ${key}:`, e);
    throw e;
  }
};

// Generic get all operation
const idbGetAll = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result as T[]) || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error(`IDB GetAll Error in ${storeName}:`, e);
    return [];
  }
};

export const OfflineStorageService = {
  // --- Cache methods ('store' store) ---
  async getCache<T>(key: string): Promise<T | null> {
    return idbGet<T>('store', key);
  },

  async setCache(key: string, value: any): Promise<void> {
    await idbSet('store', key, value);
  },

  // --- Offline Queue methods ('offline_queue' store) ---
  async getQueueItems(): Promise<OfflineQueueItem[]> {
    return idbGetAll<OfflineQueueItem>('offline_queue');
  },

  async getQueueItem(localUuid: string): Promise<OfflineQueueItem | null> {
    return idbGet<OfflineQueueItem>('offline_queue', localUuid);
  },

  async saveQueueItem(item: OfflineQueueItem): Promise<void> {
    await idbPutItem('offline_queue', item);
  },

  async deleteQueueItem(localUuid: string): Promise<void> {
    await idbDelete('offline_queue', localUuid);
  },

  async getPendingCount(): Promise<number> {
    const items = await this.getQueueItems();
    return items.filter(i => i.syncStatus !== 'synced').length;
  },

  async getFailedCount(): Promise<number> {
    const items = await this.getQueueItems();
    return items.filter(i => i.syncStatus === 'failed' || i.syncStatus === 'conflict').length;
  },

  // Purge synced items older than config cutoff days
  async runCleanupPolicy(): Promise<number> {
    try {
      const items = await this.getQueueItems();
      const cutoffTime = Date.now() - (SYNC_CONFIG.OFFLINE_CLEANUP_DAYS * 24 * 60 * 60 * 1000);
      let count = 0;
      for (const item of items) {
        if (item.syncStatus === 'synced' && item.createdAt < cutoffTime) {
          await this.deleteQueueItem(item.localUuid);
          count++;
        }
      }
      return count;
    } catch (e) {
      console.error('Queue cleanup failed:', e);
      return 0;
    }
  },

  // --- Sync Logs methods ('sync_logs' store) ---
  async saveSyncLog(log: SyncLog): Promise<void> {
    await idbPutItem('sync_logs', log);
  },

  async getSyncLogs(): Promise<SyncLog[]> {
    const logs = await idbGetAll<SyncLog>('sync_logs');
    return logs.sort((a, b) => b.startTime - a.startTime).slice(0, 100); // return last 100 logs
  },

  async getIndexedDbVersion(): Promise<number> {
    return IDB_VERSION;
  }
};
