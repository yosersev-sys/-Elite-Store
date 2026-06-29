import { Product, Category, Order, User, Supplier, Shift, DrawerTransaction, Expense, CustomerLedgerEntry, PaymentMethod } from '../types.ts';

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
let sessionExpiredAlerted = false;

const safeFetch = async (action: string, options?: RequestInit, timeoutMs?: number) => {
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

    let signal: AbortSignal | undefined = undefined;
    let timeoutId: any = undefined;
    if (timeoutMs) {
      const controller = new AbortController();
      signal = controller.signal;
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    }

    const response = await fetch(url.toString(), {
      ...options,
      signal: signal,
      headers: { 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers 
      },
    });

    if (timeoutId) clearTimeout(timeoutId);

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      // Response is not valid JSON
    }

    if (!response.ok) {
      if (data && data.message) {
        if (
          data.message === 'غير مصرح' || 
          data.message === 'يجب تسجيل الدخول أولاً' || 
          response.status === 401
        ) {
          if (!sessionExpiredAlerted) {
            sessionExpiredAlerted = true;
            window.dispatchEvent(new CustomEvent('souq-session-expired'));
          }
        }
        return data; // Return parsed data so caller can read the backend message
      }
      if (response.status === 401) {
        if (!sessionExpiredAlerted) {
          sessionExpiredAlerted = true;
          window.dispatchEvent(new CustomEvent('souq-session-expired'));
        }
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return data;
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
    if (user) {
      if (user.id) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        return user;
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
        return null;
      }
    }
    const saved = localStorage.getItem(USER_CACHE_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  async getAdminSummary(): Promise<any> {
    const result = await safeFetch('get_admin_summary');
    if (result && result.status !== 'error') {
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
      sessionExpiredAlerted = false;
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
      sessionExpiredAlerted = false;
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
    const result = await safeFetch('save_order', { method: 'POST', body: JSON.stringify(order) }, 1500);
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
    if (result && result.status !== 'error') {
      await idbSet('settings', result);
      return result;
    }
    return (await idbGet<Record<string, string>>('settings')) || { delivery_fee: '0', whatsapp_number: '201026034170' };
  },

  async updateStoreSettings(settings: Record<string, string>): Promise<boolean> {
    const result = await safeFetch('update_store_settings', { method: 'POST', body: JSON.stringify(settings) });
    return result?.status === 'success';
  },

  async addProduct(product: Product): Promise<{ success: boolean; status?: string; product?: Product; message?: string }> {
    const result = await safeFetch('add_product', { method: 'POST', body: JSON.stringify(product) });
    if (result?.status === 'success') {
      return { success: true, status: 'success' };
    }
    if (result?.status === 'barcode_exists') {
      return { success: false, status: 'barcode_exists', product: result.product, message: result.message };
    }
    return { success: false, status: 'error', message: result?.message || 'فشلت إضافة المنتج. قد يكون هناك مشكلة في صلاحيات الأدمن، حجم الصور، أو انتهاء الجلسة.' };
  },

  async updateProduct(product: Product): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('update_product', { method: 'POST', body: JSON.stringify(product) });
    if (result?.status === 'success') {
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشل تحديث المنتج. قد يكون هناك مشكلة في الصلاحيات أو حجم الصور.' };
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
    await idbSet('active_shift', null);
    await idbSet('admin_summary', null);
    await safeFetch('logout');
  },

  async generateSitemap(): Promise<boolean> {
    const result = await safeFetch('generate_sitemap');
    return result?.status === 'success';
  },

  async adjustStock(productId: string, adjustment: number, reason: string): Promise<{ success: boolean; newStock?: number; message?: string }> {
    const result = await safeFetch('adjust_stock', {
      method: 'POST',
      body: JSON.stringify({ productId, adjustment, reason })
    });
    if (result?.status === 'success') {
      return { success: true, newStock: result.newStock };
    }
    return { success: false, message: result?.message || 'فشل تعديل المخزون' };
  },

  async getProductHistory(productId: string): Promise<any[]> {
    const result = await safeFetch(`get_product_history&productId=${productId}`);
    return Array.isArray(result) ? result : [];
  },

  async bulkUpdatePrices(ids: string[], priceType: 'price' | 'wholesalePrice', adjustType: 'fixed' | 'percent', value: number): Promise<boolean> {
    const result = await safeFetch('bulk_update_prices', {
      method: 'POST',
      body: JSON.stringify({ ids, priceType, adjustType, value })
    });
    return result?.status === 'success';
  },

  async bulkUpdateReorderLevel(ids: string[], reorderLevel: number): Promise<boolean> {
    const result = await safeFetch('bulk_update_reorder_level', {
      method: 'POST',
      body: JSON.stringify({ ids, reorderLevel })
    });
    return result?.status === 'success';
  },

  async bulkUpdateCategory(ids: string[], categoryId: string): Promise<boolean> {
    const result = await safeFetch('bulk_update_category', {
      method: 'POST',
      body: JSON.stringify({ ids, categoryId })
    });
    return result?.status === 'success';
  },

  async bulkUpdateSupplier(ids: string[], supplierId: string | null): Promise<boolean> {
    const result = await safeFetch('bulk_update_supplier', {
      method: 'POST',
      body: JSON.stringify({ ids, supplierId })
    });
    return result?.status === 'success';
  },

  async bulkToggleProducts(ids: string[], active: number): Promise<boolean> {
    const result = await safeFetch('bulk_toggle_products', {
      method: 'POST',
      body: JSON.stringify({ ids, active })
    });
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
    activeShift: Shift | null;
  }> {
    const [products, categories, settings, adminSummary, users, suppliers, orders, activeShift] = await Promise.all([
      idbGet<Product[]>('products'),
      idbGet<Category[]>('categories'),
      idbGet<Record<string, string>>('settings'),
      idbGet<any>('admin_summary'),
      idbGet<User[]>('users'),
      idbGet<Supplier[]>('suppliers'),
      idbGet<Order[]>('orders'),
      idbGet<Shift | null>('active_shift')
    ]);
    return {
      products: products || [],
      categories: categories || [],
      settings: settings || {},
      adminSummary: adminSummary || null,
      users: users || [],
      suppliers: suppliers || [],
      orders: orders || [],
      activeShift: activeShift || null
    };
  },

  async getActiveShift(): Promise<Shift | null> {
    const result = await safeFetch('get_active_shift');
    if (result === null) {
      // Network/Server error, switch to local fallback!
      return await idbGet<Shift>('active_shift');
    }
    if (result && (result.status === 'no_active_shift' || result.status === 'error' || !result.id)) {
      await idbSet('active_shift', null);
      return null;
    }
    await idbSet('active_shift', result);
    return result;
  },

  async openShift(startingCash: number): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('open_shift', {
      method: 'POST',
      body: JSON.stringify({ startingCash })
    });
    if (result?.status === 'success') {
      const active: Shift = {
        id: result.shiftId || Date.now(),
        status: 'open',
        startingCash: startingCash,
        currentCashBalance: startingCash,
        startTime: Date.now(),
        openedByName: 'أدمن'
      };
      await idbSet('active_shift', active);
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشل فتح الوردية.' };
  },

  async addDrawerTransaction(type: 'deposit' | 'withdrawal', amount: number, reason: string): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('add_drawer_transaction', {
      method: 'POST',
      body: JSON.stringify({ type, amount, reason })
    });
    if (result?.status === 'success') {
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشل تسجيل حركة الدرج.' };
  },

  async closeShift(actualCash: number, discrepancyReason?: string, notes?: string): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('close_shift', {
      method: 'POST',
      body: JSON.stringify({ actualCash, discrepancyReason, notes })
    });
    if (result?.status === 'success') {
      await idbSet('active_shift', null);
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشل إغلاق الوردية.' };
  },

  async getShifts(): Promise<Shift[]> {
    const result = await safeFetch('get_shifts');
    if (result && (result as any).status === 'error') {
      return [];
    }
    return Array.isArray(result) ? result : [];
  },

  async getShiftDetails(id: number): Promise<{ shift: Shift; transactions: DrawerTransaction[]; orders: Order[]; auditLogs: any[] } | null> {
    const result = await safeFetch(`get_shift_details&id=${id}`);
    if (result && result.status === 'error') {
      return null;
    }
    return result;
  },

  async getExpenses(filters?: { month?: number; year?: number; category?: string; paymentSource?: string; status?: string }): Promise<Expense[]> {
    let query = 'get_expenses';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.month) params.set('month', String(filters.month));
      if (filters.year) params.set('year', String(filters.year));
      if (filters.category) params.set('category', filters.category);
      if (filters.paymentSource) params.set('paymentSource', filters.paymentSource);
      if (filters.status) params.set('status', filters.status);
      const str = params.toString();
      if (str) query += '&' + str;
    }
    const result = await safeFetch(query);
    if (result && (result as any).status === 'error') {
      return [];
    }
    return Array.isArray(result) ? result : [];
  },

  async addExpense(expense: Omit<Expense, 'id' | 'userId' | 'status' | 'date'>): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('add_expense', {
      method: 'POST',
      body: JSON.stringify(expense)
    });
    if (result?.status === 'success') {
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشل تسجيل المصروف.' };
  },

  async cancelExpense(id: number): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('cancel_expense', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (result?.status === 'success') {
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشل إلغاء المصروف.' };
  },

  async getCustomerLedger(userId: string): Promise<{ ledger: CustomerLedgerEntry[]; creditOrders: Order[] } | null> {
    const result = await safeFetch(`get_customer_ledger&userId=${userId}`);
    if (result && result.status === 'error') {
      return null;
    }
    return result;
  },

  async collectCustomerPayment(data: {
    userId: string;
    amount: number;
    type: 'PAYMENT' | 'ADJUSTMENT';
    paymentMethod: string;
    notes?: string;
    orderId?: string;
  }): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('collect_customer_payment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (result?.status === 'success') {
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشلت عملية الدفع.' };
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const result = await safeFetch('get_payment_methods');
    if (result && (result as any).status === 'error') {
      return [];
    }
    return Array.isArray(result) ? result : [];
  },

  async addPaymentMethod(method: Omit<PaymentMethod, 'createdAt' | 'isSystem' | 'isActive'>): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('add_payment_method', {
      method: 'POST',
      body: JSON.stringify(method)
    });
    if (result?.status === 'success') {
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشلت إضافة وسيلة الدفع.' };
  },

  async updatePaymentMethod(method: Partial<PaymentMethod> & { id: string }): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch('update_payment_method', {
      method: 'POST',
      body: JSON.stringify(method)
    });
    if (result?.status === 'success') {
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشل تعديل وسيلة الدفع.' };
  },

  async deletePaymentMethod(id: string): Promise<{ success: boolean; message?: string }> {
    const result = await safeFetch(`delete_payment_method&id=${id}`);
    if (result?.status === 'success') {
      return { success: true };
    }
    return { success: false, message: result?.message || 'فشل حذف وسيلة الدفع.' };
  }
};
