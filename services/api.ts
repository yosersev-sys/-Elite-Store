import { Product, Category, Order } from '../types';

/**
 * دالة ذكية لحساب المسار النسبي لملف api.php
 * تعتمد على معرفة "عمق" المسار الحالي بالنسبة لجذر التطبيق
 */
const getDynamicApiUrl = () => {
  const reactSegments = ['product', 'category', 'admin', 'cart', 'wishlist', 'checkout', 'auth', 'order-success'];
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  // البحث عن أول جزء في المسار ينتمي لـ React Router لتحديد العمق
  let depth = 0;
  for (let i = 0; i < segments.length; i++) {
    if (reactSegments.includes(segments[i])) {
      depth = segments.length - i;
      break;
    }
  }

  // إذا لم نكن في مسار خاص بـ React، نعتبر أننا في الجذر
  if (depth === 0) return 'api.php';
  
  // بناء المسار النسبي للرجوع للخلف (../) بقدر العمق المكتشف
  return '../'.repeat(depth) + 'api.php';
};

const safeFetch = async (url: string, options?: RequestInit) => {
  // تحديث المسار في كل طلب لضمان صحته إذا تغير مسار الصفحة
  const dynamicUrl = getDynamicApiUrl() + (url.includes('?') ? url.substring(url.indexOf('?')) : '');
  
  try {
    const response = await fetch(dynamicUrl, options);
    
    if (!response.ok) {
      console.error(`Fetch error: ${response.status} at ${dynamicUrl}`);
      return null;
    }

    const text = await response.text();
    const trimmed = text.trim();

    if (trimmed.toLowerCase().startsWith('<!doctype') || trimmed.toLowerCase().startsWith('<html')) {
      console.error('API Error: Server returned HTML instead of JSON. Check if api.php exists. URL:', dynamicUrl);
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.error('API Error: Failed to parse JSON. URL:', dynamicUrl);
      return null;
    }
  } catch (e) {
    console.error('Network Error:', e);
    return null;
  }
};

export const ApiService = {
  async getProducts(): Promise<Product[]> {
    const data = await safeFetch(`?action=get_products`);
    return Array.isArray(data) ? data : [];
  },

  async addProduct(product: Product): Promise<boolean> {
    const data = await safeFetch(`?action=add_product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return data?.status === 'success';
  },

  async updateProduct(updatedProduct: Product): Promise<boolean> {
    const data = await safeFetch(`?action=update_product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    });
    return data?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const data = await safeFetch(`?action=delete_product&id=${id}`, {
      method: 'DELETE'
    });
    return data?.status === 'success';
  },

  async getCategories(): Promise<Category[]> {
    const data = await safeFetch(`?action=get_categories`);
    return Array.isArray(data) ? data : [];
  },

  async addCategory(category: Category): Promise<void> {
    await safeFetch(`?action=add_category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await safeFetch(`?action=delete_category&id=${id}`, {
      method: 'DELETE'
    });
  },

  async getOrders(): Promise<Order[]> {
    const data = await safeFetch(`?action=get_orders`);
    return Array.isArray(data) ? data : [];
  },

  async saveOrder(order: Order): Promise<void> {
    await safeFetch(`?action=save_order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  }
};