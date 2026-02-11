
import { Product, Category, Order } from '../types';

const API_URL = 'api.php';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_veg', name: 'خضروات طازجة' },
  { id: 'cat_fruit', name: 'فواكه موسمية' },
  { id: 'cat_dairy', name: 'ألبان وأجبان' },
  { id: 'cat_bakery', name: 'مخبوزات' }
];

const INITIAL_PRODUCTS: Product[] = [
  // خضروات (6)
  { id: 'v_1', name: 'طماطم بلدي طازجة', description: 'طماطم حمراء طازجة من المزارع مباشرة، مثالية للسلطات والطبخ.', price: 4.5, categoryId: 'cat_veg', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800'], stockQuantity: 100, salesCount: 500, createdAt: Date.now(), seoSettings: { slug: 'fresh-tomatoes', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'v_2', name: 'خيار صبي بيوت', description: 'خيار أخضر مقرمش، غني بالألياف والماء.', price: 3.75, categoryId: 'cat_veg', images: ['https://images.unsplash.com/photo-1449333255014-20e406543e41?w=800'], stockQuantity: 80, salesCount: 450, createdAt: Date.now(), seoSettings: { slug: 'green-cucumber', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'v_3', name: 'بصل أحمر كيس', description: 'بصل أحمر عالي الجودة للطبخ والتخزين.', price: 12, categoryId: 'cat_veg', images: ['https://images.unsplash.com/photo-1508747703725-719777637510?w=800'], stockQuantity: 200, salesCount: 300, createdAt: Date.now(), seoSettings: { slug: 'red-onions', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'v_4', name: 'فلفل رومي ألوان', description: 'فلفل طازج (أحمر، أصفر، أخضر) غني بفيتامين سي.', price: 15, categoryId: 'cat_veg', images: ['https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?w=800'], stockQuantity: 50, salesCount: 120, createdAt: Date.now(), seoSettings: { slug: 'bell-peppers', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  
  // فواكه (6)
  { id: 'f_1', name: 'موز فيليبي كرتون', description: 'موز عالي الجودة، طعم رائع وطاقة فورية.', price: 25, categoryId: 'cat_fruit', images: ['https://images.unsplash.com/photo-1571771894821-ad9958a35c47?w=800'], stockQuantity: 40, salesCount: 600, createdAt: Date.now(), seoSettings: { slug: 'fresh-bananas', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'f_2', name: 'تفاح أحمر إيطالي', description: 'تفاح مقرمش وحلو المذاق، مثالي للوجبات الخفيفة.', price: 9.5, categoryId: 'cat_fruit', images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800'], stockQuantity: 150, salesCount: 380, createdAt: Date.now(), seoSettings: { slug: 'red-apples', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'f_3', name: 'برتقال عصير مصري', description: 'برتقال غني بالعصير، مثالي لعصير الصباح الطازج.', price: 5, categoryId: 'cat_fruit', images: ['https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800'], stockQuantity: 300, salesCount: 800, createdAt: Date.now(), seoSettings: { slug: 'juice-oranges', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  
  // ألبان ومخبوزات
  { id: 'd_1', name: 'حليب كامل الدسم 2 لتر', description: 'حليب طازج طبيعي 100% بدون إضافات.', price: 11, categoryId: 'cat_dairy', images: ['https://images.unsplash.com/photo-1550583724-125581cc25fb?w=800'], stockQuantity: 60, salesCount: 900, createdAt: Date.now(), seoSettings: { slug: 'fresh-milk', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'b_1', name: 'خبز صامولي كيس', description: 'خبز طازج يومياً، هش ولذيذ.', price: 5, categoryId: 'cat_bakery', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'], stockQuantity: 100, salesCount: 1500, createdAt: Date.now(), seoSettings: { slug: 'fresh-bread', metaTitle: '', metaDescription: '', metaKeywords: '' } },
];

const MockDB = {
  get: <T>(key: string, initial: T): T => {
    const data = localStorage.getItem(`fresh_market_db_${key}`);
    if (!data) {
      localStorage.setItem(`fresh_market_db_${key}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },
  set: (key: string, data: any) => {
    localStorage.setItem(`fresh_market_db_${key}`, JSON.stringify(data));
  }
};

let isStaticMode = false;
let apiChecked = false;
let probePromise: Promise<boolean> | null = null;

const probeApi = async (): Promise<boolean> => {
  if (apiChecked) return !isStaticMode;
  if (probePromise) return probePromise;

  probePromise = (async () => {
    try {
      const response = await fetch(`${API_URL}?action=get_categories`, { method: 'HEAD' });
      if (response.status === 404) {
        isStaticMode = true;
      }
    } catch (e) {
      isStaticMode = true;
    }
    apiChecked = true;
    return !isStaticMode;
  })();

  return probePromise;
};

const safeFetch = async (action: string, options?: RequestInit) => {
  const isAvailable = await probeApi();
  if (!isAvailable) return null;

  try {
    const url = `${API_URL}?action=${action}`;
    const response = await fetch(url, {
      ...options,
      headers: { 'Accept': 'application/json', ...options?.headers },
    });
    
    if (response.status === 404) {
      isStaticMode = true;
      return null;
    }

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    isStaticMode = true;
    return null;
  }
};

export const ApiService = {
  async getProducts(): Promise<Product[]> {
    const data = await safeFetch('get_products');
    if (data && Array.isArray(data)) return data;
    return MockDB.get('products', INITIAL_PRODUCTS);
  },

  async getCategories(): Promise<Category[]> {
    const data = await safeFetch('get_categories');
    if (data && Array.isArray(data)) return data;
    return MockDB.get('categories', INITIAL_CATEGORIES);
  },

  async getOrders(): Promise<Order[]> {
    const data = await safeFetch('get_orders');
    if (data && Array.isArray(data)) return data;
    return MockDB.get('orders', []);
  },

  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('add_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    
    if (result?.status === 'success' || isStaticMode) {
      const current = MockDB.get('products', INITIAL_PRODUCTS);
      MockDB.set('products', [product, ...current]);
      return true;
    }
    return false;
  },

  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('update_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    
    if (result?.status === 'success' || isStaticMode) {
      const current = MockDB.get('products', INITIAL_PRODUCTS);
      MockDB.set('products', current.map(p => p.id === product.id ? product : p));
      return true;
    }
    return false;
  },

  async addCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('add_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    
    if (result?.status === 'success' || isStaticMode) {
      const current = MockDB.get('categories', INITIAL_CATEGORIES);
      MockDB.set('categories', [...current, category]);
      return true;
    }
    return false;
  },

  async updateCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('update_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    
    if (result?.status === 'success' || isStaticMode) {
      const current = MockDB.get('categories', INITIAL_CATEGORIES);
      MockDB.set('categories', current.map(c => c.id === category.id ? category : c));
      return true;
    }
    return false;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_category&id=${id}`, { method: 'DELETE' });
    if (result?.status === 'success' || isStaticMode) {
      const current = MockDB.get('categories', INITIAL_CATEGORIES);
      MockDB.set('categories', current.filter(c => c.id !== id));
      return true;
    }
    return false;
  },

  async saveOrder(order: Order): Promise<void> {
    const result = await safeFetch('save_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    if (result?.status === 'success' || isStaticMode) {
      const current = MockDB.get('orders', []);
      MockDB.set('orders', [order, ...current]);
    }
  },

  async updateOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('update_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    if (result?.status === 'success' || isStaticMode) {
      const current = MockDB.get('orders', []);
      MockDB.set('orders', current.map(o => o.id === order.id ? order : o));
      return true;
    }
    return false;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_product&id=${id}`, { method: 'DELETE' });
    if (result?.status === 'success' || isStaticMode) {
      const current = MockDB.get('products', INITIAL_PRODUCTS);
      MockDB.set('products', current.filter(p => p.id !== id));
      return true;
    }
    return false;
  }
};
