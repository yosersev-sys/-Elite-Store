
import { Product, Category, Order, User, Supplier } from '../types.ts';

const USER_CACHE_KEY = 'souq_user_profile';

/**
 * الحصول على رابط الـ API بشكل ديناميكي ومطلق
 * يضمن هذاConstruct العمل حتى لو كان الموقع في مجلد فرعي
 */
const getBaseUrl = () => {
  return window.location.href.split('#')[0].split('?')[0].replace('index.php', '').replace(/\/$/, '');
};

const getApiUrl = (module: string, action: string) => {
  const base = getBaseUrl();
  const nocache = `&_t=${Date.now()}`;
  // نحاول الوصول للمسار المقسم أولاً
  return `${base}/api/${module}.php?action=${action}${nocache}`;
};

const safeFetch = async (module: string, action: string, options?: RequestInit) => {
  try {
    const url = getApiUrl(module, action);
    
    let response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: { 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers 
      },
    });

    // خطة بديلة: إذا فشل المجلد المقسم (404)، نحاول استخدام الملف الموحد في الجذر
    if (!response.ok && response.status === 404) {
      console.warn(`Modular API 404 for ${module}/${action}, falling back to root api.php`);
      const fallbackUrl = `${getBaseUrl()}/api.php?action=${action}&_t=${Date.now()}`;
      response = await fetch(fallbackUrl, options);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API FAILURE [${module}/${action}]:`, error);
    return null;
  }
};

export const ApiService = {
  // --- USERS ---
  async getCurrentUser(): Promise<User | null> {
    const user = await safeFetch('users', 'get_current_user');
    if (user && user.id) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  async login(phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    const result = await safeFetch('users', 'login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    if (result?.status === 'success' && result.user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
    }
    return result;
  },

  async register(name: string, phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    const result = await safeFetch('users', 'register', {
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
    await safeFetch('users', 'logout');
  },

  async updateProfile(data: { name: string, phone: string, password?: string }): Promise<{status: string, message?: string}> {
    return await safeFetch('users', 'update_profile', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async adminUpdateUser(data: { id: string, name: string, phone: string, password?: string }): Promise<{status: string, message?: string}> {
    return await safeFetch('users', 'admin_update_user', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteUser(id: string): Promise<boolean> {
    const result = await safeFetch('users', `delete_user&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async getUsers(): Promise<User[]> {
    return await safeFetch('users', 'get_users') || [];
  },

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    return await safeFetch('products', 'get_products') || [];
  },

  async getAllImages(): Promise<{url: string, productName: string}[]> {
    return await safeFetch('products', 'get_all_images') || [];
  },

  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('products', 'add_product', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('products', 'update_product', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch('products', `delete_product&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  // --- SUPPLIERS ---
  async getSuppliers(): Promise<Supplier[]> {
    return await safeFetch('suppliers', 'get_suppliers') || [];
  },

  async addSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('suppliers', 'add_supplier', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    return result?.status === 'success';
  },

  async updateSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('suppliers', 'update_supplier', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    return result?.status === 'success';
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await safeFetch('suppliers', `delete_supplier&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    return await safeFetch('categories', 'get_categories') || [];
  },

  async addCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('categories', 'add_category', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    return result?.status === 'success';
  },

  async updateCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('categories', 'update_category', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    return result?.status === 'success';
  },

  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch('categories', `delete_category&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    return await safeFetch('orders', 'get_orders') || [];
  },

  async saveOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('orders', 'save_order', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return result?.status === 'success';
  },

  async updateOrderPayment(id: string, paymentMethod: string): Promise<boolean> {
    const result = await safeFetch('orders', 'update_order_payment', {
      method: 'POST',
      body: JSON.stringify({ id, paymentMethod })
    });
    return result?.status === 'success';
  },

  async returnOrder(id: string): Promise<{status: string, message?: string}> {
    return await safeFetch('orders', 'return_order', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  },

  // --- SETTINGS ---
  async getStoreSettings(): Promise<Record<string, string>> {
    return await safeFetch('settings', 'get_store_settings') || {};
  },

  async updateStoreSettings(settings: Record<string, string>): Promise<boolean> {
    const result = await safeFetch('settings', 'update_store_settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    return result?.status === 'success';
  },

  async generateSitemap(): Promise<boolean> {
    const result = await safeFetch('settings', 'generate_sitemap');
    return result?.status === 'success';
  }
};
