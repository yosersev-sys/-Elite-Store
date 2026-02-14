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

const App: React.FC = () => {
  const [view, setView] = useState<View>('store');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminPhone, setAdminPhone] = useState('201026034170'); 
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
      console.error("Data loading error:", err);
    }
  };

  useEffect(() => { 
    loadData();
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

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const isAdminView = ['admin', 'admin-auth', 'admin-form', 'admin-invoice'].includes(view);

  return (
    <div className={`min-h-screen flex flex-col bg-[#f8fafc] ${isAdminView ? '' : 'pb-32 md:pb-0'}`}>
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {showAuthModal && (
        <AuthView onSuccess={(user) => { setCurrentUser(user); setShowAuthModal(false); loadData(); }} onClose={() => setShowAuthModal(false)} />
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
            onCategorySelect={(id) => setSelectedCategoryId(id)} 
            onAddToCart={(p) => { setCart(prev => [...prev, {...p, quantity: 1}]); showNotification('تمت الإضافة للسلة', 'success'); }} 
            onViewProduct={(p) => { setSelectedProduct(p); onNavigateAction('product-details'); }}
            wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}
        
        {view === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard 
            products={products} categories={categories} orders={orders} users={users} currentUser={currentUser}
            onOpenAddForm={() => { setSelectedProduct(null); onNavigateAction('admin-form'); }} 
            onOpenEditForm={(p) => { setSelectedProduct(p); onNavigateAction('admin-form'); }}
            onOpenInvoiceForm={() => onNavigateAction('admin-invoice')} 
            onDeleteProduct={async (id) => { if(confirm('حذف المنتج؟')){ await ApiService.deleteProduct(id); loadData(); } }}
            onAddCategory={async (c) => { await ApiService.addCategory(c); loadData(); }}
            onUpdateCategory={async (c) => { await ApiService.updateCategory(c); loadData(); }}
            onDeleteCategory={async (id) => { if(confirm('حذف القسم؟')){ await ApiService.deleteCategory(id); loadData(); } }}
            onViewOrder={(order) => { setLastCreatedOrder(order); onNavigateAction('order-success'); }}
            onUpdateOrderPayment={async (id, m) => { await ApiService.updateOrderPayment(id, m); loadData(); }}
            soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onLogout={handleLogout}
          />
        )}

        {view === 'admin-form' && currentUser?.role === 'admin' && (
          <AdminProductForm 
            product={selectedProduct} categories={categories} 
            onCancel={() => onNavigateAction('admin')}
            onSubmit={async (p) => {
              const success = selectedProduct ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
              if(success) { showNotification('تم حفظ المنتج', 'success'); onNavigateAction('admin'); loadData(); }
            }}
          />
        )}

        {view === 'admin-invoice' && currentUser?.role === 'admin' && (
          <AdminInvoiceForm 
            products={products} onCancel={() => onNavigateAction('admin')}
            onSubmit={async (order) => {
              const success = await ApiService.saveOrder(order);
              if(success) { setLastCreatedOrder(order); onNavigateAction('order-success'); loadData(); }
            }}
          />
        )}

        {view === 'quick-invoice' && (
          <AdminInvoiceForm 
            products={products} onCancel={() => onNavigateAction('store')}
            initialCustomerName={currentUser?.name || 'عميل نقدي'} initialPhone={currentUser?.phone || ''}
            onSubmit={async (order) => {
              const success = await ApiService.saveOrder(order);
              if(success) { setLastCreatedOrder(order); onNavigateAction('order-success'); loadData(); }
            }}
          />
        )}

        {view === 'cart' && (
          <CartView 
            cart={cart} onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))}
            onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
            onCheckout={() => onNavigateAction('checkout')} onContinueShopping={() => onNavigateAction('store')}
          />
        )}

        {view === 'product-details' && selectedProduct && (
          <ProductDetailsView 
            product={selectedProduct} categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
            onAddToCart={(p) => { setCart(prev => [...prev, {...p, quantity: 1}]); showNotification('تمت الإضافة للسلة', 'success'); }} 
            onBack={() => onNavigateAction('store')}
            isFavorite={wishlist.includes(selectedProduct.id)} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}

        {view === 'checkout' && (
          <CheckoutView 
            cart={cart} currentUser={currentUser} onBack={() => onNavigateAction('cart')}
            onPlaceOrder={async (details) => {
              const totalAmount = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
              const order = { id: 'ORD-' + Date.now().toString().slice(-6), customerName: details.fullName, phone: details.phone, city: 'فاقوس', address: details.address, items: cart, total: totalAmount, subtotal: totalAmount, createdAt: Date.now(), status: 'completed', paymentMethod: 'عند الاستلام', userId: currentUser?.id || null };
              const success = await ApiService.saveOrder(order as any);
              if (success) { setLastCreatedOrder(order as any); setCart([]); onNavigateAction('order-success'); loadData(); }
            }}
          />
        )}

        {view === 'order-success' && lastCreatedOrder && (
          <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('store')} />
        )}

        {view === 'profile' && currentUser && <ProfileView currentUser={currentUser} onSuccess={handleLogout} onBack={() => onNavigateAction('store')} />}
        {view === 'my-orders' && <MyOrdersView orders={orders} onViewDetails={(o) => { setLastCreatedOrder(o); onNavigateAction('order-success'); }} onBack={() => onNavigateAction('store')} />}
        
        {view === 'admin-auth' && <AdminAuthView onSuccess={(u) => { setCurrentUser(u); onNavigateAction('admin'); loadData(); }} onClose={() => onNavigateAction('store')} />}
      </main>

      {/* استعادة الأزرار العائمة */}
      {!isAdminView && (
        <>
          <FloatingCartButton count={cart.length} onClick={() => onNavigateAction('cart')} isVisible={view !== 'cart'} />
          <FloatingQuickInvoiceButton currentView={view} onNavigate={onNavigateAction} />
          {currentUser?.role === 'admin' && (
            <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />
          )}
        </>
      )}

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