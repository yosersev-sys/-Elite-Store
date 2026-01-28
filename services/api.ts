import { Product, Category, Order } from '../types';

/**
 * دالة للحصول على المسار الأساسي لـ API بشكل مطلق من جذر الموقع
 * لضمان عمل الطلبات من أي صفحة فرعية
 */
const getBaseUrl = () => {
  // استخدام المسار المطلق من الجذر لملف api.php
  return '/api.php';
};

const safeFetch = async (action: string, options?: RequestInit) => {
  const url = `${getBaseUrl()}?action=${action}`;
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`Fetch error: ${response.status} at ${url}`);
      return null;
    }

    const text = await response.text();
    const trimmed = text.trim();

    // التحقق من أن الاستجابة هي JSON وليست صفحة خطأ HTML
    if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
      console.error('API Error: Server returned HTML instead of JSON. Check database connection in api.php');
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.error('API Error: Failed to parse JSON:', trimmed);
      return null;
    }
  } catch (e) {
    console.error('Network Error:', e);
    return null;
  }
};

export const ApiService = {
  getProducts: async (): Promise<Product[]> => {
    const data = await safeFetch('get_products');
    return Array.isArray(data) ? data : [];
  },

  addProduct: async (product: Product): Promise<boolean> => {
    const data = await safeFetch('add_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return data?.status === 'success';
  },

  updateProduct: async (product: Product): Promise<boolean> => {
    const data = await safeFetch('update_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return data?.status === 'success';
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const data = await safeFetch(`delete_product&id=${id}`, {
      method: 'DELETE'
    });
    return data?.status === 'success';
  },

  getCategories: async (): Promise<Category[]> => {
    const data = await safeFetch('get_categories');
    return Array.isArray(data) ? data : [];
  },

  addCategory: async (category: Category): Promise<void> => {
    await safeFetch('add_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
  },

  deleteCategory: async (id: string): Promise<void> => {
    await safeFetch(`delete_category&id=${id}`, {
      method: 'DELETE'
    });
  },

  getOrders: async (): Promise<Order[]> => {
    const data = await safeFetch('get_orders');
    return Array.isArray(data) ? data : [];
  },

  saveOrder: async (order: Order): Promise<void> => {
    await safeFetch('save_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  }
};