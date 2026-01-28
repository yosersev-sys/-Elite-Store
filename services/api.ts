import { Product, Category, Order } from '../types';

// حساب مسار الـ API بشكل ديناميكي بناءً على موقع ملف index.html
// يقوم الكود بإزالة مسارات React المعروفة من الرابط الحالي للوصول للمجلد الرئيسي
const getBaseUrl = () => {
  const path = window.location.pathname;
  // إزالة أي مسارات فرعية وهمية خاصة بـ React
  const cleanPath = path.replace(/\/product\/.*|\/category\/.*|\/admin.*|\/cart.*|\/wishlist.*|\/checkout.*|\/auth.*|\/order-success.*/, '');
  // التأكد من أن المسار ينتهي بـ / ثم اسم الملف
  return (cleanPath.endsWith('/') ? cleanPath : cleanPath + '/') + 'api.php';
};

const BASE_URL = getBaseUrl();

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    // التحقق مما إذا كانت الاستجابة صفحة خطأ HTML (غالباً 404 من الخادم)
    if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
      console.error('Server returned HTML instead of JSON. Likely a 404 or 500 error page.');
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON response from server. Body:', text.substring(0, 100));
      return null;
    }
  } catch (e) {
    console.error('Network error during fetch:', e);
    return null;
  }
};

export const ApiService = {
  // المنتجات
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

  // التصنيفات
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

  // الطلبات
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