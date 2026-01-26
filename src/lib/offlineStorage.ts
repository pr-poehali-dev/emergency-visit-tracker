// IndexedDB хранилище для офлайн режима
const DB_NAME = 'mchs_offline_db';
const DB_VERSION = 1;
const STORE_OBJECTS = 'objects';
const STORE_PENDING = 'pending_sync';

interface PendingSyncItem {
  id: string;
  timestamp: number;
  type: 'visit' | 'object' | 'task';
  data: any;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB инициализирован');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Хранилище для объектов и пользователей
        if (!db.objectStoreNames.contains(STORE_OBJECTS)) {
          db.createObjectStore(STORE_OBJECTS, { keyPath: 'key' });
        }

        // Очередь для синхронизации
        if (!db.objectStoreNames.contains(STORE_PENDING)) {
          const store = db.createObjectStore(STORE_PENDING, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('✅ IndexedDB структура создана');
      };
    });
  }

  async saveObjects(objects: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_OBJECTS], 'readwrite');
      const store = transaction.objectStore(STORE_OBJECTS);
      
      store.put({ key: 'objects', data: objects });
      
      transaction.oncomplete = () => {
        console.log('✅ Объекты сохранены в IndexedDB');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getObjects(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_OBJECTS], 'readonly');
      const store = transaction.objectStore(STORE_OBJECTS);
      const request = store.get('objects');
      
      request.onsuccess = () => {
        resolve(request.result?.data || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveUsers(users: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_OBJECTS], 'readwrite');
      const store = transaction.objectStore(STORE_OBJECTS);
      
      store.put({ key: 'users', data: users });
      
      transaction.oncomplete = () => {
        console.log('✅ Пользователи сохранены в IndexedDB');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getUsers(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_OBJECTS], 'readonly');
      const store = transaction.objectStore(STORE_OBJECTS);
      const request = store.get('users');
      
      request.onsuccess = () => {
        resolve(request.result?.data || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addPendingSync(item: Omit<PendingSyncItem, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();
    
    const pendingItem: PendingSyncItem = {
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...item
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PENDING], 'readwrite');
      const store = transaction.objectStore(STORE_PENDING);
      
      store.add(pendingItem);
      
      transaction.oncomplete = () => {
        console.log('✅ Добавлено в очередь синхронизации:', pendingItem.type);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getPendingSync(): Promise<PendingSyncItem[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PENDING], 'readonly');
      const store = transaction.objectStore(STORE_PENDING);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingSync(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PENDING], 'readwrite');
      const store = transaction.objectStore(STORE_PENDING);
      
      store.delete(id);
      
      transaction.oncomplete = () => {
        console.log('✅ Удалено из очереди:', id);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearAllPendingSync(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_PENDING], 'readwrite');
      const store = transaction.objectStore(STORE_PENDING);
      
      store.clear();
      
      transaction.oncomplete = () => {
        console.log('✅ Очередь синхронизации очищена');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
