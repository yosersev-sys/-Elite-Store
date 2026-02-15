
import { Product, Category, Order, User } from '../types.ts';

const API_URL = 'api.php';
const OFFLINE_ORDERS_KEY = 'souq_offline_orders';
const PRODUCTS_CACHE_KEY = 'souq_products_cache';
const USER_CACHE_KEY = 'souq_user_profile';

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, {
      ...options,
      headers: { 'Accept': 'application/json', ...options?.headers },
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Fetch Error (${action}):`, error);
    return null;
  }
};

export const ApiService = {
  async getCurrentUser(): Promise<User | null> {
    const user = await safeFetch('get_current_user');
    
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      return user;
    }

    // إذا كنا أوفلاين، نسحب بيانات المستخدم من الذاكرة المحلية
    const cachedUser = localStorage.getItem(USER_CACHE_KEY);
    return cachedUser ? JSON.parse(cachedUser) : null;
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
    const result = await safeFetch('update_profile', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (result?.status === 'success') {
      const user = await this.getCurrentUser();
      if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    }
    return result;
  },

  async adminUpdateUser(data: { id: string, name: string, phone: string, password?: string }): Promise<{status: string, message?: string}> {
    return await safeFetch('admin_update_user', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getProducts(): Promise<Product[]> {
    const products = await safeFetch('get_products');
    
    if (products) {
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
      return products;
    }

    const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
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
    // محاولة الحفظ على السيرفر أولاً
    const result = await safeFetch('save_order', {
      method: 'POST',
      body: JSON.stringify(order)
    });

    if (result?.status === 'success') {
      return true;
    }

    // إذا فشل الاتصال بالسيرفر، نتحقق من صلاحية المدير محلياً
    const cachedUser = localStorage.getItem(USER_CACHE_KEY);
    const currentUser = cachedUser ? JSON.parse(cachedUser) : null;
    
    if (currentUser?.role === 'admin') {
      console.log("Saving order to offline queue...");
      this.queueOfflineOrder(order);
      return true;
    }

    return false;
  },

  queueOfflineOrder(order: Order) {
    const orders = this.getOfflineOrders();
    // تجنب تكرار الفاتورة إذا تم الضغط مرتين
    if (!orders.some(o => o.id === order.id)) {
      orders.push(order);
      localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
    }
  },

  getOfflineOrders(): Order[] {
    try {
      const orders = localStorage.getItem(OFFLINE_ORDERS_KEY);
      return orders ? JSON.parse(orders) : [];
    } catch { return []; }
  },

  async syncOfflineOrders(): Promise<number> {
    const orders = this.getOfflineOrders();
    if (orders.length === 0) return 0;

    let successCount = 0;
    const remainingOrders: Order[] = [];

    for (const order of orders) {
      try {
        const response = await fetch(`${API_URL}?action=save_order`, {
          method: 'POST',
          body: JSON.stringify(order),
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result?.status === 'success') {
          successCount++;
        } else {
          remainingOrders.push(order);
        }
      } catch {
        remainingOrders.push(order);
      }
    }

    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(remainingOrders));
    return successCount;
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
