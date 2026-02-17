
import { Product, Category, Order, User, Supplier } from '../types.ts';

const USER_CACHE_KEY = 'souq_user_profile';

const getAbsoluteApiUrl = (action: string): string => {
  const loc = window.location;
  const currentDir = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
  const baseUrl = loc.origin + currentDir + 'api.php';
  const url = new URL(baseUrl);
  url.searchParams.set('action', action);
  url.searchParams.set('_t', Date.now().toString());
  return url.toString();
};

const safeFetch = async (action: string, options?: RequestInit) => {
  try {
    const url = getAbsoluteApiUrl(action);
    const response = await fetch(url, {
      ...options,
      headers: { 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers 
      },
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    if (action.startsWith('get_')) return [];
    return null;
  }
};

export const ApiService = {
  // Authentication & Profile
  
  /**
   * تسجيل الدخول للمستخدم
   */
  // Fixed: Added login method
  async login(phone: string, pass: string): Promise<any> {
    const result = await safeFetch('login', { method: 'POST', body: JSON.stringify({ phone, pass }) });
    if (result?.status === 'success' && result.user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
    }
    return result;
  },

  /**
   * تسجيل مستخدم جديد
   */
  // Fixed: Added register method
  async register(name: string, phone: string, pass: string): Promise<any> {
    const result = await safeFetch('register', { method: 'POST', body: JSON.stringify({ name, phone, pass }) });
    if (result?.status === 'success' && result.user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
    }
    return result;
  },

  async logout(): Promise<void> { await safeFetch('logout'); localStorage.removeItem(USER_CACHE_KEY); },
  
  async getCurrentUser(): Promise<User | null> { return await safeFetch('get_current_user'); },

  /**
   * تحديث بيانات الملف الشخصي
   */
  // Fixed: Added updateProfile method
  async updateProfile(data: any): Promise<any> {
    return await safeFetch('update_profile', { method: 'POST', body: JSON.stringify(data) });
  },

  // Products
  async getProducts(): Promise<Product[]> { return await safeFetch('get_products') || []; },
  
  async addProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('add_product', { method: 'POST', body: JSON.stringify(product) });
    return result?.status === 'success';
  },
  
  async updateProduct(product: Product): Promise<boolean> {
    const result = await safeFetch('update_product', { method: 'POST', body: JSON.stringify(product) });
    return result?.status === 'success';
  },

  /**
   * حذف منتج من المتجر
   */
  // Fixed: Added deleteProduct method
  async deleteProduct(id: string): Promise<boolean> {
    const result = await safeFetch('delete_product', { method: 'POST', body: JSON.stringify({ id }) });
    return result?.status === 'success';
  },

  /**
   * جلب كافة الصور المرفوعة مسبقاً
   */
  // Fixed: Added getAllImages method
  async getAllImages(): Promise<{url: string, productName: string}[]> {
    return await safeFetch('get_all_images') || [];
  },

  // Categories
  async getCategories(): Promise<Category[]> { return await safeFetch('get_categories') || []; },

  /**
   * إضافة قسم جديد
   */
  // Fixed: Added addCategory method
  async addCategory(category: Category): Promise<boolean> {
    const result = await safeFetch('add_category', { method: 'POST', body: JSON.stringify(category) });
    return result?.status === 'success';
  },

  /**
   * تحديث بيانات قسم
   */
  // Fixed: Added updateCategory method
  async updateCategory(category: Partial<Category>): Promise<boolean> {
    const result = await safeFetch('update_category', { method: 'POST', body: JSON.stringify(category) });
    return result?.status === 'success';
  },

  /**
   * حذف قسم
   */
  // Fixed: Added deleteCategory method
  async deleteCategory(id: string): Promise<boolean> {
    const result = await safeFetch('delete_category', { method: 'POST', body: JSON.stringify({ id }) });
    return result?.status === 'success';
  },

  // Orders
  async getOrders(): Promise<Order[]> { return await safeFetch('get_orders') || []; },

  /**
   * حفظ طلب جديد أو فاتورة
   */
  // Fixed: Added saveOrder method
  async saveOrder(order: Order): Promise<boolean> {
    const result = await safeFetch('save_order', { method: 'POST', body: JSON.stringify(order) });
    return result?.status === 'success';
  },

  /**
   * تحديث حالة الدفع للطلب
   */
  // Fixed: Added updateOrderPayment method
  async updateOrderPayment(id: string, paymentMethod: string): Promise<boolean> {
    const result = await safeFetch('update_order_payment', { method: 'POST', body: JSON.stringify({ id, paymentMethod }) });
    return result?.status === 'success';
  },

  /**
   * استرجاع طلب (إلغاء وإعادة الكميات للمخزن)
   */
  // Fixed: Added returnOrder method
  async returnOrder(id: string): Promise<any> {
    return await safeFetch('return_order', { method: 'POST', body: JSON.stringify({ id }) });
  },

  // Users (Admin)
  async getUsers(): Promise<User[]> { return await safeFetch('get_users') || []; },

  /**
   * حذف مستخدم نهائياً
   */
  // Fixed: Added deleteUser method
  async deleteUser(id: string): Promise<boolean> {
    const result = await safeFetch('delete_user', { method: 'POST', body: JSON.stringify({ id }) });
    return result?.status === 'success';
  },

  /**
   * تحديث بيانات عضو من قبل الإدارة
   */
  // Fixed: Added adminUpdateUser method
  async adminUpdateUser(data: any): Promise<any> {
    return await safeFetch('admin_update_user', { method: 'POST', body: JSON.stringify(data) });
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> { return await safeFetch('get_suppliers') || []; },
  
  async addSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('add_supplier', { method: 'POST', body: JSON.stringify(supplier) });
    return result?.status === 'success';
  },
  
  async updateSupplier(supplier: Supplier): Promise<boolean> {
    const result = await safeFetch('update_supplier', { method: 'POST', body: JSON.stringify(supplier) });
    return result?.status === 'success';
  },
  
  async getSupplierPayments(supplierId: string): Promise<any[]> {
    return await safeFetch(`get_supplier_payments&supplierId=${supplierId}`) || [];
  },
  
  async addSupplierPayment(supplierId: string, amount: number): Promise<boolean> {
    const result = await safeFetch('add_supplier_payment', {
      method: 'POST',
      body: JSON.stringify({ id: 'pay_' + Date.now(), supplierId, amount })
    });
    return result?.status === 'success';
  },

  // Store Settings & Tools
  async getStoreSettings(): Promise<Record<string, string>> { return await safeFetch('get_store_settings') || {}; },
  
  /**
   * تحديث إعدادات المتجر العامة
   */
  // Fixed: Added updateStoreSettings method
  async updateStoreSettings(settings: Record<string, string>): Promise<boolean> {
    const result = await safeFetch('update_store_settings', { method: 'POST', body: JSON.stringify(settings) });
    return result?.status === 'success';
  },

  /**
   * جلب رقم جوال الإدارة من السيرفر
   */
  // Fixed: Added getAdminPhone method
  async getAdminPhone(): Promise<{phone: string} | null> { return await safeFetch('get_admin_phone'); },
  
  /**
   * توليد ملف sitemap.xml لمحركات البحث
   */
  // Fixed: Added generateSitemap method
  async generateSitemap(): Promise<boolean> {
    const result = await safeFetch('generate_sitemap', { method: 'POST' });
    return result?.status === 'success';
  },
};
