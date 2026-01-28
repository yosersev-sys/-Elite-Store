import { Product, Category, Order } from '../types';

const API_URL = 'api.php';

// بيانات افتراضية قوية لضمان ظهور الموقع حتى في حال فشل الـ API
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'إلكترونيات' },
  { id: 'cat_2', name: 'أزياء' },
  { id: 'cat_3', name: 'منزل ومطبخ' },
  { id: 'cat_4', name: 'جمال وعناية' },
  { id: 'cat_5', name: 'اكسسوارات' }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p_1',
    name: 'ساعة ذكية الترا برو',
    description: 'أحدث إصدار من الساعات الذكية مع شاشة AMOLED وبطارية تدوم طويلاً وتتبع ذكي للصحة.',
    price: 499,
    categoryId: 'cat_1',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'],
    stockQuantity: 15,
    createdAt: Date.now(),
    salesCount: 120
  },
  {
    id: 'p_2',
    name: 'سماعات بلوتوث عازلة',
    description: 'صوت نقي عالي الجودة مع خاصية عزل الضوضاء النشطة وتصميم مريح للأذن.',
    price: 250,
    categoryId: 'cat_1',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600'],
    stockQuantity: 20,
    createdAt: Date.now(),
    salesCount: 85
  }
];

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, options);
    
    if (response.status === 404) {
      console.warn(`[ApiService] API endpoint not found (404): ${url}. Switching to Local Mode.`);
      return { _fallback: true };
    }

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.warn(`[ApiService] Connection error for ${action}: Using Local Fallback.`);
    return { _fallback: true };
  }
};

export const ApiService = {
  async getProducts(): Promise<Product[]> {
    const data = await safeFetch('get_products');
    if (data?._fallback) {
      const stored = localStorage.getItem('elite_db_products');
      return stored ? JSON.parse(stored) : DEFAULT_PRODUCTS;
    }
    return Array.isArray(data) ? data : [];
  },

  async getCategories(): Promise<Category[]> {
    const data = await safeFetch('get_categories');
    if (data?._fallback) {
      const stored = localStorage.getItem('elite_db_categories');
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    }
    return Array.isArray(data) ? data : [];
  },

  async getOrders(): Promise<Order[]> {
    const data = await safeFetch('get_orders');
    if (data?._fallback) {
      const stored = localStorage.getItem('elite_db_orders');
      return stored ? JSON.parse(stored) : [];
    }
    return Array.isArray(data) ? data : [];
  },

  async addProduct(product: Product): Promise<boolean> {
    const data = await safeFetch('add_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (data?._fallback) {
      const products = await this.getProducts();
      localStorage.setItem('elite_db_products', JSON.stringify([product, ...products]));
      return true;
    }
    return data?.status === 'success';
  },

  async saveOrder(order: Order): Promise<void> {
    const data = await safeFetch('save_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (data?._fallback) {
      const orders = await this.getOrders();
      localStorage.setItem('elite_db_orders', JSON.stringify([order, ...orders]));
    }
  },

  async updateProduct(product: Product): Promise<boolean> {
    const data = await safeFetch('update_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (data?._fallback) {
      const prods = await this.getProducts();
      const updated = prods.map(p => p.id === product.id ? product : p);
      localStorage.setItem('elite_db_products', JSON.stringify(updated));
      return true;
    }
    return data?.status === 'success';
  },

  async deleteProduct(id: string): Promise<boolean> {
    const data = await safeFetch(`delete_product&id=${id}`, { method: 'DELETE' });
    if (data?._fallback) {
      const prods = await this.getProducts();
      localStorage.setItem('elite_db_products', JSON.stringify(prods.filter(p => p.id !== id)));
      return true;
    }
    return data?.status === 'success';
  },

  // Fix: Added addCategory method to resolve error in App.tsx on line 237
  async addCategory(category: Category): Promise<boolean> {
    const data = await safeFetch('add_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    if (data?._fallback) {
      const categories = await this.getCategories();
      localStorage.setItem('elite_db_categories', JSON.stringify([...categories, category]));
      return true;
    }
    return data?.status === 'success';
  },

  // Fix: Added deleteCategory method to resolve error in App.tsx on line 241
  async deleteCategory(id: string): Promise<boolean> {
    const data = await safeFetch(`delete_category&id=${id}`, { method: 'DELETE' });
    if (data?._fallback) {
      const cats = await this.getCategories();
      localStorage.setItem('elite_db_categories', JSON.stringify(cats.filter(c => c.id !== id)));
      return true;
    }
    return data?.status === 'success';
  }
};