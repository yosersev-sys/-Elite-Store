
import { Product, Category, Order, User, Supplier } from '../types.ts';

const USER_CACHE_KEY = 'souq_user_profile';

/**
 * دالة ذكية لتحديد المسار الأساسي للموقع
 * تضمن العمل في المجلدات الفرعية وعلى الاستضافات المختلفة
 */
const getBaseUrl = () => {
  const path = window.location.pathname;
  const directory = path.substring(0, path.lastIndexOf('/') + 1);
  return window.location.origin + directory;
};

/**
 * خريطة لتوجيه كل "action" إلى الملف المناسب في مجلد api/
 */
const ACTION_TO_MODULE: Record<string, string> = {
  // Users Module
  'login': 'users', 'register': 'users', 'logout': 'users', 'get_current_user': 'users', 
  'update_profile': 'users', 'admin_update_user': 'users', 'delete_user': 'users', 'get_users': 'users',
  // Products Module
  'get_products': 'products', 'add_product': 'products', 'update_product': 'products', 
  'delete_product': 'products', 'get_all_images': 'products',
  // Categories Module
  'get_categories': 'categories', 'add_category': 'categories', 'update_category': 'categories', 'delete_category': 'categories',
  // Orders Module
  'get_orders': 'orders', 'save_order': 'orders', 'update_order_payment': 'orders', 'return_order': 'orders',
  // Suppliers Module
  'get_suppliers': 'suppliers', 'add_supplier': 'suppliers', 'update_supplier': 'suppliers', 'delete_supplier': 'suppliers',
  // Settings Module
  'get_store_settings': 'settings', 'update_store_settings': 'settings', 'generate_sitemap': 'settings'
};

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const module = ACTION_TO_MODULE[action] || 'init';
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}api/${module}.php?action=${action}&_t=${Date.now()}`;
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: { 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers 
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} at ${url}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API ERROR [${action}]:`, error);
    // إرجاع قيم افتراضية لتجنب الصفحة البيضاء في الواجهة
    if (action.startsWith('get_')) return [];
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
    return null;
  },

  async login(phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    const result = await safeFetch('login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    if (result?.status === 'success' && result.user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
    }
    return result;
  },

  async register(name: string, phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    const result = await safeFetch('register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password })
    });
    if (result?.status === 'success' && result.user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
    }
    return result;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(USER_CACHE_KEY);
    await safeFetch('logout');
  },

  async updateProfile(data: { name: string, phone: string, password?: string }): Promise<{status: string, message?: string}> {
    return await safeFetch('update_profile', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async adminUpdateUser(data: { id: string, name: string, phone: string, password?: string }): Promise<{status: string, message?: string}> {
    return await safeFetch('admin_update_user', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteUser(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_user&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async getUsers(): Promise<User[]> {
    return await safeFetch('get_users') || [];
  },

  async getProducts(): Promise<Product[]> {
    return await safeFetch('get_products') || [];
  },

  async getAllImages(): Promise<{url: string, productName: string}[]> {
    return await safeFetch('get_all_images') || [];
  },

  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('add_product', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('update_product', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_product&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async getSuppliers(): Promise<Supplier[]> {
    return await safeFetch('get_suppliers') || [];
  },

  async addSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('add_supplier', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    return result?.status === 'success';
  },

  async updateSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('update_supplier', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    return result?.status === 'success';
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_supplier&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async getCategories(): Promise<Category[]> {
    return await safeFetch('get_categories') || [];
  },

  async addCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('add_category', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    return result?.status === 'success';
  },

  async updateCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('update_category', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    return result?.status === 'success';
  },

  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_category&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async getOrders(): Promise<Order[]> {
    return await safeFetch('get_orders') || [];
  },

  async saveOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('save_order', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return result?.status === 'success';
  },

  async updateOrderPayment(id: string, paymentMethod: string): Promise<boolean> {
    const result = await safeFetch('update_order_payment', {
      method: 'POST',
      body: JSON.stringify({ id, paymentMethod })
    });
    return result?.status === 'success';
  },

  async returnOrder(id: string): Promise<{status: string, message?: string}> {
    return await safeFetch('return_order', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  },

  async getStoreSettings(): Promise<Record<string, string>> {
    return await safeFetch('get_store_settings') || {};
  },

  async updateStoreSettings(settings: Record<string, string>): Promise<boolean> {
    const result = await safeFetch('update_store_settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    return result?.status === 'success';
  },

  async generateSitemap(): Promise<boolean> {
    const result = await safeFetch('generate_sitemap');
    return result?.status === 'success';
  }
};
