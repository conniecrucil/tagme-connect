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
    prefix?: string;
    fname?: string;
    lname?: string;
    pronouns?: string;
    street?: string;
    city?: string;
    state?: string;
    postal?: string;
    country?: string;
    mobile?: string;
    photo?: string;
    primaryActions?: Array<{
      name: string;
      value: string;
      type: string;
      color?: string;
      placeholder?: string;
      label?: string;
    }>;
    secondaryActions?: Array<{
      name: string;
      value: string;
      type: string;
      color?: string;
      placeholder?: string;
      label?: string;
    }>;
    images?: {
      logo: { url: string | null; blob: string | null; ext: string | null; mime: string | null; resized: string | null };
      photo: { url: string | null; blob: string | null; ext: string | null; mime: string | null; resized: string | null };
      cover: { url: string | null; blob: string | null; ext: string | null; mime: string | null; resized: string | null };
      cardDesign?: { url: string | null; blob: string | null; ext: string | null; mime: string | null; resized: string | null };
    };
    logoOrHeader?: boolean;
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

// Cart Database Class
interface CartItemDB {
  productId: string;
  productType: 'basic' | 'core';
  quantity: number;
  configuration?: Record<string, unknown>;
  url?: string;
  price: number;
  id: string;
}

class CartDB {
  private dbName = 'SmartVCardCart';
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
        
        // Create object store for cart items
        if (!db.objectStoreNames.contains('cartItems')) {
          const store = db.createObjectStore('cartItems', { keyPath: 'id' });
          store.createIndex('productId', 'productId', { unique: false });
        }
      };
    });
  }

  async getAllCartItems(): Promise<CartItemDB[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cartItems'], 'readonly');
      const store = transaction.objectStore('cartItems');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async addCartItem(item: CartItemDB): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cartItems'], 'readwrite');
      const store = transaction.objectStore('cartItems');
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateCartItem(itemId: string, updates: Partial<CartItemDB>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cartItems'], 'readwrite');
      const store = transaction.objectStore('cartItems');
      const request = store.get(itemId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const item = request.result;
        if (!item) {
          reject(new Error('Item not found'));
          return;
        }

        const updatedItem = { ...item, ...updates };
        const updateRequest = store.put(updatedItem);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  }

  async removeCartItem(itemId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cartItems'], 'readwrite');
      const store = transaction.objectStore('cartItems');
      const request = store.delete(itemId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearCart(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cartItems'], 'readwrite');
      const store = transaction.objectStore('cartItems');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Export singleton instances
export const configurationDB = new ConfigurationDB();
export const cartDB = new CartDB();
export type { Configuration, CartItemDB };
