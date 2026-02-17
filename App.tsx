
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
import { ApiService } from './services/api.ts';
import { WhatsAppService } from './services/whatsappService.ts';

const App: React.FC = () => {
  const ADMIN_VIEWS: View[] = ['admin', 'admincp', 'admin-form', 'admin-invoice', 'admin-auth'];

  const getInitialView = (): View => {
    const hash = window.location.hash.replace('#', '').split('?')[0];
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
  
  // حفظ الطلب الأخير في sessionStorage لضمان بقائه عند تحديث الصفحة
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
    if (lastCreatedOrder) {
      sessionStorage.setItem('souq_last_order', JSON.stringify(lastCreatedOrder));
    }
  }, [lastCreatedOrder]);

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    audio.preload = 'auto';
    audioObj.current = audio;
  }, []);

  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '').split('?')[0];
    if (view === 'store') {
        if (currentHash !== '' && !ADMIN_VIEWS.includes(currentHash as View)) {
            window.history.replaceState(null, '', window.location.pathname);
        }
    } else {
        if (currentHash !== view) window.location.hash = view;
    }
    
    // إذا كانت الصفحة الحالية هي "النجاح" ولكن البيانات مفقودة، ارجع للرئيسية
    if (view === 'order-success' && !lastCreatedOrder) {
      setView('store');
    }
  }, [view, lastCreatedOrder]);

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
      
      if (forcedUser === undefined) {
          const userFromServer = await ApiService.getCurrentUser();
          if (userFromServer) {
            setCurrentUser(userFromServer);
            activeUser = userFromServer;
          }
      }

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
              if (soundEnabled && audioObj.current) {
                audioObj.current.currentTime = 0;
                audioObj.current.play().catch(() => {});
              }
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
    }, 15000); 
    return () => clearInterval(interval);
  }, [currentUser?.id]);

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
    setOrders([]);
    setUsers([]);
    setSuppliers([]);
    setView('store');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    loadData(false, user); 
  };

  const addToCart = (product: Product, selectedSize?: string, selectedColor?: string, rect?: DOMRect, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + quantity} : item);
      }
      return [...prev, { ...product, quantity, selectedSize, selectedColor }];
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
      <div className={`min-h-screen flex flex-col bg-[#f8fafc] ${isAdminPath ? 'admin-no-tracking' : 'pb-24 md:pb-0'}`}>
        
        {isActuallyAdmin && newOrdersForPopup.length > 0 && (
          <NewOrderPopup 
            orders={newOrdersForPopup} 
            onClose={(id) => setNewOrdersForPopup(prev => prev.filter(o => o.id !== id))}
            onView={(order) => {
              setLastCreatedOrder(order);
              onNavigateAction('order-success');
            }}
          />
        )}

        {notification && (
          <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
        )}

        {isAdminPath && !isActuallyAdmin && (
          <AdminAuthView 
            onSuccess={handleAuthSuccess}
            onClose={() => setView('store')}
          />
        )}

        {showAuthModal && (
          <AuthView 
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess} 
          />
        )}

        {!isAdminPath && (
          <Header 
            cartCount={cart.length} 
            wishlistCount={wishlist.length} 
            categories={categories}
            currentUser={currentUser}
            onNavigate={onNavigateAction}
            onLoginClick={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            onSearch={setSearchQuery} 
            onCategorySelect={(id) => { setSelectedCategoryId(id); setView('store'); }}
          />
        )}

        <main className={`flex-grow ${isAdminPath ? 'w-full pt-0' : 'container mx-auto px-2 md:px-4 pt-24 md:pt-32'}`}>
          {view === 'store' && (
            <StoreView 
              products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId}
              onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => addToCart(p)} 
              onViewProduct={(p) => { setSelectedProduct(p); setView('product-details'); }}
              wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
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
                setView('order-success');
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
                if(await ApiService.deleteUser(id)) {
                  setNotification({message: 'تم حذف العضو بنجاح', type: 'success'});
                  loadData(true);
                } else {
                  setNotification({message: 'فشل حذف العضو', type: 'error'});
                }
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
                if (success) {
                  setNotification({message: 'تم الحفظ بنجاح', type: 'success'});
                  await loadData(true);
                  setProductForBarcode(p);
                }
              }}
              onCancel={() => setView('admin')}
            />
          )}

          {(view === 'admin-invoice' || view === 'quick-invoice') && (
            <AdminInvoiceForm 
              products={products}
              initialCustomerName={currentUser?.name || 'عميل نقدي'}
              initialPhone={currentUser?.phone || ''}
              defaultDeliveryFee={deliveryFee}
              onSubmit={async (order) => {
                if (await ApiService.saveOrder(order)) {
                  setLastCreatedOrder(order);
                  setNotification({message: 'تم حفظ الطلب بنجاح', type: 'success'});
                  setView('order-success');
                  await loadData(true);
                }
              }}
              onCancel={() => setView(isActuallyAdmin ? 'admin' : 'store')}
            />
          )}

          {view === 'cart' && (
            <CartView 
              cart={cart} 
              onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0.1, i.quantity + d)} : i))}
              onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
              onCheckout={() => setView('checkout')}
              onContinueShopping={() => setView('store')}
            />
          )}

          {view === 'product-details' && selectedProduct && (
            <ProductDetailsView 
              product={selectedProduct}
              categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
              onAddToCart={(p, s, c, rect, q) => addToCart(p, s, c, rect, q)}
              onBack={() => setView('store')}
              isFavorite={wishlist.includes(selectedProduct.id)}
              onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          )}

          {view === 'order-success' && lastCreatedOrder && (
            <OrderSuccessView 
              order={lastCreatedOrder} 
              adminPhone={adminPhone}
              onContinueShopping={() => setView('store')} 
            />
          )}

          {view === 'checkout' && (
             <CheckoutView 
              cart={cart} currentUser={currentUser} onBack={() => setView('cart')}
              deliveryFee={deliveryFee}
              onPlaceOrder={async (details) => {
                const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
                const total = subtotal + deliveryFee;
                const order: Order = {
                  id: 'ORD-' + Date.now().toString().slice(-6),
                  customerName: details.fullName, phone: details.phone, city: 'فاقوس', address: details.address,
                  items: [...cart], total, subtotal, createdAt: Date.now(), status: 'completed', paymentMethod: 'عند الاستلام', userId: currentUser?.id
                };
                if (await ApiService.saveOrder(order)) {
                  // ترتيب مهم: تعيين الطلب أولاً ثم مسح السلة ثم الانتقال
                  setLastCreatedOrder(order);
                  setCart([]);
                  setNotification({message: 'تم الطلب بنجاح', type: 'success'});
                  setView('order-success');
                  loadData(true);
                }
              }}
             />
          )}

          {view === 'my-orders' && <MyOrdersView orders={orders} onViewDetails={(o) => {setLastCreatedOrder(o); setView('order-success');}} onBack={() => setView('store')} />}
          {view === 'profile' && currentUser && <ProfileView currentUser={currentUser} onSuccess={handleLogout} onBack={() => setView('store')} />}
        </main>

        {!isAdminPath && (
          <>
            <Footer categories={categories} onNavigate={onNavigateAction} onCategorySelect={setSelectedCategoryId} />
            <FloatingCartButton count={cart.length} onClick={() => setView('cart')} isVisible={!isAdminPath} />
            <FloatingQuickInvoiceButton currentView={view} onNavigate={onNavigateAction} />
            {isActuallyAdmin && (
              <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />
            )}
            <MobileNav currentView={view} cartCount={cart.length} onNavigate={onNavigateAction} onCartClick={() => setView('cart')} isAdmin={isActuallyAdmin} />
          </>
        )}
        
        {productForBarcode && (
          <BarcodePrintPopup product={productForBarcode} onClose={() => { setProductForBarcode(null); setView('admin'); }} />
        )}
      </div>
    </PullToRefresh>
  );
};

export default App;
