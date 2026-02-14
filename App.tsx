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

const App: React.FC = () => {
  const [view, setView] = useState<View>('store');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminPhone, setAdminPhone] = useState('201026034170'); 
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false); // تم التغيير لـ false لفتح الواجهة فوراً
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('souq_cart') || '[]'); } catch { return []; }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('souq_wishlist') || '[]'); } catch { return []; }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => { localStorage.setItem('souq_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('souq_wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  const loadData = async (isSilent = false) => {
    try {
      // جلب البيانات الأساسية دفعة واحدة لتحسين الأداء
      const [user, adminInfo, fetchedProducts, fetchedCats] = await Promise.all([
        ApiService.getCurrentUser(),
        ApiService.getAdminPhone(),
        ApiService.getProducts(),
        ApiService.getCategories()
      ]);

      setCurrentUser(user);
      if (adminInfo?.phone) setAdminPhone(adminInfo.phone);
      setProducts(fetchedProducts || []);
      setCategories(fetchedCats || []);
      
      if (user) {
        const fetchedOrders = await ApiService.getOrders();
        setOrders(fetchedOrders || []);
        if (user.role === 'admin') {
          const fetchedUsers = await ApiService.getUsers();
          setUsers(fetchedUsers || []);
        }
      }
    } catch (err) {
      console.error("Background data loading error:", err);
    }
  };

  useEffect(() => { 
    loadData();
    // تفعيل التزامن مع الهاش (URL) فقط بعد التحميل الأول
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes('admincp')) setView('admin-auth');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const onNavigateAction = (v: View) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setCurrentUser(null);
    onNavigateAction('store');
  };

  const isAdminView = view === 'admin' || view === 'admin-auth' || view === 'admin-form' || view === 'admin-invoice';

  return (
    <div className={`min-h-screen flex flex-col bg-[#f8fafc] ${isAdminView ? '' : 'pb-32 md:pb-0'}`}>
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {!isAdminView && (
        <Header 
          cartCount={cart.length} wishlistCount={wishlist.length} categories={categories}
          currentUser={currentUser} onNavigate={onNavigateAction}
          onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout}
          onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); if(view !== 'store') onNavigateAction('store'); }}
        />
      )}

      <main className={`flex-grow container mx-auto px-2 md:px-4 ${isAdminView ? 'pt-4' : 'pt-20 md:pt-32'}`}>
        {view === 'store' && (
          <StoreView 
            products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId}
            onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => setCart([...cart, {...p, quantity: 1}])} 
            onViewProduct={(p) => { setSelectedProduct(p); onNavigateAction('product-details'); }}
            wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}
        {/* ... بقية الـ Views تعمل بنفس الطريقة ... */}
        {view === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard 
            products={products} categories={categories} orders={orders} users={users} currentUser={currentUser}
            onOpenAddForm={() => setView('admin-form')} onOpenEditForm={(p) => { setSelectedProduct(p); setView('admin-form'); }}
            onOpenInvoiceForm={() => setView('admin-invoice')} onDeleteProduct={(id) => { ApiService.deleteProduct(id); loadData(true); }}
            onAddCategory={(c) => { ApiService.addCategory(c); loadData(true); }}
            onUpdateCategory={(c) => { ApiService.updateCategory(c); loadData(true); }}
            onDeleteCategory={(id) => { ApiService.deleteCategory(id); loadData(true); }}
            onViewOrder={(order) => { setLastCreatedOrder(order); setView('order-success'); }}
            onUpdateOrderPayment={(id, m) => { ApiService.updateOrderPayment(id, m); loadData(true); }}
            soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {!isAdminView && (
        <MobileNav 
          currentView={view} cartCount={cart.length} 
          onNavigate={onNavigateAction} onCartClick={() => onNavigateAction('cart')} 
          isAdmin={currentUser?.role === 'admin'} 
        />
      )}
    </div>
  );
};

export default App;