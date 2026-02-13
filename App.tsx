
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
import FloatingQuickInvoiceButton from './components/FloatingQuickInvoiceButton.tsx';
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

  // فحص روابط Magic Link عند التحميل
  const checkMagicToken = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      const res = await ApiService.loginViaToken(token);
      if (res && res.status === 'success' && res.user) {
        setCurrentUser(res.user);
        showNotify(`تم الدخول بنجاح، أهلاً بك يا ${res.user.name}`);
        // إزالة التوكن من الرابط للتنظيف
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      } else {
        showNotify('رابط الدخول السريع هذا منتهى أو غير صالح', 'error');
      }
    }
    return false;
  };

  const loadData = async (isSilent: boolean = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      
      const loggedViaMagic = await checkMagicToken();
      let user = null;
      if (!loggedViaMagic) {
        user = await ApiService.getCurrentUser();
        setCurrentUser(prev => JSON.stringify(prev) !== JSON.stringify(user) ? user : prev);
      } else {
        user = await ApiService.getCurrentUser(); // تحديث الحالة النهائية
      }
      
      const adminInfo = await ApiService.getAdminPhone();
      if (adminInfo?.phone) setAdminPhone(adminInfo.phone);

      const fetchedProducts = await ApiService.getProducts();
      setProducts(fetchedProducts || []);
      
      const fetchedCats = await ApiService.getCategories();
      setCategories(fetchedCats || []);
      
      if (user || loggedViaMagic) {
        const fetchedOrders = await ApiService.getOrders();
        setOrders(fetchedOrders || []);
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

  // ... (بقية الكود المعتاد لـ App.tsx)
  useEffect(() => {
    const handleHashChange = () => syncViewWithHash(currentUser);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, syncViewWithHash]);

  const onNavigateAction = (v: View) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) {
      setShowAuthModal(true); return;
    }
    setView(v);
    if (v.includes('admin')) { if (!window.location.hash.includes('admincp')) window.location.hash = '#/admincp'; }
    else { if (window.location.hash.includes('admincp')) window.history.pushState("", document.title, window.location.pathname + window.location.search); }
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
        <p className="font-black text-emerald-600 italic">سوق العصر - فاقوس</p>
      </div>
    );
  }

  const isAdminView = view.includes('admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] pb-20 md:pb-0">
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      
      {view === 'admin-auth' && (!currentUser || currentUser.role !== 'admin') && (
        <AdminAuthView onSuccess={(u) => { setCurrentUser(u); onNavigateAction('admin'); loadData(); }} onClose={() => onNavigateAction('store')} />
      )}

      {showAuthModal && (
        <AuthView onClose={() => setShowAuthModal(false)} onSuccess={(u) => { setCurrentUser(u); setShowAuthModal(false); loadData(); }} />
      )}

      {!isAdminView && (
        <Header cartCount={cart.length} wishlistCount={wishlist.length} categories={categories} currentUser={currentUser} onNavigate={onNavigateAction} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout} onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); if(view !== 'store') onNavigateAction('store'); }} />
      )}

      <main className={`flex-grow container mx-auto px-2 md:px-4 ${isAdminView ? 'pt-4 pb-4' : 'pt-16 md:pt-32 pb-4'}`}>
        {view === 'store' && <StoreView products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId} onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => { setCart([...cart, {...p, quantity: 1}]); showNotify('تمت الإضافة للسلة'); }} onViewProduct={(p) => { setSelectedProduct(p); onNavigateAction('product-details'); }} wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} />}
        
        {view === 'admin' && currentUser?.role === 'admin' && <AdminDashboard products={products} categories={categories} orders={orders} currentUser={currentUser} onOpenAddForm={() => { setSelectedProduct(null); onNavigateAction('admin-form'); }} onOpenEditForm={(p) => { setSelectedProduct(p); onNavigateAction('admin-form'); }} onOpenInvoiceForm={() => onNavigateAction('admin-invoice')} onDeleteProduct={async (id) => { const s = await ApiService.deleteProduct(id); if(s) loadData(); }} onAddCategory={async (c) => { const s = await ApiService.addCategory(c); if(s) loadData(); }} onUpdateCategory={async (c) => { const s = await ApiService.updateCategory(c); if(s) loadData(); }} onDeleteCategory={async (id) => { const s = await ApiService.deleteCategory(id); if(s) loadData(); }} onViewOrder={(o) => { setLastCreatedOrder(o); onNavigateAction('order-success'); }} onUpdateOrderPayment={async (id, m) => { const s = await ApiService.updateOrderPayment(id, m); if(s) loadData(true); }} soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)} onLogout={handleLogout} />}

        {view === 'cart' && <CartView cart={cart} onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))} onCheckout={() => onNavigateAction('checkout')} onContinueShopping={() => onNavigateAction('store')} />}
        
        {view === 'checkout' && <CheckoutView cart={cart} currentUser={currentUser} onBack={() => onNavigateAction('cart')} onPlaceOrder={async (d) => { const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0); const order: Order = { id: 'ORD-'+Date.now().toString().slice(-6), customerName: d.fullName, phone: d.phone, city: d.city, address: d.address, items: cart, total, subtotal: total, createdAt: Date.now(), status: 'completed', paymentMethod: d.paymentMethod, userId: currentUser?.id || null }; const s = await ApiService.saveOrder(order); if(s) { setLastCreatedOrder(order); setCart([]); WhatsAppService.sendOrderNotification(order, adminPhone); onNavigateAction('order-success'); loadData(); } }} />}
        
        {view === 'profile' && currentUser && <ProfileView currentUser={currentUser} onSuccess={handleLogout} onBack={() => onNavigateAction('store')} />}
        {view === 'order-success' && lastCreatedOrder && <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('store')} />}
      </main>

      {!isAdminView && <MobileNav currentView={view} cartCount={cart.length} onNavigate={onNavigateAction} onCartClick={() => onNavigateAction('cart')} isAdmin={currentUser?.role === 'admin'} />}
    </div>
  );
};

export default App;
