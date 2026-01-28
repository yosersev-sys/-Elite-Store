
import { Product, Category, Order } from '../types';

// ملاحظة: إذا كان ملف api.php في نفس المجلد، اتركها كما هي. 
// إذا كنت تستعرض الموقع من مكان آخر، يمكنك وضع الرابط الكامل لموقعك هنا.
const API_URL = 'api.php'; 

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[ApiService] Error fetching ${action}:`, error);
    // العودة للبيانات المخزنة محلياً فقط في حال الفشل التام
    const stored = localStorage.getItem(`elite_db_${action}`);
    return stored ? JSON.parse(stored) : null;
  }
};

export const ApiService = {
  async getProducts(): Promise<Product[]> {
    const data = await safeFetch('get_products');
    if (data && Array.isArray(data)) {
      localStorage.setItem('elite_db_get_products', JSON.stringify(data));
      return data;
    }
    return [];
  },

  async getCategories(): Promise<Category[]> {
    const data = await safeFetch('get_categories');
    if (data && Array.isArray(data)) {
      localStorage.setItem('elite_db_get_categories', JSON.stringify(data));
      return data;
    }
    return [];
  },

  async getOrders(): Promise<Order[]> {
    const data = await safeFetch('get_orders');
    if (data && Array.isArray(data)) {
      localStorage.setItem('elite_db_get_orders', JSON.stringify(data));
      return data;
    }
    return [];
  },

  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('add_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  async saveOrder(order: Order): Promise<void> {
    await safeFetch('save_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  },

  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('update_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_product&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async addCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('add_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    return result?.status === 'success';
  },

  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_category&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  }
};
