import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Product, CartItem, Category, Order, User, Supplier } from './types.ts';
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
import PullToRefresh from './components/PullToRefresh.tsx';
import NewOrderPopup from './components/NewOrderPopup.tsx';
import BarcodePrintPopup from './components/BarcodePrintPopup.tsx';
import Footer from './components/Footer.tsx';
import { ApiService } from './services/api.ts';
import { WhatsAppService } from './services/whatsappService.ts';

const App: React.FC = () => {
  // 1. وظيفة كشف المسار المباشر (Direct Path Detection)
  // لا نعتمد فقط على الحالة لأنها قد تتأخر في المحركات السريعة
  const detectInitialView = (): View => {
    const h = window.location.hash.toLowerCase();
    if (h.includes('cp') || h.includes('admin')) {
      if (h.includes('form')) return 'admin-form';
      if (h.includes('invoice')) return 'admin-invoice';
      return 'admincp';
    }
    const clean = h.replace(/^#\/?/, '').split('?')[0] as View;
    const storeViews: View[] = ['cart', 'my-orders', 'profile', 'checkout', 'quick-invoice', 'order-success', 'product-details'];
    return storeViews.includes(clean) ? clean : 'store';
  };

  const [view, setView] = useState<View>(detectInitialView);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('souq_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [adminSummary, setAdminSummary] = useState<any>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [adminPhone, setAdminPhone] = useState('201026034170');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBooting, setIsBooting] = useState(true); 
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newOrdersForPopup, setNewOrdersForPopup] = useState<Order[]>([]);
  const [productForBarcode, setProductForBarcode] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('souq_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('souq_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const prevOrderIds = useRef<Set<string>>(new Set());

  // مزامنة الرابط فورياً قبل الرسم (useLayoutEffect)
  useLayoutEffect(() => {
    const sync = () => {
      const newV = detectInitialView();
      if (newV !== view) setView(newV);
    };
    window.addEventListener('hashchange', sync);
    // تفعيل الكشف فوراً
    sync();
    return () => window.removeEventListener('hashchange', sync);
  }, [view]);

  const loadData = async (silent = false, user = currentUser) => {
    if (!silent) setIsLoading(true);
    try {
      const [ph, pr, ct, st] = await Promise.all([
        ApiService.getAdminPhone(),
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getStoreSettings()
      ]);
      if (ph) setAdminPhone(ph.phone);
      if (st?.delivery_fee) setDeliveryFee(parseFloat(st.delivery_fee));
      setProducts(pr || []);
      setCategories(ct || []);

      if (user?.role === 'admin') {
        const [sum, usrs, sups, ords] = await Promise.all([
          ApiService.getAdminSummary(),
          ApiService.getUsers(),
          ApiService.getSuppliers(),
          ApiService.getOrders()
        ]);
        setAdminSummary(sum);
        setUsers(usrs || []);
        setSuppliers(sups || []);
        setOrders(ords || []);
        
        if (ords?.length > 0 && prevOrderIds.current.size > 0) {
          const newOnes = ords.filter((o: Order) => !prevOrderIds.current.has(o.id));
          if (newOnes.length > 0) setNewOrdersForPopup(prev => [...prev, ...newOnes]);
        }
        prevOrderIds.current = new Set(ords.map((o: Order) => o.id));
      } else if (user) {
        const myOrds = await ApiService.getOrders();
        setOrders(myOrds || []);
      }
    } finally {
      setIsLoading(false);
      setIsBooting(false);
    }
  };

  useEffect(() => { loadData(); }, [currentUser?.id]);

  const onNavigate = (v: View) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) { setShowAuthModal(true); return; }
    const h = (v === 'admin' || v === 'admincp') ? 'admincp' : (v === 'store' ? '' : v);
    window.location.hash = h;
  };

  const handleAuth = (user: User) => { setCurrentUser(user); setShowAuthModal(false); loadData(false, user); };
  const handleLogout = () => { ApiService.logout(); setCurrentUser(null); onNavigate('store'); };

  // --- التحقق الحاسم: هل نحن في وضع الإدارة؟ ---
  // نقرأ من window.location مباشرة لضمان أعلى دقة
  const hash = window.location.hash.toLowerCase();
  const isInAdminMode = hash.includes('cp') || hash.includes('admin') || view.includes('admin');
  const isAdminAuthorized = currentUser?.role === 'admin';

  // 1. حالة "نظام الإدارة" (منفصلة تماماً)
  if (isInAdminMode) {
    if (!isAdminAuthorized) {
      return <AdminAuthView onSuccess={handleAuth} onClose={() => onNavigate('store')} />;
    }
    
    return (
      <div className="min-h-screen bg-slate-50 pt-2 px-2 md:px-4">
        {newOrdersForPopup.length > 0 && <NewOrderPopup orders={newOrdersForPopup} onClose={(id) => setNewOrdersForPopup(p => p.filter(o => o.id !== id))} onView={(o) => { setLastCreatedOrder(o); onNavigate('order-success'); }} />}
        {productForBarcode && <BarcodePrintPopup product={productForBarcode} onClose={() => { setProductForBarcode(null); onNavigate('admincp'); }} />}
        
        {view === 'admin-form' ? (
          <AdminProductForm product={selectedProduct} categories={categories} suppliers={suppliers} onSubmit={async (p) => { const s = products.find(x => x.id === p.id) ? await ApiService.updateProduct(p) : await ApiService.addProduct(p); if (s) { loadData(true); setProductForBarcode(p); } }} onCancel={() => onNavigate('admincp')} />
        ) : view === 'admin-invoice' ? (
          <AdminInvoiceForm products={products} initialCustomerName={currentUser?.name} initialPhone={currentUser?.phone} globalDeliveryFee={deliveryFee} order={editingOrder} onSubmit={async (o) => { const s = editingOrder ? await ApiService.updateOrder(o) : await ApiService.saveOrder(o); if (s) { setLastCreatedOrder(o); loadData(true); onNavigate('order-success'); } }} onCancel={() => { setEditingOrder(null); onNavigate('admincp'); }} />
        ) : (
          <AdminDashboard 
            products={products} categories={categories} orders={orders} users={users} suppliers={suppliers} currentUser={currentUser} isLoading={isLoading} adminSummary={adminSummary}
            onOpenAddForm={() => { setSelectedProduct(null); onNavigate('admin-form'); }}
            onOpenEditForm={(p) => { setSelectedProduct(p); onNavigate('admin-form'); }}
            onOpenInvoiceForm={() => { setEditingOrder(null); onNavigate('admin-invoice'); }}
            onEditOrder={(o) => { setEditingOrder(o); onNavigate('admin-invoice'); }}
            onDeleteProduct={async (id) => { if(await ApiService.deleteProduct(id)) loadData(true); }}
            onAddCategory={async (c) => { if(await ApiService.addCategory(c)) loadData(true); }}
            onUpdateCategory={async (c) => { if(await ApiService.updateCategory(c)) loadData(true); }}
            onDeleteCategory={async (id) => { if(await ApiService.deleteCategory(id)) loadData(true); }}
            onViewOrder={(o) => { setLastCreatedOrder(o); onNavigate('order-success'); }}
            onUpdateOrderPayment={(id, m) => ApiService.updateOrderPayment(id, m).then(() => loadData(true))}
            onReturnOrder={async (id) => { if(await ApiService.returnOrder(id)) loadData(true); }}
            onDeleteUser={async (id) => { if(await ApiService.deleteUser(id)) loadData(true); }}
            soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onLogout={handleLogout} onRefreshData={() => loadData(true)}
          />
        )}
      </div>
    );
  }

  // 2. حالة "نظام المتجر" (تظهر فقط إذا لم نكن في وضع الإدارة)
  const renderStoreContent = () => {
    switch(view) {
      case 'cart': return <CartView cart={cart} deliveryFee={deliveryFee} onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0.1, i.quantity + d)} : i))} onSetQuantity={(id, q) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: q} : i))} onRemove={(id) => setCart(p => p.filter(x => x.id !== id))} onCheckout={() => onNavigate('checkout')} onContinueShopping={() => onNavigate('store')} />;
      case 'product-details': return selectedProduct ? <ProductDetailsView product={selectedProduct} categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'} onAddToCart={(p, q) => { setCart(prev => { const ex = prev.find(x => x.id === p.id); if (ex) return prev.map(x => x.id === p.id ? {...x, quantity: x.quantity + q} : x); return [...prev, {...p, quantity: q}]; }); setNotification({message: 'تمت الإضافة للسلة', type: 'success'}); }} onBack={() => onNavigate('store')} isFavorite={wishlist.includes(selectedProduct.id)} onToggleFavorite={(id) => setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} /> : null;
      case 'checkout': return <CheckoutView cart={cart} currentUser={currentUser} deliveryFee={deliveryFee} onBack={() => onNavigate('cart')} onPlaceOrder={async (d) => { const sub = cart.reduce((s, i) => s + (i.price * i.quantity), 0); const o: Order = { id: 'ORD-' + Date.now().toString().slice(-6), customerName: d.fullName, phone: d.phone, city: 'فاقوس', address: d.address, items: cart, subtotal: sub, total: sub + deliveryFee, paymentMethod: 'عند الاستلام', status: 'completed', createdAt: Date.now(), userId: currentUser?.id }; if (await ApiService.saveOrder(o)) { setLastCreatedOrder(o); setCart([]); onNavigate('order-success'); loadData(true); WhatsAppService.sendOrderNotification(o, adminPhone); } }} />;
      case 'order-success': return lastCreatedOrder ? <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigate('store')} /> : null;
      case 'my-orders': return <MyOrdersView orders={orders} onViewDetails={(o) => {setLastCreatedOrder(o); onNavigate('order-success');}} onBack={() => onNavigate('store')} />;
      case 'profile': return currentUser ? <ProfileView currentUser={currentUser} onSuccess={handleLogout} onBack={() => onNavigate('store')} /> : null;
      case 'quick-invoice': return <AdminInvoiceForm products={products} initialCustomerName={currentUser?.name} initialPhone={currentUser?.phone} globalDeliveryFee={deliveryFee} onSubmit={async (o) => { if (await ApiService.saveOrder(o)) { setLastCreatedOrder(o); loadData(true); onNavigate('order-success'); } }} onCancel={() => onNavigate('store')} />;
      default: return <StoreView products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId} onCategorySelect={setSelectedCategoryId} onAddToCart={(p) => { setCart(prev => { const ex = prev.find(x => x.id === p.id); if (ex) return prev.map(x => x.id === p.id ? {...x, quantity: x.quantity + 1} : x); return [...prev, {...p, quantity: 1}]; }); setNotification({message: 'تمت الإضافة للسلة', type: 'success'}); }} onViewProduct={(p) => { setSelectedProduct(p); onNavigate('product-details'); }} wishlist={wishlist} onToggleFavorite={(id) => setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} />;
    }
  };

  return (
    <PullToRefresh onRefresh={() => loadData(true)}>
      <div className="min-h-screen flex flex-col bg-[#f8fafc] pb-24 md:pb-0">
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        {showAuthModal && <AuthView onClose={() => setShowAuthModal(false)} onSuccess={handleAuth} />}
        
        <Header 
          cartCount={cart.length} wishlistCount={wishlist.length} categories={categories} currentUser={currentUser}
          onNavigate={onNavigate} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout}
          onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); onNavigate('store'); }}
        />

        <main className="flex-grow container mx-auto px-2 md:px-4 pt-24 md:pt-32">
          {renderStoreContent()}
        </main>

        <Footer categories={categories} onNavigate={onNavigate} onCategorySelect={setSelectedCategoryId} />
        <FloatingCartButton count={cart.length} onClick={() => onNavigate('cart')} isVisible={true} />
        <FloatingQuickInvoiceButton currentView={view} onNavigate={onNavigate} />
        {isAdminAuthorized && <FloatingAdminButton currentView={view} onNavigate={onNavigate} />}
        <MobileNav currentView={view} cartCount={cart.length} onNavigate={onNavigate} onCartClick={() => onNavigate('cart')} isAdmin={isAdminAuthorized} />
      </div>
    </PullToRefresh>
  );
};

export default App;