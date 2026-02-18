
import { Product, Category, Order, User, Supplier } from '../types.ts';

const USER_CACHE_KEY = 'souq_user_profile';
const LOCAL_DB_KEY = 'souq_local_database';

// الحالة الافتراضية للبيانات في حال عدم وجود سيرفر
const INITIAL_MOCK_DATA = {
  products: [],
  categories: [],
  orders: [],
  users: [],
  suppliers: [],
  settings: { delivery_fee: '0', whatsapp_number: '201026034170' }
};

const LocalDB = {
  get() {
    const data = localStorage.getItem(LOCAL_DB_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(INITIAL_MOCK_DATA));
      return INITIAL_MOCK_DATA;
    }
    return JSON.parse(data);
  },
  save(data: any) {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
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
    url.searchParams.set('action', action);
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
    return null;
  }
};

export const ApiService = {
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
    return await safeFetch('get_admin_summary');
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
    if (result && Array.isArray(result)) return result;
    return LocalDB.get().products;
  },

  async getCategories(): Promise<Category[]> {
    const result = await safeFetch('get_categories');
    if (result && Array.isArray(result)) return result;
    return LocalDB.get().categories;
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
    if (result && Array.isArray(result)) return result;
    return LocalDB.get().orders;
  },

  async saveOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('save_order', { method: 'POST', body: JSON.stringify(order) });
    return result?.status === 'success';
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
    return await safeFetch(`return_order&id=${id}`, { method: 'POST' }) || { status: 'error' };
  },

  async getStoreSettings(): Promise<Record<string, string>> {
    const result = await safeFetch('get_store_settings');
    if (result) return result;
    return LocalDB.get().settings;
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
    return Array.isArray(result) ? result : [];
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
    return Array.isArray(result) ? result : [];
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
  }
};
