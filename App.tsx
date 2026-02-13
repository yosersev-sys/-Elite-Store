
import React, { useState, useEffect, useCallback } from 'react';
import { View, Product, CartItem, Category, Order, User } from './types.ts';
import Header from './components/Header.tsx';
import StoreView from './components/StoreView.tsx';
import AdminDashboard from './admincp/AdminDashboard.tsx';
import AdminProductForm from './admincp/AdminProductForm.tsx';
import AdminInvoiceForm from './admincp/AdminInvoiceForm.tsx';
import CartView from './components/CartView.tsx';
import ProductDetailsView from './components/ProductDetailsView.tsx';
import CheckoutView from './components/CheckoutView.tsx';
import OrderSuccessView from './components/OrderSuccessView.tsx';
import AuthView from './components/AuthView.tsx';
import AdminAuthView from './components/AdminAuthView.tsx';
import FloatingAdminButton from './components/FloatingAdminButton.tsx';
import Notification from './components/Notification.tsx';
import MyOrdersView from './components/MyOrdersView.tsx';
import { ApiService } from './services/api.ts';

const App: React.FC = () => {
  const getInitialView = (): View => {
    const hash = window.location.hash;
    if (hash.includes('admincp')) return 'admin-auth';
    return 'store';
  };

  const [view, setView] = useState<View>(getInitialView());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const syncViewWithHash = useCallback((user: User | null) => {
    const hash = window.location.hash;
    if (hash.includes('admincp')) {
      if (user && user.role === 'admin') {
        setView(prev => (prev === 'admin' || prev === 'admin-form' || prev === 'admin-invoice') ? prev : 'admin');
      } else {
        setView('admin-auth');
      }
    } else {
      setView(prev => (prev === 'admin' || prev === 'admin-auth' || prev === 'admin-form' || prev === 'admin-invoice') ? 'store' : prev);
    }
  }, []);

  const loadData = async () => {
    try {
      const user = await ApiService.getCurrentUser();
      setCurrentUser(user);
      
      const fetchedProducts = await ApiService.getProducts();
      setProducts(fetchedProducts || []);
      
      const fetchedCats = await ApiService.getCategories();
      setCategories(fetchedCats || []);
      
      // جلب الطلبات إذا كان المستخدم مسجل دخول أو كان مديراً
      if (user) {
        const fetchedOrders = await ApiService.getOrders();
        setOrders(fetchedOrders || []);
      }

      syncViewWithHash(user);
    } catch (err) {
      console.error("Data loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
    const handleHashChange = () => syncViewWithHash(currentUser);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, syncViewWithHash]);

  const onNavigateAction = (v: View) => {
    setView(v);
    if (v === 'admin' || v === 'admin-auth' || v === 'admin-form' || v === 'admin-invoice') {
       if (!window.location.hash.includes('admincp')) window.location.hash = '#/admincp';
    } else {
       if (window.location.hash.includes('admincp')) window.history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setCurrentUser(null);
    setOrders([]);
    showNotify('تم تسجيل الخروج بنجاح');
    onNavigateAction('store');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-emerald-600">جاري تحميل سوق العصر...</p>
      </div>
    );
  }

  const isAdminView = view === 'admin' || view === 'admin-auth' || view === 'admin-form' || view === 'admin-invoice';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {view === 'admin-auth' && (!currentUser || currentUser.role !== 'admin') && (
        <AdminAuthView 
          onSuccess={(user) => {
            setCurrentUser(user);
            showNotify('تم الدخول كمدير بنجاح');
            onNavigateAction('admin');
            loadData();
          }}
          onClose={() => onNavigateAction('store')}
        />
      )}

      {showAuthModal && (
        <AuthView 
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => { 
            setCurrentUser(user); 
            showNotify(`أهلاً بك يا ${user.name}`); 
            setShowAuthModal(false);
            loadData();
          }} 
        />
      )}

      {!isAdminView && (
        <Header 
          cartCount={cart.length} 
          wishlistCount={wishlist.length} 
          categories={categories}
          currentUser={currentUser}
          onNavigate={onNavigateAction}
          onLoginClick={() => setShowAuthModal(true)}
          onLogout={handleLogout}
          onSearch={setSearchQuery} 
          onCategorySelect={(id) => { setSelectedCategoryId(id); if(view !== 'store') onNavigateAction('store'); }}
        />
      )}

      <main className={`flex-grow container mx-auto px-4 ${isAdminView ? 'pt-6 pb-6' : 'pt-32 pb-20'}`}>
        {view === 'store' && (
          <StoreView 
            products={products} categories={categories} searchQuery={searchQuery} selectedCategoryId={selectedCategoryId}
            onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => { setCart([...cart, {...p, quantity: 1}]); showNotify('تمت الإضافة للسلة'); }} 
            onViewProduct={(p) => { setSelectedProduct(p); onNavigateAction('product-details'); }}
            wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}
        
        {view === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard 
            products={products} categories={categories} orders={orders}
            onOpenAddForm={() => { setSelectedProduct(null); onNavigateAction('admin-form'); }}
            onOpenEditForm={(p) => { setSelectedProduct(p); onNavigateAction('admin-form'); }}
            onOpenInvoiceForm={() => onNavigateAction('admin-invoice')}
            onDeleteProduct={async (id) => { 
                const success = await ApiService.deleteProduct(id); 
                if (success) { showNotify('تم حذف المنتج بنجاح'); loadData(); }
            }}
            onAddCategory={async (c) => { 
                const success = await ApiService.addCategory(c); 
                if (success) { showNotify('تم إضافة القسم بنجاح'); loadData(); }
            }}
            onUpdateCategory={async (c) => { 
                const success = await ApiService.updateCategory(c); 
                if (success) { showNotify('تم تحديث القسم بنجاح'); loadData(); }
            }}
            onDeleteCategory={async (id) => { 
                const success = await ApiService.deleteCategory(id); 
                if (success) { showNotify('تم حذف القسم بنجاح'); loadData(); }
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
                status: 'completed',
                userId: currentUser?.id || null
              };
              await ApiService.saveOrder(newOrder);
              setLastCreatedOrder(newOrder);
              setCart([]);
              showNotify('تم إرسال طلبك بنجاح');
              onNavigateAction('order-success');
              // تحديث البيانات فوراً لضمان ظهور الطلب في صفحة طلباتي
              loadData();
            }}
          />
        )}

        {view === 'my-orders' && (
          <MyOrdersView 
            orders={orders} 
            onViewDetails={(order) => {
              setLastCreatedOrder(order);
              onNavigateAction('order-success');
            }}
            onBack={() => onNavigateAction('store')}
          />
        )}

        {view === 'order-success' && lastCreatedOrder && (
          <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('store')} />
        )}
      </main>

      {currentUser?.role === 'admin' && <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />}

      {!isAdminView && (
        <footer className="bg-slate-900 text-white py-12 text-center">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-white">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                <path d="M3 9l2.44-4.91A2 2 0 0 1 7.23 3h9.54a2 2 0 0 1 1.79 1.09L21 9" />
                <path d="M9 21V12" />
                <path d="M15 21V12" />
              </svg>
            </div>
            <h2 className="text-xl font-black">سوق العصر</h2>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">فاقوس - الشرقية</p>
          </div>
          <p className="text-slate-500 text-[10px] tracking-widest uppercase">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
        </footer>
      )}
    </div>
  );
};

export default App;
