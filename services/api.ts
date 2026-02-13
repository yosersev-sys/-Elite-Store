
import { Product, Category, Order, User } from '../types.ts';

const API_URL = 'api.php';

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, {
      ...options,
      headers: { 'Accept': 'application/json', ...options?.headers },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Fetch Error:", error);
    return null;
  }
};

export const ApiService = {
  async getCurrentUser(): Promise<User | null> {
    return await safeFetch('get_current_user');
  },

  async login(phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    return await safeFetch('login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
  },

  async register(name: string, phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    return await safeFetch('register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password })
    });
  },

  async logout(): Promise<void> {
    await safeFetch('logout');
  },

  async getProducts(): Promise<Product[]> {
    return await safeFetch('get_products') || [];
  },

  async getCategories(): Promise<Category[]> {
    return await safeFetch('get_categories') || [];
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

  async returnOrder(id: string): Promise<{status: string, message?: string}> {
    return await safeFetch('return_order', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  },

  async updateOrderPayment(id: string, paymentMethod: string): Promise<boolean> {
    const result = await safeFetch('update_order_payment', {
      method: 'POST',
      body: JSON.stringify({ id, paymentMethod })
    });
    return result?.status === 'success';
  },

  // Fix: Add missing addProduct method for handling product creation in Admin
  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('add_product', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  // Fix: Add missing updateProduct method for handling product updates in Admin
  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('update_product', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch('delete_product', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    return result?.status === 'success';
  },

  async addCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('add_category', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    return result?.status === 'success';
  },

  async updateCategory(category: Partial<Category> & { id: string }): Promise<boolean> {
    const result = await safeFetch('update_category', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    return result?.status === 'success';
  },

  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch('delete_category', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    return result?.status === 'success';
  },

  async getAdminPhone(): Promise<{ phone: string } | null> {
    return await safeFetch('get_admin_phone');
  },

  async generateMagicToken(phone: string): Promise<{status: string, token?: string, message?: string}> {
    return await safeFetch('generate_magic_token', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  },

  async loginViaToken(token: string): Promise<{status: string, user?: User, message?: string}> {
    return await safeFetch('login_via_token', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  async updateProfile(data: { name: string, phone: string, password?: string }): Promise<{status: string, message?: string}> {
    return await safeFetch('update_profile', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
