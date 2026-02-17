
import { Product, Category, Order, User, Supplier } from '../types.ts';

const USER_CACHE_KEY = 'souq_user_profile';

/**
 * دالة جلب البيانات مع معالجة الأخطاء والمسارات الذكية
 */
const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    // الحصول على المسار الأساسي المحقون أو افتراض الملف في نفس المجلد
    let apiBase = (window as any).__SOUQ_API_PATH__ || 'api.php';
    
    // بناء رابط مطلق يحترم المجلد الحالي (Subdirectory support)
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    
    // إذا كان apiBase يبدأ بـ / فهو مطلق من الجذر، وإلا فهو من المجلد الحالي
    const baseUrl = apiBase.startsWith('/') 
      ? window.location.origin + apiBase
      : window.location.origin + currentDir + apiBase;

    const url = new URL(baseUrl);
    url.searchParams.set('action', action);
    url.searchParams.set('_t', Date.now().toString()); // منع الكاش

    const response = await fetch(url.toString(), {
      ...options,
      headers: { 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers 
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    // إرجاع مصفوفة فارغة لعمليات الجلب لتجنب تعطل الواجهة في حال 404
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

  async generateSitemap(): Promise<boolean> {
    const result = await safeFetch('generate_sitemap');
    return result?.status === 'success';
  },

  async getAdminPhone(): Promise<{phone: string} | null> {
    return await safeFetch('get_admin_phone');
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

  async getProducts(): Promise<Product[]> {
    return await safeFetch('get_products') || [];
  },

  async getAllImages(): Promise<{url: string, productName: string}[]> {
    return await safeFetch('get_all_images') || [];
  },

  async getCategories(): Promise<Category[]> {
    return await safeFetch('get_categories') || [];
  },

  async getOrders(): Promise<Order[]> {
    return await safeFetch('get_orders') || [];
  },

  async getUsers(): Promise<User[]> {
    return await safeFetch('get_users') || [];
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

  async saveOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('save_order', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return result?.status === 'success';
  },

  async updateOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('update_order', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return result?.status === 'success';
  },

  async returnOrder(id: string): Promise<{status: string, message?: string}> {
    return await safeFetch('return_order', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_product&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
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

  async updateOrderPayment(id: string, paymentMethod: string): Promise<boolean> {
    const result = await safeFetch('update_order_payment', {
      method: 'POST',
      body: JSON.stringify({ id, paymentMethod })
    });
    return result?.status === 'success';
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
  }
};
