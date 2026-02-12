
import { Product, Category, Order } from '../types.ts';

const API_URL = 'api.php';

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, {
      ...options,
      headers: { 'Accept': 'application/json', ...options?.headers },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    return null;
  }
};

export const ApiService = {
  async getProducts(): Promise<Product[]> {
    return await safeFetch('get_products') || [];
  },

  async getCategories(): Promise<Category[]> {
    return await safeFetch('get_categories') || [];
  },

  async getOrders(): Promise<Order[]> {
    return await safeFetch('get_orders') || [];
  },

  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('add_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return result?.status === 'success';
  },

  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('update_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
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

  async updateCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('update_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    return result?.status === 'success';
  },

  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_category&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  },

  async saveOrder(order: Order): Promise<void> {
    await safeFetch('save_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_product&id=${id}`, { method: 'DELETE' });
    return result?.status === 'success';
  }
};
