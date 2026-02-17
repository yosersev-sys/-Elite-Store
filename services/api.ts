
import { Product, Category, Order, User, Supplier } from '../types.ts';

const USER_CACHE_KEY = 'souq_user_profile';
const LOCAL_DB_KEY = 'souq_local_database';

// الحالة الافتراضية للبيانات في حال عدم وجود سيرفر
const INITIAL_MOCK_DATA = {
  products: [
    {
      id: 'p1', name: 'طماطم بلدي طازجة', description: 'طماطم حمراء طازجة من مزارع فاقوس.', price: 15, wholesalePrice: 10,
      categoryId: 'cat_veggies', stockQuantity: 50, unit: 'kg', images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=500'],
      createdAt: Date.now(), salesCount: 120, barcode: '622001'
    },
    {
      id: 'p2', name: 'تفاح أحمر إيطالي', description: 'تفاح مقرمش وحلو المذاق.', price: 65, wholesalePrice: 45,
      categoryId: 'cat_fruits', stockQuantity: 30, unit: 'kg', images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?q=80&w=500'],
      createdAt: Date.now(), salesCount: 85, barcode: '622002'
    }
  ],
  categories: [
    { id: 'cat_veggies', name: 'خضروات طازجة', image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?q=80&w=500', isActive: true, sortOrder: 1 },
    { id: 'cat_fruits', name: 'فواكه موسمية', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=500', isActive: true, sortOrder: 2 },
    { id: 'cat_supermarket', name: 'سوبر ماركت', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=500', isActive: true, sortOrder: 3 }
  ],
  orders: [],
  users: [
    { id: 'admin_root', name: 'مدير النظام', phone: '01000000000', role: 'admin', createdAt: Date.now() }
  ],
  suppliers: [],
  settings: {
    delivery_fee: '15',
    whatsapp_number: '201026034170'
  }
};

/**
 * محرك البيانات المحلي (Fallback Engine)
 */
const LocalDB = {
  get() {
    const data = localStorage.getItem(LOCAL_DB_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(INITIAL_MOCK_DATA));
      return INITIAL_MOCK_DATA;
    }
    return JSON.parse(data);
  },
  save(data: any) {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
  }
};

let useMockMode = false;

const safeFetch = async (action: string, options?: RequestInit) => {
  if (useMockMode) return null; // تخطي الشبكة إذا كنا في وضع المحاكاة

  try {
    let apiBase = (window as any).__SOUQ_API_PATH__ || 'api.php';
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    const baseUrl = apiBase.startsWith('/') 
      ? window.location.origin + apiBase
      : window.location.origin + currentDir + apiBase;

    const url = new URL(baseUrl);
    url.searchParams.set('action', action);
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      ...options,
      headers: { 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers 
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`API Network Error (${action}), switching to Local Fallback Mode.`);
    useMockMode = true; // تفعيل وضع المحاكاة لبقية الجلسة
    return null;
  }
};

export const ApiService = {
  async getCurrentUser(): Promise<User | null> {
    const user = await safeFetch('get_current_user');
    if (user && user.id) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      return user;
    }
    if (useMockMode) {
      const saved = localStorage.getItem(USER_CACHE_KEY);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  },

  async login(phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    const result = await safeFetch('login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    if (result?.status === 'success') {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
      return result;
    }
    
    if (useMockMode) {
      const db = LocalDB.get();
      const user = db.users.find((u: any) => u.phone === phone);
      // في وضع المحاكاة نقبل أي كلمة مرور للحسابات الموجودة
      if (user) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
        return { status: 'success', user };
      }
      return { status: 'error', message: 'رقم الهاتف غير مسجل في قاعدة البيانات المحلية' };
    }
    return { status: 'error', message: 'تعذر الاتصال بالسيرفر' };
  },

  // Fix: Added register method to ApiService
  async register(name: string, phone: string, password: string): Promise<{status: string, user?: User, message?: string}> {
    const result = await safeFetch('register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password })
    });
    if (result?.status === 'success') {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
      return result;
    }
    if (useMockMode) {
      const db = LocalDB.get();
      const newUser: User = { id: 'u_' + Date.now(), name, phone, role: 'user', createdAt: Date.now() };
      db.users.push(newUser);
      LocalDB.save(db);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(newUser));
      return { status: 'success', user: newUser };
    }
    return { status: 'error', message: 'تعذر الاتصال بالسيرفر' };
  },

  async getProducts(): Promise<Product[]> {
    const result = await safeFetch('get_products');
    if (result && Array.isArray(result)) return result;
    return LocalDB.get().products;
  },

  async getCategories(): Promise<Category[]> {
    const result = await safeFetch('get_categories');
    if (result && Array.isArray(result)) return result;
    return LocalDB.get().categories;
  },

  // Fix: Added addCategory method
  async addCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('add_category', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    if (result?.status === 'success') return true;
    if (useMockMode) {
      const db = LocalDB.get();
      db.categories.push(category);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  // Fix: Added updateCategory method
  async updateCategory(category: Partial<Category> & { id: string }): Promise<boolean> {
    const result = await safeFetch('update_category', {
      method: 'POST',
      body: JSON.stringify(category)
    });
    if (result?.status === 'success') return true;
    if (useMockMode) {
      const db = LocalDB.get();
      db.categories = db.categories.map((c: any) => c.id === category.id ? { ...c, ...category } : c);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  // Fix: Added deleteCategory method
  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_category&id=${id}`, { method: 'DELETE' });
    if (result?.status === 'success') return true;
    if (useMockMode) {
      const db = LocalDB.get();
      db.categories = db.categories.filter((c: any) => c.id !== id);
      // Fallback: move products to 'general' category if current is deleted
      db.products = db.products.map((p: any) => p.categoryId === id ? { ...p, categoryId: 'cat_general' } : p);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  async getOrders(): Promise<Order[]> {
    const result = await safeFetch('get_orders');
    if (result && Array.isArray(result)) return result;
    return LocalDB.get().orders;
  },

  async saveOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('save_order', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    if (result?.status === 'success') return true;

    if (useMockMode) {
      const db = LocalDB.get();
      db.orders.unshift(order);
      // تحديث الكميات محلياً
      order.items.forEach(item => {
        const p = db.products.find((prod: any) => prod.id === item.id);
        if (p) {
          p.stockQuantity -= item.quantity;
          p.salesCount = (p.salesCount || 0) + item.quantity;
        }
      });
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  async updateOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('update_order', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    if (result?.status === 'success') return true;

    if (useMockMode) {
      const db = LocalDB.get();
      db.orders = db.orders.map((o: any) => o.id === order.id ? order : o);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  // Fix: Added updateOrderPayment method
  async updateOrderPayment(id: string, paymentMethod: string): Promise<boolean> {
    const result = await safeFetch('update_order_payment', {
      method: 'POST',
      body: JSON.stringify({ id, paymentMethod })
    });
    if (result?.status === 'success') return true;
    if (useMockMode) {
      const db = LocalDB.get();
      db.orders = db.orders.map((o: any) => o.id === id ? { ...o, paymentMethod } : o);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  // Fix: Added returnOrder method
  async returnOrder(id: string): Promise<{status: string}> {
    const result = await safeFetch(`return_order&id=${id}`, { method: 'POST' });
    if (result) return result;
    if (useMockMode) {
      const db = LocalDB.get();
      const order = db.orders.find((o: any) => o.id === id);
      if (order) {
        order.status = 'cancelled';
        order.items.forEach((item: any) => {
          const p = db.products.find((prod: any) => prod.id === item.id);
          if (p) {
             p.stockQuantity += item.quantity;
             p.salesCount = Math.max(0, (p.salesCount || 0) - item.quantity);
          }
        });
      }
      LocalDB.save(db);
      return { status: 'success' };
    }
    return { status: 'error' };
  },

  async getStoreSettings(): Promise<Record<string, string>> {
    const result = await safeFetch('get_store_settings');
    if (result) return result;
    return LocalDB.get().settings;
  },

  async updateStoreSettings(settings: Record<string, string>): Promise<boolean> {
    const result = await safeFetch('update_store_settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    if (result?.status === 'success') return true;

    if (useMockMode) {
      const db = LocalDB.get();
      db.settings = { ...db.settings, ...settings };
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('add_product', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    if (result?.status === 'success') return true;

    if (useMockMode) {
      const db = LocalDB.get();
      db.products.unshift(product);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('update_product', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    if (result?.status === 'success') return true;

    if (useMockMode) {
      const db = LocalDB.get();
      db.products = db.products.map((p: any) => p.id === product.id ? product : p);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_product&id=${id}`, { method: 'DELETE' });
    if (result?.status === 'success') return true;

    if (useMockMode) {
      const db = LocalDB.get();
      db.products = db.products.filter((p: any) => p.id !== id);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  // Fix: Added getAllImages method for the library
  async getAllImages(): Promise<{url: string, productName: string}[]> {
    const result = await safeFetch('get_all_images');
    if (result && Array.isArray(result)) return result;
    if (useMockMode) {
      const db = LocalDB.get();
      const images: {url: string, productName: string}[] = [];
      db.products.forEach((p: any) => {
        p.images.forEach((img: string) => {
          images.push({ url: img, productName: p.name });
        });
      });
      return images;
    }
    return [];
  },

  async getAdminPhone(): Promise<{phone: string} | null> {
    const settings = await this.getStoreSettings();
    return { phone: settings.whatsapp_number || '201026034170' };
  },

  async getUsers(): Promise<User[]> {
    const result = await safeFetch('get_users');
    if (result && Array.isArray(result)) return result;
    return LocalDB.get().users;
  },

  // Fix: Added updateProfile method
  async updateProfile(data: any): Promise<{status: string, message?: string}> {
    const result = await safeFetch('update_profile', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (result) return result;
    if (useMockMode) {
      const db = LocalDB.get();
      const cached = localStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        const user = JSON.parse(cached);
        db.users = db.users.map((u: any) => u.id === user.id ? { ...u, ...data } : u);
        LocalDB.save(db);
      }
      return { status: 'success' };
    }
    return { status: 'error', message: 'تعذر الاتصال بالسيرفر' };
  },

  // Fix: Added adminUpdateUser method
  async adminUpdateUser(data: any): Promise<{status: string, message?: string}> {
    const result = await safeFetch('admin_update_user', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (result) return result;
    if (useMockMode) {
      const db = LocalDB.get();
      db.users = db.users.map((u: any) => u.id === data.id ? { ...u, ...data } : u);
      LocalDB.save(db);
      return { status: 'success' };
    }
    return { status: 'error', message: 'تعذر الاتصال بالسيرفر' };
  },

  // Fix: Added deleteUser method
  async deleteUser(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_user&id=${id}`, { method: 'DELETE' });
    if (result?.status === 'success') return true;
    if (useMockMode) {
      const db = LocalDB.get();
      db.users = db.users.filter((u: any) => u.id !== id);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  async getSuppliers(): Promise<Supplier[]> {
    const result = await safeFetch('get_suppliers');
    if (result && Array.isArray(result)) return result;
    return LocalDB.get().suppliers;
  },

  // Fix: Added addSupplier method
  async addSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('add_supplier', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    if (result?.status === 'success') return true;
    if (useMockMode) {
      const db = LocalDB.get();
      db.suppliers.unshift(supplier);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  // Fix: Added updateSupplier method
  async updateSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('update_supplier', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    if (result?.status === 'success') return true;
    if (useMockMode) {
      const db = LocalDB.get();
      db.suppliers = db.suppliers.map((s: any) => s.id === supplier.id ? supplier : s);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  // Fix: Added deleteSupplier method
  async deleteSupplier(id: string): Promise<boolean> {
    const result = await safeFetch(`delete_supplier&id=${id}`, { method: 'DELETE' });
    if (result?.status === 'success') return true;
    if (useMockMode) {
      const db = LocalDB.get();
      db.suppliers = db.suppliers.filter((s: any) => s.id !== id);
      LocalDB.save(db);
      return true;
    }
    return false;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(USER_CACHE_KEY);
    await safeFetch('logout');
  },

  async generateSitemap(): Promise<boolean> {
    const result = await safeFetch('generate_sitemap');
    return result?.status === 'success';
  }
};
