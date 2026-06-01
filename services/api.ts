import { Product, Category, Order, User, Supplier } from '../types.ts';

const USER_CACHE_KEY = 'souq_user_profile';

// IndexedDB Wrapper
const IDB_NAME = 'SouqAlAsrDB';
const IDB_VERSION = 1;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
    };
  });
};

const idbGet = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('store', 'readonly');
      const store = transaction.objectStore('store');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB Get Error', e);
    return null;
  }
};

const idbSet = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('store', 'readwrite');
      const store = transaction.objectStore('store');
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB Set Error', e);
  }
};

let useMockMode = false;

const safeFetch = async (action: string, options?: RequestInit) => {
  if (useMockMode) return null; 

  try {
    let apiBase = (window as any).__SOUQ_API_PATH__ || 'api.php';
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    const baseUrl = apiBase.startsWith('/') 
      ? window.location.origin + apiBase
      : window.location.origin + currentDir + apiBase;

    const url = new URL(baseUrl);
    
    const [actionName, ...rest] = action.split('&');
    url.searchParams.set('action', actionName);
    
    if (rest.length > 0) {
      const extraParams = new URLSearchParams(rest.join('&'));
      extraParams.forEach((val, key) => {
        url.searchParams.set(key, val);
      });
    }
    
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      ...options,
      headers: { 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers 
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`API Network Error (${action}), switching to Local Fallback Mode.`);
    return null; // Signals fallback
  }
};

export const ApiService = {
  // Sync Engine: Manges offline queue
  async syncOfflineData(): Promise<{ success: boolean; syncedCount: number; remainingCount: number; errors: any[] }> {
    const syncQueue: Order[] = (await idbGet<Order[]>('offline_sync_queue')) || [];
    if (syncQueue.length === 0) return { success: true, syncedCount: 0, remainingCount: 0, errors: [] };

    let syncedCount = 0;
    const remainingQueue: Order[] = [];
    const errors: any[] = [];

    for (const order of syncQueue) {
      try {
        const result = await safeFetch('save_order', {
          method: 'POST',
          body: JSON.stringify({ ...order, is_offline_sync: true }) 
        });

        if (result?.status === 'success') {
          syncedCount++;
        } else {
          remainingQueue.push(order);
          errors.push(result?.message || 'Server rejected order');
        }
      } catch (err) {
        remainingQueue.push(order);
        errors.push(err);
      }
    }

    await idbSet('offline_sync_queue', remainingQueue);
    return {
      success: remainingQueue.length === 0,
      syncedCount,
      remainingCount: remainingQueue.length,
      errors
    };
  },

  async getCurrentUser(): Promise<User | null> {
    const user = await safeFetch('get_current_user');
    if (user && user.id) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      return user;
    }
    const saved = localStorage.getItem(USER_CACHE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  async getAdminSummary(): Promise<any> {
    const result = await safeFetch('get_admin_summary');
    if (result) {
      await idbSet('admin_summary', result);
      return result;
    }
    return (await idbGet<any>('admin_summary')) || null;
  },

  async login(phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    const result = await safeFetch('login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    if (result?.status === 'success') {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
      return result;
    }
    return { status: 'error', message: result?.message || 'بيانات الدخول غير صحيحة' };
  },

  async register(name: string, phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    const result = await safeFetch('register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password })
    });
    if (result?.status === 'success') {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
      return result;
    }
    return { status: 'error', message: result?.message || 'رقم الهاتف مسجل مسبقاً' };
  },

  async adminAddUser(data: any): Promise<{status: string, message?: string}> {
    return await safeFetch('admin_add_user', {
      method: 'POST',
      body: JSON.stringify(data)
    }) || { status: 'error' };
  },

  async getProducts(): Promise<Product[]> {
    const result = await safeFetch('get_products');
    if (result && Array.isArray(result)) {
      await idbSet('products', result);
      return result;
    }
    return (await idbGet<Product[]>('products')) || [];
  },

  async getCategories(): Promise<Category[]> {
    const result = await safeFetch('get_categories');
    if (result && Array.isArray(result)) {
      await idbSet('categories', result);
      return result;
    }
    return (await idbGet<Category[]>('categories')) || [];
  },

  async addCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('add_category', { method: 'POST', body: JSON.stringify(category) });
    return result?.status === 'success';
  },

  async updateCategory(category: Partial<Category> & { id: string }): Promise<boolean> {
    const result = await safeFetch('update_category', { method: 'POST', body: JSON.stringify(category) });
    return result?.status === 'success';
  },

  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_category&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async getOrders(): Promise<Order[]> {
    const result = await safeFetch('get_orders');
    if (result && Array.isArray(result)) {
      await idbSet('orders', result);
      return result;
    }
    return (await idbGet<Order[]>('orders')) || [];
  },

  async saveOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('save_order', { method: 'POST', body: JSON.stringify(order) });
    if (result?.status === 'success') return true;

    // Offline Handling
    // 1. Save to Sync Queue with real timestamp
    const offlineOrder = { ...order, offline_timestamp: Date.now() };
    const queue = (await idbGet<Order[]>('offline_sync_queue')) || [];
    queue.push(offlineOrder as Order);
    await idbSet('offline_sync_queue', queue);

    // 2. Deduct Stock Locally
    const products = (await idbGet<Product[]>('products')) || [];
    let updated = false;
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        const currentStock = prod.stockQuantity || 0;
        prod.stockQuantity = Math.max(0, currentStock - item.quantity);
        updated = true;
      }
    });
    if (updated) await idbSet('products', products);

    // 3. Add to Local Orders view
    const orders = (await idbGet<Order[]>('orders')) || [];
    orders.unshift(offlineOrder as Order);
    await idbSet('orders', orders);

    // Trigger background sync if possible
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((reg: any) => reg.sync.register('sync-offline-orders')).catch(console.error);
    }

    return true; // Fakes success so UI can proceed
  },

  async updateOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('update_order', { method: 'POST', body: JSON.stringify(order) });
    return result?.status === 'success';
  },

  async updateOrderPayment(id: string, paymentMethod: string): Promise<boolean> {
    const result = await safeFetch('update_order_payment', { method: 'POST', body: JSON.stringify({ id, paymentMethod }) });
    return result?.status === 'success';
  },

  async returnOrder(id: string): Promise<{status: string}> {
    return await safeFetch(`return_order&id=${id}`, { 
      method: 'POST',
      body: JSON.stringify({ id }) 
    }) || { status: 'error' };
  },

  async getStoreSettings(): Promise<Record<string, string>> {
    const result = await safeFetch('get_store_settings');
    if (result) {
      await idbSet('settings', result);
      return result;
    }
    return (await idbGet<Record<string, string>>('settings')) || { delivery_fee: '0', whatsapp_number: '201026034170' };
  },

  async updateStoreSettings(settings: Record<string, string>): Promise<boolean> {
    const result = await safeFetch('update_store_settings', { method: 'POST', body: JSON.stringify(settings) });
    return result?.status === 'success';
  },

  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('add_product', { method: 'POST', body: JSON.stringify(product) });
    return result?.status === 'success';
  },

  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('update_product', { method: 'POST', body: JSON.stringify(product) });
    return result?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_product&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async getAllImages(): Promise<{url: string, productName: string}[]> {
    const result = await safeFetch('get_all_images');
    return Array.isArray(result) ? result : [];
  },

  async getAdminPhone(): Promise<{phone: string} | null> {
    const settings = await this.getStoreSettings();
    return { phone: settings.whatsapp_number || '201026034170' };
  },

  async getUsers(): Promise<User[]> {
    const result = await safeFetch('get_users');
    if (Array.isArray(result)) {
      await idbSet('users', result);
      return result;
    }
    return (await idbGet<User[]>('users')) || [];
  },

  async updateProfile(data: any): Promise<{status: string, message?: string}> {
    return await safeFetch('update_profile', { method: 'POST', body: JSON.stringify(data) }) || { status: 'error' };
  },

  async adminUpdateUser(data: any): Promise<{status: string, message?: string}> {
    return await safeFetch('admin_update_user', { method: 'POST', body: JSON.stringify(data) }) || { status: 'error' };
  },

  async deleteUser(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_user&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async getSuppliers(): Promise<Supplier[]> {
    const result = await safeFetch('get_suppliers');
    if (Array.isArray(result)) {
      await idbSet('suppliers', result);
      return result;
    }
    return (await idbGet<Supplier[]>('suppliers')) || [];
  },

  async addSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('add_supplier', { method: 'POST', body: JSON.stringify(supplier) });
    return result?.status === 'success';
  },

  async updateSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('update_supplier', { method: 'POST', body: JSON.stringify(supplier) });
    return result?.status === 'success';
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_supplier&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async logout(): Promise<void> {
    localStorage.removeItem(USER_CACHE_KEY);
    await safeFetch('logout');
  },

  async generateSitemap(): Promise<boolean> {
    const result = await safeFetch('generate_sitemap');
    return result?.status === 'success';
  },
  
  // Public access to offline IDB queue count
  async getOfflineQueueCount(): Promise<number> {
    const queue = await idbGet<Order[]>('offline_sync_queue');
    return queue ? queue.length : 0;
  },

  // Get entire cached state for instant PWA loading
  async getLocalState(): Promise<{
    products: Product[];
    categories: Category[];
    settings: Record<string, string>;
    adminSummary: any;
    users: User[];
    suppliers: Supplier[];
    orders: Order[];
  }> {
    const [products, categories, settings, adminSummary, users, suppliers, orders] = await Promise.all([
      idbGet<Product[]>('products'),
      idbGet<Category[]>('categories'),
      idbGet<Record<string, string>>('settings'),
      idbGet<any>('admin_summary'),
      idbGet<User[]>('users'),
      idbGet<Supplier[]>('suppliers'),
      idbGet<Order[]>('orders')
    ]);
    return {
      products: products || [],
      categories: categories || [],
      settings: settings || {},
      adminSummary: adminSummary || null,
      users: users || [],
      suppliers: suppliers || [],
      orders: orders || []
    };
  }
};
