
import { Product, Category, Order, User, Supplier } from '../types.ts';

const USER_CACHE_KEY = 'souq_user_profile';

/**
 * الحصول على المسار الصحيح للمجلد المقسم
 * نستخدم ملفات منفصلة لكل موديول لضمان أداء أسرع
 */
const getApiEndpoint = (file: string, action: string) => {
  // إضافة timestamp لمنع المتصفح من جلب نسخة قديمة (Cache)
  const nocache = `&_t=${Date.now()}`;
  return `api/${file}.php?action=${action}${nocache}`;
};

const safeFetch = async (file: string, action: string, options?: RequestInit) => {
  try {
    const url = getApiEndpoint(file, action);
    
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
      // إذا فشل المجلد المقسم (404)، نحاول المناداة من الملف الموحد كخطة بديلة (Fallback)
      console.warn(`Modular API 404, falling back to root api.php for: ${action}`);
      const fallbackUrl = `api.php?action=${action}&_t=${Date.now()}`;
      const fallbackRes = await fetch(fallbackUrl, options);
      if (fallbackRes.ok) return await fallbackRes.json();
      
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`CRITICAL API FAILURE (${file}/${action}):`, error);
    return null;
  }
};

export const ApiService = {
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
