
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
import { ApiService } from './services/api.ts';
import { WhatsAppService } from './services/whatsappService.ts';

// رابط صوت تنبيه عالي الوضوح
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
  const [users, setUsers] = useState<User[]>([]);
  
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
  
  const prevOrdersCount = useRef<number>(-1);
  const audioObj = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sound_enabled') === 'true';
  });

  // تهيئة كائن الصوت
  useEffect(() => {
    if (!audioObj.current) {
      audioObj.current = new Audio(NOTIFICATION_SOUND_URL);
      audioObj.current.load();
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioObj.current) return;
    
    // إعادة الصوت للبداية وتشغيله
    audioObj.current.currentTime = 0;
    audioObj.current.play().catch(err => {
      console.warn("تنبيه: المتصفح منع تشغيل الصوت تلقائياً. يرجى التفاعل مع الصفحة أولاً.", err);
    });
  }, [soundEnabled]);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

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
        
        if (user.role === 'admin') {
          const fetchedUsers = await ApiService.getUsers();
          setUsers(fetchedUsers || []);
          
          // اكتشاف الطلب الجديد
          if (isSilent && prevOrdersCount.current !== -1 && newOrdersList.length > prevOrdersCount.current) {
            playNotificationSound();
            showNotify('🛍️ طلب جديد وصل للمتجر!', 'success');
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          }
          
          prevOrdersCount.current = newOrdersList.length;
        }
        setOrders(newOrdersList);
      }
      
      if (!isSilent) syncViewWithHash(user);
    } catch (err) {
      console.error("Data loading error:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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

  useEffect(() => {
    const handleHashChange = () => syncViewWithHash(currentUser);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, syncViewWithHash]);

  useEffect(() => {
    let interval: any;
    if (currentUser?.role === 'admin') {
      interval = setInterval(() => { loadData(true); }, 15000);
    }
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.role, soundEnabled]); // إعادة التشغيل عند تغيير حالة الصوت لضمان التزامن

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('sound_enabled', newState.toString());
    
    // محاولة تشغيل الصوت فوراً لاختباره ومنح الإذن للمتصفح
    if (newState && audioObj.current) {
      audioObj.current.play().then(() => {
        audioObj.current?.pause();
        audioObj.current!.currentTime = 0;
        showNotify('تم تفعيل جرس التنبيهات 🔔');
      }).catch(() => {
        showNotify('فشل تفعيل الصوت، اضغط مرة أخرى', 'error');
      });
    } else {
      showNotify('تم إيقاف التنبيهات الصوتية 🔇');
    }
  };

  const onNavigateAction = (v: View) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
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
    setUsers([]);
    prevOrdersCount.current = -1;
    showNotify('تم تسجيل الخروج بنجاح');
    onNavigateAction('store');
  };

  const addToCart = (product: Product, startRect?: DOMRect) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showNotify('تمت الإضافة للسلة');
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

  const handleReturnOrder = async (id: string) => {
    if (!confirm('هل أنت متأكد من استرداد هذه الفاتورة؟ سيتم إعادة الكميات للمخزن وإلغاء الربح.')) return;
    const res = await ApiService.returnOrder(id);
    if (res.status === 'success') {
      showNotify('تم استرداد الفاتورة بنجاح ↩️');
      loadData(true);
    } else {
      showNotify(res.message || 'فشل عملية الاسترداد', 'error');
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
    <PullToRefresh onRefresh={() => loadData(true)}>
      <div className={`min-h-screen flex flex-col bg-[#f8fafc] ${isAdminView ? '' : 'pb-32 md:pb-0'}`}>
        {notification && (
          <div className="no-print">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
          </div>
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
          <div className="no-print">
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
          </div>
        )}

        <main className={`flex-grow container mx-auto px-2 md:px-4 ${isAdminView ? 'pt-4' : 'pt-16 md:pt-32'} ${view === 'order-success' ? 'print-full-width' : ''}`}>
          {view === 'store' && (
            <StoreView 
              products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId}
              onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={addToCart} 
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
              onReturnOrder={handleReturnOrder}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
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
                } else {
                  showNotify('عذراً، فشل الاتصال بالسيرفر أو تكرار باركود', 'error');
                }
              }}
              onCancel={() => onNavigateAction('admin')}
            />
          )}

          {(view === 'admin-invoice' || view === 'quick-invoice') && (
            <AdminInvoiceForm 
              products={products}
              initialCustomerName={currentUser ? currentUser.name : 'عميل زائر'}
              initialPhone={currentUser ? currentUser.phone : ''}
              onSubmit={async (order) => {
                if (currentUser) order.userId = currentUser.id;
                const success = await ApiService.saveOrder(order);
                if (success) {
                  setLastCreatedOrder(order);
                  const isOffline = order.id.startsWith('OFF-');
                  showNotify(isOffline ? 'تم حفظ الطلب محلياً (أوفلاين)' : 'تم إرسال الطلب بنجاح');
                  if (!isOffline) WhatsAppService.sendInvoiceToCustomer(order, order.phone);
                  await loadData();
                  onNavigateAction('order-success');
                } else {
                  showNotify('فشل حفظ الطلب', 'error');
                }
              }}
              onCancel={() => onNavigateAction(view === 'admin-invoice' ? 'admin' : 'store')}
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
              onAddToCart={(p, s, c, rect) => addToCart(p, rect)}
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

        {!isAdminView && (
          <div className="no-print">
            <FloatingCartButton count={cart.length} onClick={() => onNavigateAction('cart')} isVisible={view !== 'cart' && view !== 'checkout'} />
            <FloatingQuickInvoiceButton currentView={view} onNavigate={onNavigateAction} />
          </div>
        )}

        {currentUser?.role === 'admin' && view !== 'admin' && (
          <div className="no-print">
            <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />
          </div>
        )}

        {!isAdminView && (
          <div className="no-print">
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
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

export default App;
