import { Product, Category, Order } from '../types';

// نستخدم مساراً نسبياً يبدأ بـ / لضمان البحث من جذر الموقع
const API_URL = './api.php';

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`Fetch Error: ${response.status} for action: ${action}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text) return null;

    try {
      const data = JSON.parse(text);
      if (data && data.status === 'error') {
        console.error("Server API Error:", data.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error("Malformed JSON response from api.php:", text);
      return null;
    }
  } catch (error) {
    console.error(`Connection Error (${action}):`, error);
    return null;
  }
};

export const ApiService = {
  // المنتجات
  async getProducts(): Promise<Product[]> {
    const data = await safeFetch('get_products');
    return Array.isArray(data) ? data : [];
  },

  async addProduct(product: Product): Promise<boolean> {
    const data = await safeFetch('add_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return data?.status === 'success';
  },

  async updateProduct(product: Product): Promise<boolean> {
    const data = await safeFetch('update_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return data?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const data = await safeFetch(`delete_product&id=${id}`, {
      method: 'DELETE'
    });
    return data?.status === 'success';
  },

  // التصنيفات
  async getCategories(): Promise<Category[]> {
    const data = await safeFetch('get_categories');
    return Array.isArray(data) ? data : [];
  },

  async addCategory(category: Category): Promise<void> {
    await safeFetch('add_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await safeFetch(`delete_category&id=${id}`, {
      method: 'DELETE'
    });
  },

  // الطلبات
  async getOrders(): Promise<Order[]> {
    const data = await safeFetch('get_orders');
    return Array.isArray(data) ? data : [];
  },

  async saveOrder(order: Order): Promise<void> {
    await safeFetch('save_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  }
};
