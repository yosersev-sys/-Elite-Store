
export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: string[];
  sizes?: string[]; 
  colors?: string[]; 
  stockQuantity: number;
  createdAt: number;
  salesCount?: number;
  seoSettings?: SeoSettings;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
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
}

export type View = 'store' | 'admin' | 'cart' | 'product-details' | 'admin-form' | 'auth' | 'checkout' | 'wishlist' | 'order-success' | 'category-page';
