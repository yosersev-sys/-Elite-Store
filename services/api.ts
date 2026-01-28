import { Product, Category, Order } from '../types';

/**
 * دالة محسنة لاكتشاف المسار الصحيح لملف api.php
 * تأخذ بعين الاعتبار المجلدات الفرعية ومعرفات بيئات المعاينة
 */
const getDynamicApiUrl = () => {
  const reactSegments = ['product', 'category', 'admin', 'cart', 'wishlist', 'checkout', 'auth', 'order-success'];
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  // تحديد الأجزاء التي تسبق مسارات React
  const physicalSegments = [];
  for (const seg of segments) {
    if (reactSegments.includes(seg)) break;
    physicalSegments.push(seg);
  }
  
  // بناء المسار الفيزيائي (المجلد الذي يحتوي على api.php)
  const baseDir = physicalSegments.length > 0 ? `/${physicalSegments.join('/')}/` : '/';
  
  // دمج المسار مع النطاق الحالي
  const fullUrl = window.location.origin + baseDir + 'api.php';
  
  // تنظيف المائلات المزدوجة الناتجة عن الدمج
  return fullUrl.replace(/([^:]\/)\/+/g, "$1");
};

const BASE_URL = getDynamicApiUrl();

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // إذا حدث خطأ 404، نقوم بطباعة الرابط الذي تم استخدامه بدقة للتشخيص
      console.error(`Fetch error: ${response.status} at ${url}`);
      return null;
    }

    const text = await response.text();
    const trimmed = text.trim();

    // التحقق من نوع الاستجابة
    if (trimmed.toLowerCase().startsWith('<!doctype') || trimmed.toLowerCase().startsWith('<html')) {
      console.error('API Error: Server returned HTML instead of JSON. This usually means api.php is being redirected to index.html.');
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.error('API Error: Failed to parse JSON. Raw response:', trimmed.substring(0, 100));
      return null;
    }
  } catch (e) {
    console.error('Network Error:', e);
    return null;
  }
};

export const ApiService = {
  async getProducts(): Promise<Product[]> {
    const data = await safeFetch(`${BASE_URL}?action=get_products`);
    return Array.isArray(data) ? data : [];
  },

  async addProduct(product: Product): Promise<boolean> {
    const data = await safeFetch(`${BASE_URL}?action=add_product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return data?.status === 'success';
  },

  async updateProduct(updatedProduct: Product): Promise<boolean> {
    const data = await safeFetch(`${BASE_URL}?action=update_product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    });
    return data?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const data = await safeFetch(`${BASE_URL}?action=delete_product&id=${id}`, {
      method: 'DELETE'
    });
    return data?.status === 'success';
  },

  async getCategories(): Promise<Category[]> {
    const data = await safeFetch(`${BASE_URL}?action=get_categories`);
    return Array.isArray(data) ? data : [];
  },

  async addCategory(category: Category): Promise<void> {
    await safeFetch(`${BASE_URL}?action=add_category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await safeFetch(`${BASE_URL}?action=delete_category&id=${id}`, {
      method: 'DELETE'
    });
  },

  async getOrders(): Promise<Order[]> {
    const data = await safeFetch(`${BASE_URL}?action=get_orders`);
    return Array.isArray(data) ? data : [];
  },

  async saveOrder(order: Order): Promise<void> {
    await safeFetch(`${BASE_URL}?action=save_order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  }
};