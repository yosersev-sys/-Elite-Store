
import { Product, Category, Order, User, Supplier } from '../types.ts';

const API_URL = 'api.php';
const USER_CACHE_KEY = 'souq_user_profile';

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, {
      ...options,
      headers: { 'Accept': 'application/json', ...options?.headers },
    });
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      if (!response.ok) {
        console.error(`API Error (${action}): Status ${response.status}`);
        return null;
      }
      throw new Error('Invalid JSON response');
    }

    if (!response.ok) {
      console.error(`Server reported error for ${action}:`, data?.message || 'Unknown Server Error');
      return data; // نرجعه كما هو ليتمكن المستدعي من فحص الحقل status
    }
    
    return data;
  } catch (error) {
    console.error(`Critical Fetch Error (${action}):`, error);
    return null;
  }
};

export const ApiService = {
  async getCurrentUser(): Promise<User | null> {
    const data = await safeFetch('get_current_user');
    if (data && !data.error && data.id) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
      return data;
    }
    return null;
  },

  async generateSitemap(): Promise<boolean> {
    const result = await safeFetch('generate_sitemap');
    return result?.status === 'success';
  },

  async getAdminPhone(): Promise<{phone: string} | null> {
    const data = await safeFetch('get_admin_phone');
    return (data && !data.error) ? data : null;
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

  async getProducts(): Promise<Product[]> {
    const data = await safeFetch('get_products');
    return Array.isArray(data) ? data : [];
  },

  async getAllImages(): Promise<{url: string, productName: string}[]> {
    const data = await safeFetch('get_all_images');
    return Array.isArray(data) ? data : [];
  },

  async getCategories(): Promise<Category[]> {
    const data = await safeFetch('get_categories');
    return Array.isArray(data) ? data : [];
  },

  async getOrders(): Promise<Order[]> {
    const data = await safeFetch('get_orders');
    return Array.isArray(data) ? data : [];
  },

  async getUsers(): Promise<User[]> {
    const data = await safeFetch('get_users');
    return Array.isArray(data) ? data : [];
  },

  async getSuppliers(): Promise<Supplier[]> {
    const data = await safeFetch('get_suppliers');
    return Array.isArray(data) ? data : [];
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
    const data = await safeFetch('get_store_settings');
    return data || {};
  },

  async updateStoreSettings(settings: Record<string, string>): Promise<boolean> {
    const result = await safeFetch('update_store_settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    return result?.status === 'success';
  }
};
