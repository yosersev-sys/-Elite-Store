
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
import PullToRefresh from './components/PullToRefresh.tsx';
import NewOrderPopup from './components/NewOrderPopup.tsx';
import BarcodePrintPopup from './components/BarcodePrintPopup.tsx';
import { ApiService } from './services/api.ts';
import { WhatsAppService } from './services/whatsappService.ts';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const App: React.FC = () => {
  // دالة ذكية لتحديد الواجهة الأولية بناءً على الرابط
  const getInitialView = (): View => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'admin' || hash === 'admincp') return 'admin';
    if (hash === 'admin-invoice') return 'admin-invoice';
    if (hash === 'cart') return 'cart';
    if (hash === 'my-orders') return 'my-orders';
    if (hash === 'profile') return 'profile';
    return 'store';
  };

  // استرجاع المستخدم من الكاش فوراً لتجنب الصفحة البيضاء
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('souq_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [view, setView] = useState<View>(getInitialView());
  const [adminPhone, setAdminPhone] = useState('201026034170'); 
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const prevOrderIds = useRef<Set<string>>(new Set());
  const audioObj = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // تحديث الـ Hash عند تغيير الـ View لضمان عمل الـ Refresh بشكل صحيح
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (view === 'store') {
        if (currentHash !== '') window.history.replaceState(null, '', ' ');
    } else {
        window.location.hash = view;
    }
  }, [view]);

  // مراقبة تغيير الـ Hash يدوياً (أزرار الرجوع في المتصفح)
  useEffect(() => {
    const handleHashChange = () => setView(getInitialView());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadData = async (isSilent: boolean = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      
      // جلب بيانات المستخدم الحقيقية من السيرفر للتأكد من الجلسة
      const user = await ApiService.getCurrentUser();
      setCurrentUser(user);

      const tasks: Promise<any>[] = [
        ApiService.getAdminPhone(),
        ApiService.getProducts(),
        ApiService.getCategories()
      ];

      if (user) {
        tasks.push(ApiService.getOrders());
        if (user.role === 'admin') {
          tasks.push(ApiService.getUsers());
        }
      }

      const results = await Promise.all(tasks);
      
      const adminInfo = results[0];
      const fetchedProducts = results[1] || [];
      const fetchedCats = results[2] || [];

      if (adminInfo?.phone) setAdminPhone(adminInfo.phone);
      setProducts(fetchedProducts);
      setCategories(fetchedCats);

      if (user) {
        const fetchedOrders = results[3] || [];
        setOrders(fetchedOrders);

        if (user.role === 'admin' && results[4]) {
          const fetchedUsers = results[4] || [];
          setUsers(fetchedUsers);

          if (prevOrderIds.current.size > 0) {
            const trulyNew = fetchedOrders.filter((o: Order) => !prevOrderIds.current.has(o.id));
            if (trulyNew.length > 0) {
              if (soundEnabled && audioObj.current) audioObj.current.play().catch(() => {});
              setNewOrdersForPopup(prev => [...prev, ...trulyNew]);
            }
          }
          prevOrderIds.current = new Set(fetchedOrders.map((o: Order) => o.id));
        }
      }
    } catch (err) {
      console.error("Critical Refresh Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (currentUser?.role === 'admin') loadData(true);
    }, 30000); 
    return () => clearInterval(interval);
  }, [currentUser?.role]);

  const onNavigateAction = (v: View) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
    // حماية لوحة التحكم
    if ((v === 'admin' || v === 'admin-invoice') && (!currentUser || currentUser.role !== 'admin')) {
      setView('admin-auth');
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
    onNavigateAction('store');
  };

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + qty} : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setNotification({ message: 'تمت الإضافة للسلة', type: 'success' });
  };

  useEffect(() => {
    localStorage.setItem('souq_cart', JSON.stringify(cart));
  }, [cart]);

  const isAdminView = view === 'admin' || view === 'admin-auth' || view === 'admin-form' || view === 'admin-invoice';

  // شاشة تحميل محسنة تمنع الرندر الخاطئ
  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
         <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 animate-bounce shadow-xl">
            <img src="https://soqelasr.com/shopping-bag.png" className="w-10 h-10 object-contain" alt="" />
         </div>
         <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-1 border-2 border-emerald-100 rounded-full overflow-hidden">
               <div className="w-1/2 h-full bg-emerald-500 animate-shimmer"></div>
            </div>
            <p className="font-black text-slate-800 text-sm">جاري مزامنة بياناتك الآمنة...</p>
         </div>
         <style>{`
            @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
            .animate-shimmer { animation: shimmer 1.5s infinite linear; }
         `}</style>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={() => loadData(true)}>
      <div className={`min-h-screen flex flex-col bg-[#f8fafc] ${isAdminView ? 'admin-no-tracking' : 'pb-24 md:pb-0'}`}>
        
        {currentUser?.role === 'admin' && newOrdersForPopup.length > 0 && (
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

        {view === 'admin-auth' && (!currentUser || currentUser.role !== 'admin') && (
          <AdminAuthView 
            onSuccess={(user) => {
              setCurrentUser(user);
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
            onCategorySelect={(id) => { setSelectedCategoryId(id); onNavigateAction('store'); }}
          />
        )}

        <main className={`flex-grow container mx-auto px-2 md:px-4 ${isAdminView ? 'pt-4' : 'pt-24 md:pt-32'}`}>
          {view === 'store' && (
            <StoreView 
              products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId}
              onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => addToCart(p)} 
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
                onNavigateAction('order-success');
              }}
              onUpdateOrderPayment={async (id, method) => {
                if(await ApiService.updateOrderPayment(id, method)) { setNotification({message: 'تم التحديث', type: 'success'}); loadData(true); }
              }}
              onReturnOrder={async (id) => {
                if(!confirm('تأكيد الاسترجاع؟')) return;
                const res = await ApiService.returnOrder(id);
                if(res.status === 'success') { setNotification({message: 'تم الاسترجاع', type: 'success'}); loadData(true); }
              }}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onLogout={handleLogout}
              onRefreshData={() => loadData(true)}
            />
          )}

          {view === 'admin-form' && (
            <AdminProductForm 
              product={selectedProduct} categories={categories} 
              onSubmit={async (p) => {
                const success = products.find(prod => prod.id === p.id) ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
                if (success) {
                  setNotification({message: 'تم الحفظ بنجاح', type: 'success'});
                  await loadData(true);
                  setProductForBarcode(p);
                }
              }}
              onCancel={() => onNavigateAction('admin')}
            />
          )}

          {view === 'admin-invoice' && (
            <AdminInvoiceForm 
              products={products}
              onSubmit={async (order) => {
                if (await ApiService.saveOrder(order)) {
                  setLastCreatedOrder(order);
                  setNotification({message: 'تم حفظ الفاتورة', type: 'success'});
                  WhatsAppService.sendInvoiceToCustomer(order, order.phone);
                  await loadData(true);
                  onNavigateAction('order-success');
                }
              }}
              onCancel={() => onNavigateAction(currentUser?.role === 'admin' ? 'admin' : 'store')}
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
              onAddToCart={(p) => addToCart(p)}
              onBack={() => onNavigateAction('store')}
              isFavorite={wishlist.includes(selectedProduct.id)}
              onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          )}

          {view === 'order-success' && lastCreatedOrder && (
            <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('store')} />
          )}

          {view === 'checkout' && (
             <CheckoutView 
              cart={cart} currentUser={currentUser} onBack={() => onNavigateAction('cart')}
              onPlaceOrder={async (details) => {
                const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
                const order: Order = {
                  id: 'ORD-' + Date.now().toString().slice(-6),
                  customerName: details.fullName, phone: details.phone, city: 'فاقوس', address: details.address,
                  items: cart, total, subtotal: total, createdAt: Date.now(), status: 'completed', paymentMethod: 'عند الاستلام', userId: currentUser?.id
                };
                if (await ApiService.saveOrder(order)) {
                  setLastCreatedOrder(order);
                  setCart([]);
                  setNotification({message: 'تم الطلب بنجاح', type: 'success'});
                  WhatsAppService.sendOrderNotification(order, adminPhone);
                  onNavigateAction('order-success');
                  loadData(true);
                }
              }}
             />
          )}

          {view === 'my-orders' && <MyOrdersView orders={orders} onViewDetails={(o) => {setLastCreatedOrder(o); onNavigateAction('order-success');}} onBack={() => onNavigateAction('store')} />}
          {view === 'profile' && currentUser && <ProfileView currentUser={currentUser} onSuccess={handleLogout} onBack={() => onNavigateAction('store')} />}
        </main>

        {!isAdminView && (
          <>
            <FloatingCartButton count={cart.length} onClick={() => onNavigateAction('cart')} isVisible={!isAdminView} />
            <FloatingQuickInvoiceButton currentView={view} onNavigate={onNavigateAction} />
            
            {currentUser?.role === 'admin' && (
              <>
                <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />
              </>
            )}
            <MobileNav 
              currentView={view} 
              cartCount={cart.length} 
              onNavigate={onNavigateAction} 
              onCartClick={() => onNavigateAction('cart')}
              isAdmin={currentUser?.role === 'admin'}
            />
          </>
        )}
        
        {productForBarcode && (
          <BarcodePrintPopup product={productForBarcode} onClose={() => { setProductForBarcode(null); onNavigateAction('admin'); }} />
        )}
      </div>
    </PullToRefresh>
  );
};

export default App;
