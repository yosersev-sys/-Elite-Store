
export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'user' | 'admin' | 'cashier';
  createdAt: number;
  balance?: number;
  permissions?: string[];
}

export interface CustomerLedgerEntry {
  id: number;
  userId: string;
  orderId?: string;
  type: 'SALE_ON_CREDIT' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  paymentMethod?: string;
  shiftId?: number;
  notes?: string;
  createdAt: number;
  createdById: string;
  createdByName?: string;
}

export interface SupplierPayment {
  amount: number;
  date: number;
  notes?: string;
  paymentSource?: 'drawer' | 'external';
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  companyName?: string;
  address?: string;
  notes?: string;
  type: 'wholesale' | 'factory' | 'farm' | 'importer';
  balance: number; // المبلغ المستحق له
  rating: number; // من 1 إلى 5
  status: 'active' | 'inactive';
  paymentHistory?: SupplierPayment[]; // سجل المدفوعات
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
  supplierId?: string; // ربط الشحنة بالمورد
}

export interface ProductUnit {
  id: string;
  productId: string;
  unitName: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  conversionFactor: number;
  isDefault: number;
  isActive: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; 
  wholesalePrice: number; 
  categoryId: string;
  supplierId?: string; // المورد المرتبط (اختياري)
  images: string[];
  sizes?: string[]; 
  colors?: string[]; 
  stockQuantity: number;
  unit: string;
  barcode?: string;
  createdAt: number;
  salesCount?: number;
  seoSettings?: SeoSettings;
  batches?: StockBatch[]; 
  reorderLevel?: number;
  units?: ProductUnit[];
  baseUnit?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  actualWholesalePrice?: number; 
  discountType?: 'fixed' | 'percent';
  discountValue?: number;
  selectedUnitId?: string;
  selectedUnitName?: string;
  conversionFactor?: number;
  salePrice?: number;
  purchasePrice?: number;
}

export interface Payment {
  method: string;
  amount: number;
  reference?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'digital';
  icon?: string;
  isSystem: number;
  isActive: number;
  sortOrder: number;
  createdAt: number;
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
  shiftId?: number;
  confirmedAt?: number;
  confirmedBy?: string;
  confirmedShiftId?: number;
  paymentStatus?: 'unpaid' | 'partially_paid' | 'paid';
  discount?: number;
  discountType?: 'fixed' | 'percent';
  discountValue?: number;
  deliveryFee?: number;
  totalItemDiscounts?: number;
  subtotalBeforeDiscount?: number;
  finalTotal?: number;
  discountsMetadata?: string;
  outstandingAmount?: number;
  payments?: Payment[];
  isOffline?: boolean;
  localUuid?: string;
  syncStatus?: 'pending' | 'syncing' | 'failed' | 'conflict' | 'synced';
  syncError?: string;
  lastSyncAttempt?: number;
}

export interface Shift {
  id: number;
  openedById?: string;
  closedById?: string;
  status: 'open' | 'closed';
  startTime: number;
  endTime?: number;
  startingCash: number;
  expectedCash?: number;
  actualCash?: number;
  currentCashBalance: number;
  difference?: number;
  discrepancyReason?: string;
  notes?: string;
  snapshotData?: string; // serialized JSON
  openedByName?: string;
  closedByName?: string;
  shiftName: string;
  totalDeposits?: number;
  totalWithdrawals?: number;
  ledgerCashPayments?: number;
  cashSales?: number;
  cardSales?: number;
  debtSales?: number;
  cashReturns?: number;
  shiftExpenses?: number;
  orderCount?: number;
  avgOrderValue?: number;
  returnCount?: number;
  servedCustomersCount?: number;
}

export interface DrawerTransaction {
  id: number;
  shiftId: number;
  type: 'deposit' | 'withdrawal' | 'withdrawal_refund';
  amount: number;
  reason: string;
  createdAt: number;
  userId: string;
  category?: 'purchase' | 'expense' | 'deposit' | 'refund' | 'general';
  balanceAfter?: number;
  userName?: string;
  shiftName?: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  paymentSource: 'drawer' | 'external';
  referenceNumber?: string;
  attachment?: string;
  status: 'active' | 'cancelled';
  shiftId?: number;
  drawerTransactionId?: number;
  userId: string;
  notes?: string;
  date: number;
}

export type View = 'store' | 'admin' | 'admincp' | 'cart' | 'product-details' | 'admin-form' | 'admin-invoice' | 'auth' | 'checkout' | 'wishlist' | 'order-success' | 'category-page' | 'admin-auth' | 'my-orders' | 'profile' | 'quick-invoice' | 'delivery-areas';

