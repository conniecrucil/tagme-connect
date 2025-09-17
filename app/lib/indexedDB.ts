interface Configuration {
  productId: string;
  configuration: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    title?: string;
    website?: string;
    socialMedia: {
      linkedin?: string;
      instagram?: string;
      twitter?: string;
      facebook?: string;
    };
    customMessage?: string;
  };
  timestamp: number;
}

class ConfigurationDB {
  private dbName = 'SmartVCardConfigurations';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for configurations
        if (!db.objectStoreNames.contains('configurations')) {
          const store = db.createObjectStore('configurations', { keyPath: 'productId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async getConfiguration(productId: string): Promise<Configuration | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['configurations'], 'readonly');
      const store = transaction.objectStore('configurations');
      const request = store.get(productId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveConfiguration(productId: string, configuration: Configuration['configuration']): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['configurations'], 'readwrite');
      const store = transaction.objectStore('configurations');
      
      const configData: Configuration = {
        productId,
        configuration,
        timestamp: Date.now()
      };

      const request = store.put(configData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async removeConfiguration(productId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['configurations'], 'readwrite');
      const store = transaction.objectStore('configurations');
      const request = store.delete(productId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllConfigurations(): Promise<Configuration[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['configurations'], 'readonly');
      const store = transaction.objectStore('configurations');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }
}

// Export singleton instance
export const configurationDB = new ConfigurationDB();
export type { Configuration };
