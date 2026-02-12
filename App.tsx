
import React, { useState, useEffect } from 'react';
import { View, Product, CartItem, Category, Order } from './types.ts';
import Header from './components/Header.tsx';
import StoreView from './components/StoreView.tsx';
import AdminDashboard from './admincp/AdminDashboard.tsx';
import AdminProductForm from './admincp/AdminProductForm.tsx';
import AdminInvoiceForm from './admincp/AdminInvoiceForm.tsx';
import CartView from './components/CartView.tsx';
import ProductDetailsView from './components/ProductDetailsView.tsx';
import CheckoutView from './components/CheckoutView.tsx';
import OrderSuccessView from './components/OrderSuccessView.tsx';
import FloatingAdminButton from './components/FloatingAdminButton.tsx';
import Notification from './components/Notification.tsx';
import { ApiService } from './services/api.ts';

const App: React.FC = () => {
  const [view, setView] = useState<View>('store');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // نظام التنبيهات
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedProducts = await ApiService.getProducts();
      if (fetchedProducts) setProducts(fetchedProducts);

      const fetchedCats = await ApiService.getCategories();
      if (fetchedCats) setCategories(fetchedCats);

      const fetchedOrders = await ApiService.getOrders();
      if (fetchedOrders) setOrders(fetchedOrders);
    } catch (err) {
      console.error("Data loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onNavigateAction = (v: View) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-indigo-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* عرض التنبيه إذا وجد */}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <Header 
        cartCount={cart.length} wishlistCount={wishlist.length} categories={categories}
        onNavigate={onNavigateAction}
        onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); if(view !== 'store') onNavigateAction('store'); }}
      />

      <main className="flex-grow container mx-auto px-4 pt-32 pb-20">
        {view === 'store' && (
          <StoreView 
            products={products} categories={categories} searchQuery={searchQuery} selectedCategoryId={selectedCategoryId}
            onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => { setCart([...cart, {...p, quantity: 1}]); showNotify('تمت الإضافة للسلة'); }} 
            onViewProduct={(p) => { setSelectedProduct(p); onNavigateAction('product-details'); }}
            wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}
        
        {view === 'admin' && (
          <AdminDashboard 
            products={products} categories={categories} orders={orders}
            onOpenAddForm={() => { setSelectedProduct(null); onNavigateAction('admin-form'); }}
            onOpenEditForm={(p) => { setSelectedProduct(p); onNavigateAction('admin-form'); }}
            onOpenInvoiceForm={() => onNavigateAction('admin-invoice')}
            onDeleteProduct={async (id) => { 
                const success = await ApiService.deleteProduct(id); 
                if (success) showNotify('تم حذف المنتج بنجاح', 'success');
                loadData(); 
            }}
            onAddCategory={async (c) => { 
                const success = await ApiService.addCategory(c); 
                if (success) showNotify('تم إضافة القسم بنجاح');
                loadData(); 
            }}
            onUpdateCategory={async (c) => { 
                const success = await ApiService.updateCategory(c); 
                if (success) showNotify('تم تحديث القسم بنجاح');
                loadData(); 
            }}
            onDeleteCategory={async (id) => { 
                const success = await ApiService.deleteCategory(id); 
                if (success) showNotify('تم حذف القسم بنجاح');
                loadData(); 
            }}
          />
        )}

        {view === 'admin-form' && (
          <AdminProductForm 
            product={selectedProduct} categories={categories} 
            onSubmit={async (p) => {
               const isEdit = products.some(prod => prod.id === p.id);
               const success = isEdit ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
               
               if (success) {
                 showNotify('تم حفظ البيانات بنجاح! ✨');
                 await loadData();
                 onNavigateAction('admin');
               } else {
                 showNotify('حدث خطأ أثناء الحفظ', 'error');
               }
            }}
            onCancel={() => onNavigateAction('admin')}
          />
        )}

        {view === 'admin-invoice' && (
          <AdminInvoiceForm 
            products={products}
            onSubmit={async (order) => {
              await ApiService.saveOrder(order);
              setLastCreatedOrder(order);
              showNotify('تم إصدار الفاتورة بنجاح');
              await loadData();
              onNavigateAction('order-success');
            }}
            onCancel={() => onNavigateAction('admin')}
          />
        )}

        {view === 'order-success' && lastCreatedOrder && (
          <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('admin')} />
        )}

        {view === 'cart' && (
          <CartView 
            cart={cart} 
            onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))}
            onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
            onCheckout={() => onNavigateAction('checkout')}
            onContinueShopping={() => onNavigateAction('store')}
          />
        )}

        {view === 'product-details' && selectedProduct && (
          <ProductDetailsView 
            product={selectedProduct}
            categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
            onAddToCart={(p) => { setCart([...cart, {...p, quantity: 1}]); showNotify('تمت الإضافة للسلة'); }}
            onBack={() => onNavigateAction('store')}
            isFavorite={wishlist.includes(selectedProduct.id)}
            onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}

        {view === 'checkout' && (
          <CheckoutView 
            cart={cart}
            onBack={() => onNavigateAction('cart')}
            onPlaceOrder={async (details) => {
              const newOrder: Order = {
                id: 'ORD-' + Date.now().toString().slice(-6),
                ...details,
                items: cart,
                total: cart.reduce((s, i) => s + (i.price * i.quantity), 0),
                subtotal: cart.reduce((s, i) => s + (i.price * i.quantity), 0),
                createdAt: Date.now(),
                status: 'pending'
              };
              await ApiService.saveOrder(newOrder);
              setLastCreatedOrder(newOrder);
              setCart([]);
              showNotify('تم إرسال طلبك بنجاح');
              onNavigateAction('order-success');
            }}
          />
        )}
      </main>

      <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />

      <footer className="bg-slate-900 text-white py-12 text-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg text-white">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <h2 className="text-xl font-black">سوق العصر</h2>
          <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">أكبر سوق إلكتروني في فاقوس</p>
        </div>
        <p className="text-slate-500 text-xs tracking-widest">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

export default App;
