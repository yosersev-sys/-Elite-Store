
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import AiAssistant from './components/AiAssistant.tsx';
import { ApiService } from './services/api.ts';

const App: React.FC = () => {
  const ADMIN_VIEWS: View[] = ['admin', 'admincp', 'admin-form', 'admin-invoice', 'admin-auth'];

  const getInitialView = (): View => {
    const hash = window.location.hash.replace('#', '').replace(/^\//, '').split('?')[0];
    if (ADMIN_VIEWS.includes(hash as View)) return hash as View;
    const publicViews: View[] = ['cart', 'my-orders', 'profile', 'checkout', 'quick-invoice', 'order-success'];
    if (publicViews.includes(hash as View)) return hash as View;
    return 'store';
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('souq_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [view, setView] = useState<View>(getInitialView());
  const [adminPhone, setAdminPhone] = useState('201026034170'); 
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [newOrdersForPopup, setNewOrdersForPopup] = useState<Order[]>([]);
  const [productForBarcode, setProductForBarcode] = useState<Product | null>(null);
  
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(() => {
    try {
        const saved = sessionStorage.getItem('souq_last_order');
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const prevOrderIds = useRef<Set<string>>(new Set());
  const audioObj = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const handleHashChange = () => {
      const newView = getInitialView();
      if (newView !== view) setView(newView);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [view]);

  const loadData = async (isSilent: boolean = false, forcedUser?: User | null) => {
    try {
      if (!isSilent) setIsLoading(true);
      let activeUser = forcedUser !== undefined ? forcedUser : currentUser;
      
      const [storeSettings, fetchedProducts, fetchedCats] = await Promise.all([
        ApiService.getStoreSettings(),
        ApiService.getProducts(),
        ApiService.getCategories()
      ]);

      if (storeSettings?.whatsapp_number) setAdminPhone(storeSettings.whatsapp_number);
      if (storeSettings?.delivery_fee) setDeliveryFee(parseFloat(storeSettings.delivery_fee));
      setProducts(fetchedProducts || []);
      setCategories(fetchedCats || []);

      if (activeUser) {
        const fetchedOrders = await ApiService.getOrders();
        setOrders(fetchedOrders || []);
        if (activeUser.role === 'admin') {
          const [fetchedUsers, fetchedSuppliers] = await Promise.all([
            ApiService.getUsers(),
            ApiService.getSuppliers()
          ]);
          setUsers(fetchedUsers || []);
          setSuppliers(fetchedSuppliers || []);
          if (fetchedOrders && prevOrderIds.current.size > 0) {
            const trulyNew = fetchedOrders.filter((o: Order) => !prevOrderIds.current.has(o.id));
            if (trulyNew.length > 0) {
              if (soundEnabled && audioObj.current) audioObj.current.play().catch(() => {});
              setNewOrdersForPopup(prev => [...prev, ...trulyNew]);
            }
          }
          if (fetchedOrders) prevOrderIds.current = new Set(fetchedOrders.map((o: Order) => o.id));
        }
      }
    } catch (err) {
      console.error("Data Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (currentUser?.role === 'admin') loadData(true);
    }, 20000); 
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const onNavigateAction = (v: View) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
    setView(v);
    window.location.hash = v;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setCurrentUser(null);
    setOrders([]);
    setUsers([]);
    setSuppliers([]);
    onNavigateAction('store');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    loadData(false, user); 
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {...item, quantity: Number((item.quantity + quantity).toFixed(3))} : item);
      }
      return [...prev, { ...product, quantity }];
    });
    setNotification({ message: 'تمت الإضافة للسلة', type: 'success' });
  };

  useEffect(() => {
    localStorage.setItem('souq_cart', JSON.stringify(cart));
  }, [cart]);

  const isAdminPath = ADMIN_VIEWS.includes(view);
  const isActuallyAdmin = currentUser?.role === 'admin';

  if (isLoading && products.length === 0 && !isAdminPath) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
         <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 animate-bounce shadow-xl">
            <img src="https://soqelasr.com/shopping-bag.png" className="w-10 h-10 object-contain" alt="" />
         </div>
         <p className="font-black text-slate-800 text-sm">جاري مزامنة بيانات المتجر...</p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={() => loadData(true)}>
      <div className={`min-h-screen flex flex-col bg-[#f8fafc] ${isAdminPath ? 'admin-layout' : 'pb-24 md:pb-0'}`}>
        
        {isActuallyAdmin && newOrdersForPopup.length > 0 && (
          <NewOrderPopup 
            orders={newOrdersForPopup} 
            onClose={(id) => setNewOrdersForPopup(prev => prev.filter(o => o.id !== id))}
            onView={(order) => {
              setLastCreatedOrder(order);
              sessionStorage.setItem('souq_last_order', JSON.stringify(order));
              onNavigateAction('order-success');
            }}
          />
        )}

        {notification && (
          <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
        )}

        {isAdminPath && !isActuallyAdmin && (
          <AdminAuthView onSuccess={handleAuthSuccess} onClose={() => onNavigateAction('store')} />
        )}

        {showAuthModal && (
          <AuthView onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
        )}

        {!isAdminPath && (
          <Header 
            cartCount={cart.length} wishlistCount={wishlist.length} categories={categories} currentUser={currentUser}
            onNavigate={onNavigateAction} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout}
            onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); setView('store'); }}
          />
        )}

        <main className={`flex-grow ${isAdminPath ? 'w-full h-screen overflow-hidden' : 'container mx-auto px-2 md:px-4 pt-24 md:pt-32'}`}>
          {view === 'store' && (
            <>
              <StoreView 
                products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId}
                onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => addToCart(p)} 
                onViewProduct={(p) => { setSelectedProduct(p); setView('product-details'); }}
                wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
              />
              <AiAssistant products={products} onAddToCart={addToCart} showNotification={(m, t) => setNotification({message: m, type: t || 'success'})} />
            </>
          )}
          
          {(view === 'admin' || view === 'admincp') && isActuallyAdmin && (
            <AdminDashboard 
              products={products} categories={categories} orders={orders} users={users} suppliers={suppliers} currentUser={currentUser}
              isLoading={isLoading}
              onOpenAddForm={() => { setSelectedProduct(null); setView('admin-form'); }}
              onOpenEditForm={(p) => { setSelectedProduct(p); setView('admin-form'); }}
              onOpenInvoiceForm={() => setView('admin-invoice')}
              onDeleteProduct={async (id) => { 
                  if(await ApiService.deleteProduct(id)) { setNotification({message: 'تم الحذف', type: 'success'}); loadData(true); }
              }}
              onAddCategory={async (c) => { 
                  if(await ApiService.addCategory(c)) { setNotification({message: 'تم الإضافة', type: 'success'}); loadData(true); }
              }}
              onUpdateCategory={async (c) => { 
                  if(await ApiService.updateCategory(c)) { setNotification({message: 'تم التحديث', type: 'success'}); loadData(true); }
              }}
              onDeleteCategory={async (id) => { 
                  if(await ApiService.deleteCategory(id)) { setNotification({message: 'تم الحذف', type: 'success'}); loadData(true); }
              }}
              onViewOrder={(order) => {
                setLastCreatedOrder(order);
                sessionStorage.setItem('souq_last_order', JSON.stringify(order));
                onNavigateAction('order-success');
              }}
              onUpdateOrderPayment={async (id, method) => {
                const success = await ApiService.updateOrderPayment(id, method);
                if(success) { 
                  setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentMethod: method } : o));
                  setNotification({message: 'تم تحديث حالة الدفع بنجاح', type: 'success'}); 
                }
              }}
              onReturnOrder={async (id) => {
                if(!confirm('تأكيد الاسترجاع؟')) return;
                const res = await ApiService.returnOrder(id);
                if(res?.status === 'success') { 
                  setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as any } : o));
                  setNotification({message: 'تم الاسترجاع بنجاح', type: 'success'}); 
                }
              }}
              onDeleteUser={async (id) => {
                if(await ApiService.deleteUser(id)) { setNotification({message: 'تم حذف العضو بنجاح', type: 'success'}); loadData(true); }
              }}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onLogout={handleLogout}
              onRefreshData={() => loadData(true)}
            />
          )}

          {view === 'admin-form' && isActuallyAdmin && (
            <AdminProductForm 
              product={selectedProduct} categories={categories} suppliers={suppliers}
              onSubmit={async (p) => {
                const success = products.find(prod => prod.id === p.id) ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
                if (success) { setNotification({message: 'تم الحفظ بنجاح', type: 'success'}); await loadData(true); setProductForBarcode(p); }
              }}
              onCancel={() => onNavigateAction('admin')}
            />
          )}

          {(view === 'admin-invoice' || view === 'quick-invoice') && (
            <AdminInvoiceForm 
              products={products} initialCustomerName={currentUser?.name || 'عميل نقدي'} initialPhone={currentUser?.phone || ''}
              onSubmit={async (order) => {
                if (await ApiService.saveOrder(order)) {
                  setLastCreatedOrder(order);
                  sessionStorage.setItem('souq_last_order', JSON.stringify(order));
                  setNotification({message: 'تم حفظ الطلب بنجاح', type: 'success'});
                  onNavigateAction('order-success');
                  await loadData(true);
                }
              }}
              onCancel={() => onNavigateAction(isActuallyAdmin ? 'admin' : 'store')}
            />
          )}

          {view === 'cart' && (
            <CartView 
              cart={cart} 
              deliveryFee={deliveryFee}
              onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0.1, Number((i.quantity + d).toFixed(3)))} : i))}
              onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
              onCheckout={() => onNavigateAction('checkout')} onContinueShopping={() => onNavigateAction('store')}
            />
          )}

          {view === 'product-details' && selectedProduct && (
            <ProductDetailsView 
              product={selectedProduct} categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
              onAddToCart={(p, s, c, rect) => addToCart(p, 1)} onBack={() => onNavigateAction('store')}
              isFavorite={wishlist.includes(selectedProduct.id)} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          )}

          {view === 'order-success' && lastCreatedOrder && (
            <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('store')} />
          )}

          {view === 'checkout' && (
             <CheckoutView 
              cart={cart} currentUser={currentUser} onBack={() => onNavigateAction('cart')}
              onPlaceOrder={async (details) => {
                const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
                const total = subtotal + deliveryFee;
                const order: Order = {
                  id: 'ORD-' + Date.now().toString().slice(-6),
                  customerName: details.fullName, phone: details.phone, city: 'فاقوس', address: details.address,
                  items: [...cart], total, subtotal, createdAt: Date.now(), status: 'completed', paymentMethod: 'عند الاستلام', userId: currentUser?.id
                };
                if (await ApiService.saveOrder(order)) {
                  setLastCreatedOrder(order);
                  sessionStorage.setItem('souq_last_order', JSON.stringify(order));
                  setCart([]);
                  setNotification({message: 'تم الطلب بنجاح', type: 'success'});
                  onNavigateAction('order-success');
                  loadData(true);
                }
              }}
             />
          )}

          {view === 'my-orders' && <MyOrdersView orders={orders} onViewDetails={(o) => {setLastCreatedOrder(o); onNavigateAction('order-success');}} onBack={() => onNavigateAction('store')} />}
          {view === 'profile' && currentUser && <ProfileView currentUser={currentUser} onSuccess={handleLogout} onBack={() => onNavigateAction('store')} />}
        </main>

        {!isAdminPath && (
          <>
            <Footer categories={categories} onNavigate={onNavigateAction} onCategorySelect={setSelectedCategoryId} />
            <FloatingCartButton count={cart.length} onClick={() => onNavigateAction('cart')} isVisible={!isAdminPath} />
            <FloatingQuickInvoiceButton currentView={view} onNavigate={onNavigateAction} />
            {isActuallyAdmin && <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />}
            <MobileNav currentView={view} cartCount={cart.length} onNavigate={onNavigateAction} onCartClick={() => onNavigateAction('cart')} isAdmin={isActuallyAdmin} />
          </>
        )}
        
        {productForBarcode && (
          <BarcodePrintPopup product={productForBarcode} onClose={() => { setProductForBarcode(null); onNavigateAction('admin'); }} />
        )}
      </div>
      <style>{`
        .admin-layout { height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
        @media (min-width: 1024px) {
          .admin-layout main { padding: 0 !important; }
        }
      `}</style>
    </PullToRefresh>
  );
};

export default App;
