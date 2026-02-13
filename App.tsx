
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import FloatingCartButton from './components/FloatingCartButton.tsx';
import Notification from './components/Notification.tsx';
import MyOrdersView from './components/MyOrdersView.tsx';
import ProfileView from './components/ProfileView.tsx';
import MobileNav from './components/MobileNav.tsx';
import { ApiService } from './services/api.ts';
import { WhatsAppService } from './services/whatsappService.ts';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const App: React.FC = () => {
  const getInitialView = (): View => {
    const hash = window.location.hash;
    if (hash.includes('admincp')) return 'admin-auth';
    return 'store';
  };

  const [view, setView] = useState<View>(getInitialView());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminPhone, setAdminPhone] = useState('201026034170'); 
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
  
  const prevOrdersCount = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    }
    audioRef.current.play().catch(() => {});
  }, [soundEnabled]);

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

  const loadData = async (isSilent: boolean = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      
      const user = await ApiService.getCurrentUser();
      setCurrentUser(prev => JSON.stringify(prev) !== JSON.stringify(user) ? user : prev);
      
      const adminInfo = await ApiService.getAdminPhone();
      if (adminInfo?.phone) setAdminPhone(adminInfo.phone);

      const fetchedProducts = await ApiService.getProducts();
      setProducts(fetchedProducts || []);
      
      const fetchedCats = await ApiService.getCategories();
      setCategories(fetchedCats || []);
      
      if (user) {
        const fetchedOrders = await ApiService.getOrders();
        const newOrdersList = fetchedOrders || [];
        
        if (user.role === 'admin' && isSilent && newOrdersList.length > prevOrdersCount.current && prevOrdersCount.current > 0) {
          playNotificationSound();
          showNotify('وصل طلب جديد للمتجر! 🛍️', 'success');
        }
        
        setOrders(newOrdersList);
        prevOrdersCount.current = newOrdersList.length;
      }

      if (!isSilent) syncViewWithHash(user);
    } catch (err) {
      console.error("Data loading error:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  useEffect(() => {
    const handleHashChange = () => syncViewWithHash(currentUser);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, syncViewWithHash]);

  useEffect(() => {
    let interval: any;
    if (currentUser?.role === 'admin') {
      interval = setInterval(() => {
        loadData(true); 
      }, 20000);
    }
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.role]);

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
    prevOrdersCount.current = 0;
    showNotify('تم تسجيل الخروج بنجاح');
    onNavigateAction('store');
  };

  const handleUpdateOrderPayment = async (id: string, paymentMethod: string) => {
    const success = await ApiService.updateOrderPayment(id, paymentMethod);
    if (success) {
      showNotify('تم تحديث حالة الدفع بنجاح');
      loadData(true);
    } else {
      showNotify('فشل تحديث حالة الدفع', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-emerald-600 italic">سوق العصر - فاقوس</p>
      </div>
    );
  }

  const isAdminView = view === 'admin' || view === 'admin-auth' || view === 'admin-form' || view === 'admin-invoice';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] pb-24 md:pb-0">
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

      <main className={`flex-grow container mx-auto px-4 ${isAdminView ? 'pt-6 pb-6' : 'pt-24 md:pt-32 pb-6'}`}>
        {view === 'store' && (
          <StoreView 
            products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId}
            onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => { setCart([...cart, {...p, quantity: 1}]); showNotify('تمت الإضافة للسلة'); }} 
            onViewProduct={(p) => { setSelectedProduct(p); onNavigateAction('product-details'); }}
            wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}
        
        {view === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard 
            products={products} categories={categories} orders={orders} currentUser={currentUser}
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
            onViewOrder={(order) => {
              setLastCreatedOrder(order);
              onNavigateAction('order-success');
            }}
            onUpdateOrderPayment={handleUpdateOrderPayment}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onLogout={handleLogout}
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
              const success = await ApiService.saveOrder(order);
              if (success) {
                setLastCreatedOrder(order);
                showNotify('تم إصدار الفاتورة بنجاح');
                WhatsAppService.sendInvoiceToCustomer(order, order.phone);
                await loadData();
                onNavigateAction('order-success');
              } else {
                showNotify('فشل حفظ الفاتورة', 'error');
              }
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
            currentUser={currentUser}
            onBack={() => onNavigateAction('cart')}
            onPlaceOrder={async (details) => {
              const totalAmount = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
              const newOrder: Order = {
                id: 'ORD-' + Date.now().toString().slice(-6),
                customerName: details.fullName,
                phone: details.phone,
                city: details.city,
                address: details.address,
                items: cart,
                total: totalAmount,
                subtotal: totalAmount,
                createdAt: Date.now(),
                status: 'completed',
                paymentMethod: details.paymentMethod || 'عند الاستلام',
                userId: currentUser?.id || null
              };
              
              const success = await ApiService.saveOrder(newOrder);
              if (success) {
                setLastCreatedOrder(newOrder);
                setCart([]);
                showNotify('تم إرسال طلبك بنجاح');
                WhatsAppService.sendOrderNotification(newOrder, adminPhone);
                onNavigateAction('order-success');
                loadData();
              } else {
                showNotify('عذراً، حدث خطأ أثناء إرسال الطلب', 'error');
              }
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

        {view === 'profile' && currentUser && (
          <ProfileView 
            currentUser={currentUser} 
            onSuccess={handleLogout} 
            onBack={() => onNavigateAction('store')} 
          />
        )}

        {view === 'order-success' && lastCreatedOrder && (
          <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('store')} />
        )}
      </main>

      {/* الأزرار العائمة */}
      {!isAdminView && (
        <FloatingCartButton 
          count={cart.length} 
          onClick={() => onNavigateAction('cart')} 
          isVisible={view !== 'cart' && view !== 'checkout'}
        />
      )}

      {currentUser?.role === 'admin' && view !== 'admin' && <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />}

      {!isAdminView && (
        <>
          <MobileNav 
            currentView={view} 
            cartCount={cart.length} 
            onNavigate={onNavigateAction} 
            onCartClick={() => onNavigateAction('cart')}
            isAdmin={currentUser?.role === 'admin'}
          />
          <footer className="hidden md:block bg-slate-900 text-white py-12 text-center">
            <div className="flex flex-col items-center gap-2 mb-4">
              <h2 className="text-xl font-black">سوق العصر</h2>
              <p className="text-emerald-500 text-[10px] font-black uppercase">فاقوس - الشرقية</p>
            </div>
            <p className="text-slate-500 text-[10px] uppercase">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
