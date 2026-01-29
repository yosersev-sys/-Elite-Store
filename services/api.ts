
import { Product, Category, Order } from '../types';

const API_URL = 'api.php';

// بيانات أولية شاملة (Seed Data) لضمان مظهر احترافي للمتجر (24 منتجاً)
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_electronics', name: 'إلكترونيات' },
  { id: 'cat_fashion', name: 'أزياء' },
  { id: 'cat_home', name: 'منزل ومطبخ' },
  { id: 'cat_beauty', name: 'جمال وعناية' }
];

const INITIAL_PRODUCTS: Product[] = [
  // إلكترونيات (6)
  { id: 'el_1', name: 'آيفون 15 برو ماكس', description: 'تيتانيوم طبيعي مع شريحة A17 Pro. أقوى أداء ومعالج للألعاب.', price: 5299, categoryId: 'cat_electronics', images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800'], stockQuantity: 15, salesCount: 120, createdAt: Date.now(), seoSettings: { slug: 'iphone-15-pro-max', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'el_2', name: 'سامسونج S24 الترا', description: 'هاتف الذكاء الاصطناعي المتطور بكاميرا 200 ميجابكسل وشاشة تختفي فيها الانعكاسات.', price: 4899, categoryId: 'cat_electronics', images: ['https://images.unsplash.com/photo-1707230102120-d66763a8da31?w=800'], stockQuantity: 10, salesCount: 95, createdAt: Date.now(), seoSettings: { slug: 'samsung-s24-ultra', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'el_3', name: 'ماك بوك برو M3', description: 'أقوى لابتوب للمحترفين مع شاشة ريتنا XDR مذهلة وبطارية تدوم طويلاً.', price: 7499, categoryId: 'cat_electronics', images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'], stockQuantity: 5, salesCount: 30, createdAt: Date.now(), seoSettings: { slug: 'macbook-pro-m3', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'el_4', name: 'سماعات سوني XM5', description: 'رائدة عزل الضجيج في العالم بجودة صوت استثنائية وتصميم مريح.', price: 1299, categoryId: 'cat_electronics', images: ['https://images.unsplash.com/photo-1670057037124-710892a0966a?w=800'], stockQuantity: 20, salesCount: 210, createdAt: Date.now(), seoSettings: { slug: 'sony-xm5', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'el_5', name: 'آيباد برو 12.9 إنش', description: 'شاشة ميني ليد مذهلة مع معالج M2 للأعمال الإبداعية الثقيلة.', price: 4599, categoryId: 'cat_electronics', images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'], stockQuantity: 8, salesCount: 55, createdAt: Date.now(), seoSettings: { slug: 'ipad-pro-12-9', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'el_6', name: 'ساعة آبل الترا 2', description: 'الساعة الأكثر صلابة وقدرة، مصممة للمغامرات والرياضات الشاقة.', price: 3200, categoryId: 'cat_electronics', images: ['https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=800'], stockQuantity: 12, salesCount: 88, createdAt: Date.now(), seoSettings: { slug: 'apple-watch-ultra-2', metaTitle: '', metaDescription: '', metaKeywords: '' } },

  // أزياء (6)
  { id: 'fa_1', name: 'حذاء نايكي إير جوردن', description: 'أيقونة الموضة الرياضية بتصميم كلاسيكي عصري وألوان جذابة.', price: 850, categoryId: 'cat_fashion', images: ['https://images.unsplash.com/photo-1584906332183-f25c04879612?w=800'], stockQuantity: 25, salesCount: 400, createdAt: Date.now(), seoSettings: { slug: 'nike-air-jordan', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'fa_2', name: 'هودي أديداس أوريجينالز', description: 'راحة تامة وأناقة يومية مع خامات قطنية فاخرة وشعار أيقوني.', price: 290, categoryId: 'cat_fashion', images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'], stockQuantity: 30, salesCount: 240, createdAt: Date.now(), seoSettings: { slug: 'adidas-hoodie', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'fa_3', name: 'نظارة ريبان كلاسيك', description: 'حماية كاملة من الشمس مع تصميم لا يتقادم بمرور الزمن.', price: 650, categoryId: 'cat_fashion', images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800'], stockQuantity: 15, salesCount: 180, createdAt: Date.now(), seoSettings: { slug: 'rayban-aviator', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'fa_4', name: 'حقيبة ظهر فيراري', description: 'أناقة رياضية مستوحاة من سباقات السيارات مع مساحات واسعة.', price: 420, categoryId: 'cat_fashion', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'], stockQuantity: 10, salesCount: 45, createdAt: Date.now(), seoSettings: { slug: 'ferrari-backpack', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'fa_5', name: 'جاكيت جينز ليفايز', description: 'الجاكيت الكلاسيكي الأصلي الذي يدوم للأبد ويزداد جمالاً مع الوقت.', price: 450, categoryId: 'cat_fashion', images: ['https://images.unsplash.com/photo-1576995853123-5a103055b19c?w=800'], stockQuantity: 18, salesCount: 110, createdAt: Date.now(), seoSettings: { slug: 'levis-denim-jacket', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'fa_6', name: 'ساعة يد كاسيو جي شوك', description: 'متانة لا تضاهى مع مقاومة كاملة للصدمات والمياه.', price: 380, categoryId: 'cat_fashion', images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800'], stockQuantity: 22, salesCount: 300, createdAt: Date.now(), seoSettings: { slug: 'casio-g-shock', metaTitle: '', metaDescription: '', metaKeywords: '' } },

  // منزل (6)
  { id: 'ho_1', name: 'ماكينة قهوة نسبريسو', description: 'استمتع بقهوتك الصباحية بجودة احترافية وسهولة تامة في منزلك.', price: 899, categoryId: 'cat_home', images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800'], stockQuantity: 12, salesCount: 350, createdAt: Date.now(), seoSettings: { slug: 'nespresso-machine', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'ho_2', name: 'مكنسة دايسون V15', description: 'أقوى مكنسة لاسلكية ذكية بليزر كشف الغبار الدقيق وغير المرئي.', price: 2800, categoryId: 'cat_home', images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800'], stockQuantity: 7, salesCount: 60, createdAt: Date.now(), seoSettings: { slug: 'dyson-v15', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'ho_3', name: 'مجموعة أواني طبخ جرانيت', description: 'مجموعة متكاملة غير لاصقة لطهي صحي وسهل التنظيف.', price: 450, categoryId: 'cat_home', images: ['https://images.unsplash.com/photo-1584946197175-f886817c867a?w=800'], stockQuantity: 20, salesCount: 140, createdAt: Date.now(), seoSettings: { slug: 'granite-cookware', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'ho_4', name: 'مصباح ذكي ملون', description: 'تحكم في إضاءة منزلك عبر هاتفك مع ملايين الألوان المتاحة.', price: 120, categoryId: 'cat_home', images: ['https://images.unsplash.com/photo-1550985616-10810253b84d?w=800'], stockQuantity: 50, salesCount: 600, createdAt: Date.now(), seoSettings: { slug: 'smart-bulb', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'ho_5', name: 'جهاز تنقية الهواء شاومي', description: 'هواء نقي وصحي لمنزلك يتخلص من 99% من الملوثات والروائح.', price: 650, categoryId: 'cat_home', images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'], stockQuantity: 15, salesCount: 90, createdAt: Date.now(), seoSettings: { slug: 'xiaomi-air-purifier', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'ho_6', name: 'عجانة كيتشن إيد', description: 'الأداة المفضلة لكل خباز محترف بجودة تصنيع استثنائية.', price: 2450, categoryId: 'cat_home', images: ['https://images.unsplash.com/photo-1594385208974-2e75f9d8ad48?w=800'], stockQuantity: 5, salesCount: 35, createdAt: Date.now(), seoSettings: { slug: 'kitchen-aid-mixer', metaTitle: '', metaDescription: '', metaKeywords: '' } },

  // جمال (6)
  { id: 'be_1', name: 'عطر بلو دو شانيل', description: 'عطر الفخامة والجاذبية، الخيار الأول للرجل العصري والأنيق.', price: 620, categoryId: 'cat_beauty', images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800'], stockQuantity: 30, salesCount: 1200, createdAt: Date.now(), seoSettings: { slug: 'bleu-de-chanel', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'be_2', name: 'مصفف شعر دايسون', description: 'تصفيف احترافي بدون حرارة زائدة للحفاظ على صحة ولمعان الشعر.', price: 2350, categoryId: 'cat_beauty', images: ['https://images.unsplash.com/photo-1652438318617-660993557e93?w=800'], stockQuantity: 4, salesCount: 85, createdAt: Date.now(), seoSettings: { slug: 'dyson-airwrap', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'be_3', name: 'مجموعة العناية بالبشرة', description: 'روتين متكامل لنضارة البشرة وترطيبها بعمق طوال اليوم.', price: 280, categoryId: 'cat_beauty', images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800'], stockQuantity: 40, salesCount: 520, createdAt: Date.now(), seoSettings: { slug: 'skin-care-set', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'be_4', name: 'عطر ديور سوفاج', description: 'الروح البرية في عطر أيقوني يجسد الحرية والرجولة.', price: 580, categoryId: 'cat_beauty', images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'], stockQuantity: 25, salesCount: 950, createdAt: Date.now(), seoSettings: { slug: 'dior-sauvage', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'be_5', name: 'سيروم فيتامين سي', description: 'لإشراقة فورية وتوحيد لون البشرة ومحاربة آثار التعب.', price: 150, categoryId: 'cat_beauty', images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'], stockQuantity: 60, salesCount: 410, createdAt: Date.now(), seoSettings: { slug: 'vitamin-c-serum', metaTitle: '', metaDescription: '', metaKeywords: '' } },
  { id: 'be_6', name: 'ماكينة حلاقة فيليبس 9000', description: 'أدق حلاقة ممكنة مع تقنية استشعار كثافة اللحية.', price: 950, categoryId: 'cat_beauty', images: ['https://images.unsplash.com/photo-1621607512214-68297480165e?w=800'], stockQuantity: 14, salesCount: 130, createdAt: Date.now(), seoSettings: { slug: 'philips-shaver-9000', metaTitle: '', metaDescription: '', metaKeywords: '' } },
];

const MockDB = {
  get: <T>(key: string, initial: T): T => {
    const data = localStorage.getItem(`elite_local_db_${key}`);
    if (!data) {
      localStorage.setItem(`elite_local_db_${key}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },
  set: (key: string, data: any) => {
    localStorage.setItem(`elite_local_db_${key}`, JSON.stringify(data));
  }
};

let isStaticMode = false;
let apiChecked = false;
let probePromise: Promise<boolean> | null = null;

// نظام الجس الموحد (Singleton Probe) لمنع تكرار طلبات الفشل 404 في الكونسول
const probeApi = async (): Promise<boolean> => {
  if (apiChecked) return !isStaticMode;
  if (probePromise) return probePromise;

  probePromise = (async () => {
    try {
      // محاولة التحقق من السيرفر بصمت تام باستخدام HEAD
      const response = await fetch(`${API_URL}?action=get_categories`, { method: 'HEAD' });
      if (response.status === 404) {
        isStaticMode = true;
      }
    } catch (e) {
      isStaticMode = true;
    }
    apiChecked = true;
    if (isStaticMode) {
      console.log("%c[Elite Store] السيرفر غير متوفر. تم التبديل تلقائياً لوضع المحاكاة المحلي (Static Mode).", "color: #4f46e5; font-weight: bold;");
    }
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
