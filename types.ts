
export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface StockBatch {
  id: string;
  quantity: number;
  wholesalePrice: number;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; 
  wholesalePrice: number; // السعر الافتراضي أو لآخر دفعة
  categoryId: string;
  images: string[];
  sizes?: string[]; 
  colors?: string[]; 
  stockQuantity: number;
  unit: 'piece' | 'kg' | 'gram';
  barcode?: string;
  createdAt: number;
  salesCount?: number;
  seoSettings?: SeoSettings;
  batches?: StockBatch[]; // مصفوفة الدفعات الجديدة
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  actualWholesalePrice?: number; // السعر الذي تم الحساب عليه فعلياً عند البيع
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  userId?: string;
}

// إضافة admincp للقائمة
export type View = 'store' | 'admin' | 'admincp' | 'cart' | 'product-details' | 'admin-form' | 'admin-invoice' | 'auth' | 'checkout' | 'wishlist' | 'order-success' | 'category-page' | 'admin-auth' | 'my-orders' | 'profile' | 'quick-invoice';
