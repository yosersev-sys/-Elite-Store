import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Product, CartItem, Category, Order, User, Supplier, Shift } from './types.ts';
import Header from './components/Header.tsx';
import StoreView from './components/StoreView.tsx';
import FloatingAdminButton from './components/FloatingAdminButton.tsx';
import FloatingCartButton from './components/FloatingCartButton.tsx';
import FloatingQuickInvoiceButton from './components/FloatingQuickInvoiceButton.tsx';
import Notification from './components/Notification.tsx';
import MobileNav from './components/MobileNav.tsx';
import PullToRefresh from './components/PullToRefresh.tsx';
import Footer from './components/Footer.tsx';
import { ApiService } from './services/api.ts';
import { WhatsAppService } from './services/whatsappService.ts';
import { AnalyticsTracker } from './services/analyticsTracker.ts';

// التحميل المتأخر (Lazy Loading) للمكونات الثانوية لتخفيف حجم حزمة الجافاسكريبت الأولية وتسريع فتح المتجر
const AdminDashboard = React.lazy(() => import('./admincp/AdminDashboard.tsx'));
const AdminProductForm = React.lazy(() => import('./admincp/AdminProductForm.tsx'));
const AdminInvoiceForm = React.lazy(() => import('./admincp/AdminInvoiceForm.tsx'));
const CartView = React.lazy(() => import('./components/CartView.tsx'));
const ProductDetailsView = React.lazy(() => import('./components/ProductDetailsView.tsx'));
const CheckoutView = React.lazy(() => import('./components/CheckoutView.tsx'));
const OrderSuccessView = React.lazy(() => import('./components/OrderSuccessView.tsx'));
const AuthView = React.lazy(() => import('./components/AuthView.tsx'));
const AdminAuthView = React.lazy(() => import('./components/AdminAuthView.tsx'));
const MyOrdersView = React.lazy(() => import('./components/MyOrdersView.tsx'));
const ProfileView = React.lazy(() => import('./components/ProfileView.tsx'));
const NewOrderPopup = React.lazy(() => import('./components/NewOrderPopup.tsx'));
const BarcodePrintPopup = React.lazy(() => import('./components/BarcodePrintPopup.tsx'));
const DeliveryAreasView = React.lazy(() => import('./components/DeliveryAreasView.tsx'));

const openCashDrawer = () => {
  const style = document.createElement('style');
  style.id = 'drawer-only-print-style';
  style.innerHTML = `
    @media print {
      body * {
        display: none !important;
      }
      html, body {
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      }
      #drawer-kick-container {
        display: block !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      }
    }
  `;
  document.head.appendChild(style);

  const div = document.createElement('div');
  div.id = 'drawer-kick-container';
  div.innerHTML = '&nbsp;';
  document.body.appendChild(div);

  window.print();

  setTimeout(() => {
    document.getElementById('drawer-only-print-style')?.remove();
    document.getElementById('drawer-kick-container')?.remove();
  }, 1000);
};

const App: React.FC = () => {
  // 1. تحديد المسار الحالي بدقة مطلقة (فحص الهاش والمسار معاً)
  const getInitialView = (): View => {
    const h = window.location.hash.toLowerCase();
    const p = window.location.pathname.toLowerCase();
    
    // فحص مسار صفحة التوصيل المخصصة أولاً لسرعة التحميل المحلي والـ SEO
    if (p === '/delivery-areas' || p.endsWith('/delivery-areas') || h === '#/delivery-areas' || h === '#delivery-areas') {
      return 'delivery-areas';
    }
    
    // إذا كان الرابط يحتوي على إدارة بأي شكل (هاش أو مسار)
    if (h.includes('cp') || h.includes('admin') || p.includes('admincp')) {
      if (h.includes('form')) return 'admin-form';
      if (h.includes('invoice')) return 'admin-invoice';
      return 'admincp';
    }
    
    if (h.startsWith('#/product/') || h.startsWith('#product/')) {
      return 'product-details';
    }
    
    const clean = h.replace(/^#\/?/, '').split('?')[0] as View;
    const storeViews: View[] = ['cart', 'my-orders', 'profile', 'checkout', 'quick-invoice', 'order-success', 'product-details', 'delivery-areas'];
    return storeViews.includes(clean) ? clean : 'store';
  };

  const [view, setView] = useState<View>(getInitialView());
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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newOrdersForPopup, setNewOrdersForPopup] = useState<Order[]>([]);
  const [productForBarcode, setProductForBarcode] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recentCreatedOrderFlow, setRecentCreatedOrderFlow] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [startingCashInput, setStartingCashInput] = useState('0');
  const [shiftNameInput, setShiftNameInput] = useState('');
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isLoggingOutRef = useRef(false);
  
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

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => setNotification({ message: msg, type });

  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Failed to play synthesized sound", e);
    }
  };

  // --- التحقق الحاسم من وضع "الإدارة" ---
  // نقرأ من window.location مباشرة لضمان عدم وجود تأخير في الحالة (State)
  const currentHash = window.location.hash.toLowerCase();
  const currentPath = window.location.pathname.toLowerCase();
  const isTrulyInAdminMode = currentHash.includes('admin') || currentHash.includes('cp') || currentPath.includes('admincp');
  const isAdmin = currentUser?.role === 'admin';

  // مزامنة فورية للرابط عند التغيير (قبل الرندرة)
  useLayoutEffect(() => {
    const sync = () => {
      const newV = getInitialView();
      if (newV !== view) setView(newV);
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [view]);

  useEffect(() => {
    AnalyticsTracker.trackPageView(view, view === 'product-details' && selectedProduct ? selectedProduct.id : null);
  }, [view, selectedProduct]);

  const loadData = async (silent = false, user = currentUser, ordersOnly = false) => {
    let hasCache = false;

    if (silent) {
      setIsSyncing(true);
    }

    if (!silent && !ordersOnly) {
      // 1. جلب البيانات المخزنة محلياً لعرضها فوراً وتسريع فتح التطبيق
      const local = await ApiService.getLocalState();

      if ((local as any).activeShift) {
        setActiveShift((local as any).activeShift);
      }

      if (local.products && local.products.length > 0) {
        setProducts(local.products);
        if (local.categories && local.categories.length > 0) setCategories(local.categories);
        if (local.settings && local.settings.delivery_fee) setDeliveryFee(parseFloat(local.settings.delivery_fee));
        
        if (isTrulyInAdminMode && user?.role === 'admin') {
          if (local.adminSummary) setAdminSummary(local.adminSummary);
          if (local.users && local.users.length > 0) setUsers(local.users);
          if (local.suppliers && local.suppliers.length > 0) setSuppliers(local.suppliers);
          if (local.orders && local.orders.length > 0) setOrders(local.orders);
        }
        hasCache = true;
      }

      if (hasCache) {
        setIsLoading(false);
      }
    }

    // 2. تفعيل المزامنة الصامتة في الخلفية إذا كانت البيانات مخزنة مسبقاً لمنع ظهور شريط التحميل
    const isSilent = silent || hasCache || ordersOnly;
    if (!isSilent) setIsLoading(true);

    let totalRequests = 0;
    if (ordersOnly) {
      totalRequests = (isTrulyInAdminMode && user?.role === 'admin') ? 2 : 1;
    } else {
      totalRequests = (isTrulyInAdminMode && user?.role === 'admin') ? 8 : (view === 'my-orders' && user && user.role !== 'admin') ? 5 : 4;
    }

    setLoadProgress(0);
    let completed = 0;
    const step = () => {
      completed++;
      setLoadProgress(Math.min(100, Math.round((completed / totalRequests) * 100)));
    };

    try {
      if (!ordersOnly) {
        // 3. جلب البيانات الأساسية للمتجر من السيرفر بالتوازي مع تتبع التقدم
        const p1 = ApiService.getAdminPhone().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });
        const p2 = ApiService.getProducts().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });
        const p3 = ApiService.getCategories().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });
        const p4 = ApiService.getStoreSettings().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });

        const [ph, pr, ct, st] = await Promise.all([p1, p2, p3, p4]);
        if (ph) setAdminPhone(ph.phone);
        if (st?.delivery_fee) setDeliveryFee(parseFloat(st.delivery_fee));
        
        if (pr) {
          setProducts(prev => JSON.stringify(prev) === JSON.stringify(pr) ? prev : pr);
        }
        if (ct) {
          setCategories(prev => JSON.stringify(prev) === JSON.stringify(ct) ? prev : ct);
        }
      }

      if (user?.role === 'admin') {
        try {
          const active = await ApiService.getActiveShift();
          setActiveShift(active);
        } catch (err) {
          console.warn("Failed to fetch active shift", err);
        }
      }

      // 4. جلب بيانات الإدارة من السيرفر بالتوازي مع تتبع التقدم
      if (isTrulyInAdminMode && user?.role === 'admin') {
        const p5 = ApiService.getAdminSummary().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });
        const p8 = ApiService.getOrders().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });
        
        let p6 = Promise.resolve(null);
        let p7 = Promise.resolve(null);
        
        if (!ordersOnly) {
          p6 = ApiService.getUsers().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });
          p7 = ApiService.getSuppliers().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });
        }

        const [sum, ords, usrs, sups] = await Promise.all([p5, p8, p6, p7]);
        if (sum) {
          setAdminSummary(prev => JSON.stringify(prev) === JSON.stringify(sum) ? prev : sum);
        }
        if (!ordersOnly && usrs) {
          setUsers(prev => JSON.stringify(prev) === JSON.stringify(usrs) ? prev : usrs);
        }
        if (!ordersOnly && sups) {
          setSuppliers(prev => JSON.stringify(prev) === JSON.stringify(sups) ? prev : sups);
        }
        if (ords) {
          setOrders(prev => JSON.stringify(prev) === JSON.stringify(ords) ? prev : ords);
          
          if (ords.length > 0 && prevOrderIds.current.size > 0) {
            const newOnes = ords.filter((o: Order) => !prevOrderIds.current.has(o.id) && !o.id.startsWith('INV-') && !o.id.startsWith('OFF-'));
            if (newOnes.length > 0) {
              setNewOrdersForPopup(prev => [...prev, ...newOnes]);
              if (soundEnabled) {
                playChimeSound();
              }
            }
          }
          prevOrderIds.current = new Set(ords.map((o: Order) => o.id));
        }
      } 
      // 5. جلب طلبات العميل
      else if (view === 'my-orders' && user && user.role !== 'admin') {
        const myOrds = await ApiService.getOrders().then(r => { step(); return r; }).catch(err => { console.warn(err); step(); return null; });
        if (myOrds) {
          setOrders(prev => JSON.stringify(prev) === JSON.stringify(myOrds) ? prev : myOrds);
        }
      }
      return true;
    } catch (error) {
      console.error("Error loading data:", error);
      return false;
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
      setLoadProgress(100);
    }
  };

  const updateProductInState = (p: Product) => {
    setProducts(prev => {
      const exists = prev.some(x => x.id === p.id);
      let newProducts: Product[];
      if (exists) {
        const current = prev.find(x => x.id === p.id);
        if (current && JSON.stringify(current) === JSON.stringify(p)) {
          return prev;
        }
        newProducts = prev.map(x => x.id === p.id ? p : x);
      } else {
        newProducts = [p, ...prev];
      }

      setAdminSummary((prevSummary: any) => {
        if (!prevSummary) return prevSummary;
        const lowStock = newProducts.filter(x => Number(x.stockQuantity || 0) < (x.reorderLevel !== undefined ? Number(x.reorderLevel) : 5)).length;
        const updated = {
          ...prevSummary,
          low_stock_count: lowStock
        };
        return JSON.stringify(prevSummary) === JSON.stringify(updated) ? prevSummary : updated;
      });

      return newProducts;
    });
  };

  // جلب البيانات ذكياً عند تغيير المستخدم، أو التنقل بين الواجهات، أو الدخول لوضع الإدارة
  useEffect(() => { 
    loadData(); 
  }, [currentUser?.id, view, isTrulyInAdminMode]);

  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  });

  // الاستماع لحدث انتهاء الجلسة وتنبيه المستخدم
  useEffect(() => {
    const handleSessionExpired = () => {
      if (currentUser && !isLoggingOutRef.current) {
        isLoggingOutRef.current = true;
        alert('انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى.');
        handleLogout();
      }
    };
    window.addEventListener('souq-session-expired', handleSessionExpired);
    return () => window.removeEventListener('souq-session-expired', handleSessionExpired);
  }, [currentUser]);

  // الاستماع لتغييرات التخزين لمزامنة تسجيل الخروج عبر التبويبات المختلفة
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'souq_user_profile' && !e.newValue) {
        if (currentUser) {
          setCurrentUser(null);
          setActiveShift(null);
          onNavigate('store');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  // التحقق من صحة الجلسة الحالية عند تحميل التطبيق إذا كان هناك مستخدم محفوظ
  useEffect(() => {
    const verifySession = async () => {
      if (currentUser) {
        const user = await ApiService.getCurrentUser();
        if (!user && !isLoggingOutRef.current) {
          isLoggingOutRef.current = true;
          alert('انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى.');
          handleLogout();
        }
      }
    };
    verifySession();
  }, []);

  // مراقبة شبكة الاتصال وتحديث حالة الاتصال بالإنترنت فقط دون مزامنة خلفية أو حفظ أوفلاين
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('أنت متصل الآن بالإنترنت', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification('تم قطع الاتصال بالإنترنت. يرجى التحقق من الشبكة.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // مزامنة المنتج المحدد بناءً على الهاش في الرابط (لإتاحة مشاركة الروابط والنسخ)
  useEffect(() => {
    const h = window.location.hash;
    const match = h.match(/^#\/?product\/([^\/?]+)/);
    if (match && products.length > 0) {
      const pSlug = decodeURIComponent(match[1]);
      const found = products.find(p => pSlug === p.id || pSlug.startsWith(p.id + '-'));
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, [view, products]);

  const onNavigate = (v: View, param?: any) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) { setShowAuthModal(true); return; }
    
    // إذا كان المسار الفعلي للمتصفح هو صفحة التوصيل ورغبنا بالانتقال لأي مكان آخر
    if (window.location.pathname.toLowerCase().includes('/delivery-areas')) {
      if (v === 'store') {
        window.location.href = '/';
      } else {
        window.location.href = '/#' + ((v === 'admin' || v === 'admincp') ? 'admincp' : v);
      }
      return;
    }

    let h = (v === 'admin' || v === 'admincp') ? 'admincp' : (v === 'store' ? '' : v);
    if (v === 'product-details' && param) {
      const p = param as Product;
      const slug = p.name.trim().toLowerCase().replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, '-');
      h = `product/${p.id}-${slug}`;
    }
    window.location.hash = h;
  };

  const handleOpenShiftFromBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftNameInput.trim()) {
      showNotification('يرجى إدخال اسم الوردية أولاً', 'error');
      return;
    }
    const cash = parseFloat(startingCashInput);
    if (isNaN(cash) || cash < 0) {
      showNotification('يرجى إدخال مبلغ صحيح غير سالب', 'error');
      return;
    }

    setIsOpeningShift(true);
    try {
      const res = await ApiService.openShift(cash, shiftNameInput.trim());
      if (res.success) {
        showNotification('تم فتح الوردية بنجاح.', 'success');
        setStartingCashInput('0');
        setShiftNameInput('');
        await loadData(true);
      } else {
        showNotification(res.message || 'فشل فتح الوردية', 'error');
      }
    } catch (e) {
      showNotification('حدث خطأ فني أثناء فتح الوردية', 'error');
    } finally {
      setIsOpeningShift(false);
    }
  };

  const handleAuth = (user: User) => { 
    isLoggingOutRef.current = false;
    setCurrentUser(user); 
    setShowAuthModal(false); 
    loadData(false, user); 
  };
  const handleLogout = () => { ApiService.logout(); setCurrentUser(null); setActiveShift(null); onNavigate('store'); };

  // 2. حالة "نظام المتجر" (تظهر فقط إذا لم نكن في وضع الإدارة)
  const renderStoreContent = () => {
    switch(view) {
      case 'delivery-areas': return <DeliveryAreasView onNavigate={onNavigate} />;
      case 'cart': return <CartView cart={cart} deliveryFee={deliveryFee} onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0.1, i.quantity + d)} : i))} onSetQuantity={(id, q) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: q} : i))} onRemove={(id) => { const item = cart.find(x => x.id === id); setCart(p => { const updated = p.filter(x => x.id !== id); if (item) AnalyticsTracker.trackCartEvent('remove_from_cart', item, updated); return updated; }); }} onCheckout={() => { AnalyticsTracker.trackCartEvent('checkout_start', null, cart); onNavigate('checkout'); }} onContinueShopping={() => onNavigate('store')} />;
      case 'product-details': return selectedProduct ? <ProductDetailsView product={selectedProduct} categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'} onAddToCart={(p, q) => { setCart(prev => { const ex = prev.find(x => x.id === p.id); const updated = ex ? prev.map(x => x.id === p.id ? {...x, quantity: x.quantity + q} : x) : [...prev, {...p, quantity: q}]; AnalyticsTracker.trackCartEvent('add_to_cart', p, updated); return updated; }); setNotification({message: 'تمت الإضافة للسلة', type: 'success'}); onNavigate('cart'); }} onBack={() => onNavigate('store')} isFavorite={wishlist.includes(selectedProduct.id)} onToggleFavorite={(id) => { const isFav = wishlist.includes(id); AnalyticsTracker.trackFavorite(id, isFav ? 'remove' : 'add'); setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }} /> : <div className="p-20 text-center font-bold text-gray-500">جاري تحميل تفاصيل المنتج...</div>;
       case 'checkout': return <CheckoutView cart={cart} currentUser={currentUser} deliveryFee={deliveryFee} onBack={() => onNavigate('cart')} onPlaceOrder={async (d) => { const sub = cart.reduce((s, i) => s + (i.price * i.quantity), 0); const o: Order = { id: 'ORD-' + Date.now().toString().slice(-6), customerName: d.fullName, phone: d.phone, city: 'فاقوس', address: d.address, items: cart, subtotal: sub, total: sub + deliveryFee, paymentMethod: 'عند الاستلام', status: 'pending', createdAt: Date.now(), userId: currentUser?.id, discount: 0, discountType: 'fixed', discountValue: 0, deliveryFee: deliveryFee, totalItemDiscounts: 0, subtotalBeforeDiscount: sub, finalTotal: sub + deliveryFee }; const currentCartCopy = [...cart]; if (await ApiService.saveOrder(o)) { ApiService.getOfflineQueueCount().then(setOfflineQueueCount); AnalyticsTracker.trackCartEvent('checkout_complete', null, currentCartCopy); setRecentCreatedOrderFlow(o); setCart([]); onNavigate('order-success'); loadData(true); } }} />;
      case 'order-success': return recentCreatedOrderFlow ? <OrderSuccessView order={recentCreatedOrderFlow} adminPhone={adminPhone} onContinueShopping={() => onNavigate('store')} /> : null;
      case 'my-orders': return <MyOrdersView orders={orders} onViewDetails={(o) => {setRecentCreatedOrderFlow(o); onNavigate('order-success');}} onBack={() => onNavigate('store')} />;
      case 'profile': return currentUser ? <ProfileView currentUser={currentUser} onSuccess={handleLogout} onBack={() => onNavigate('store')} /> : null;
      case 'quick-invoice': 
        if (isLoading) {
          return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-black text-slate-800 text-sm">جاري تحميل بيانات الوردية والمخزن...</p>
            </div>
          );
        }
        if (isAdmin && !activeShift) {
          return (
            <div className="flex items-center justify-center p-4 py-12">
              <form onSubmit={handleOpenShiftFromBlocker} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-slideUp border border-slate-100">
                <div className="text-center space-y-2">
                  <span className="text-5xl">🔒</span>
                  <h3 className="text-2xl font-black text-slate-800">يجب فتح وردية أولاً</h3>
                  <p className="text-slate-400 font-bold text-xs leading-relaxed">
                    لتتمكن من إنشاء فواتير سريعة، يجب بدء وردية جديدة وتحديد نقدية الدرج.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 mr-2">اسم الوردية <span className="text-rose-500">*</span> (مثال: وردية الصباح)</label>
                  <input
                    required
                    type="text"
                    value={shiftNameInput}
                    onChange={(e) => setShiftNameInput(e.target.value)}
                    placeholder="وردية الصباح، الوردية الأولى..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-sm text-center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 mr-2">نقدية بداية الوردية (الدرج)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={startingCashInput}
                    onChange={(e) => setStartingCashInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-black text-lg text-center"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    disabled={isOpeningShift}
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg disabled:opacity-50 transition-all"
                  >
                    {isOpeningShift ? 'جاري فتح الوردية...' : '🚀 فتح الوردية وبدء العمل'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('store')}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
                  >
                    العودة للمتجر
                  </button>
                </div>
              </form>
            </div>
          );
        }
        return <AdminInvoiceForm products={products} categories={categories} currentUser={currentUser} onRefreshData={() => loadData(true)} initialCustomerName={currentUser?.name} initialPhone={currentUser?.phone} globalDeliveryFee={deliveryFee} onSubmit={async (o) => { if (await ApiService.saveOrder(o)) { ApiService.getOfflineQueueCount().then(setOfflineQueueCount); setRecentCreatedOrderFlow(o); prevOrderIds.current.add(o.id); loadData(true); openCashDrawer(); onNavigate('order-success'); } }} onCancel={() => onNavigate('store')} />;
      default: return <StoreView products={products} categories={categories} searchQuery={searchQuery} onSearch={(q) => {
        setSearchQuery(q);
        const count = products.filter(p => {
          if (!p) return false;
          const name = p.name ? String(p.name).toLowerCase() : '';
          const id = p.id ? String(p.id).toLowerCase() : '';
          const query = q ? String(q).toLowerCase() : '';
          return name.includes(query) || id.includes(query);
        }).length;
        AnalyticsTracker.trackSearch(q, count);
      }} selectedCategoryId={selectedCategoryId} onCategorySelect={setSelectedCategoryId} onAddToCart={(p) => { setCart(prev => { const ex = prev.find(x => x.id === p.id); const updated = ex ? prev.map(x => x.id === p.id ? {...x, quantity: x.quantity + 1} : x) : [...prev, {...p, quantity: 1}]; AnalyticsTracker.trackCartEvent('add_to_cart', p, updated); return updated; }); setNotification({message: 'تمت الإضافة للسلة', type: 'success'}); }} onViewProduct={(p) => { setSelectedProduct(p); onNavigate('product-details', p); }} wishlist={wishlist} onToggleFavorite={(id) => { const isFav = wishlist.includes(id); AnalyticsTracker.trackFavorite(id, isFav ? 'remove' : 'add'); setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }} />;
    }
  };

  // 1. حالة "نظام الإدارة" (تظهر بشكل قاطع إذا طلب الرابط ذلك)
  if (isTrulyInAdminMode) {
    if (!isAdmin) {
      return (
        <React.Suspense fallback={<div className="flex justify-center p-8 text-gray-500">جاري التحميل...</div>}>
          <AdminAuthView onSuccess={handleAuth} onClose={() => { window.location.hash = ''; setView('store'); }} />
        </React.Suspense>
      );
    }
    
    return (
      <React.Suspense fallback={<div className="flex justify-center p-8 text-gray-500">جاري التحميل...</div>}>
        <div className="min-h-screen bg-slate-50 pt-2 px-2 md:px-4">
          {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
          {newOrdersForPopup.length > 0 && <NewOrderPopup orders={newOrdersForPopup} onClose={(id) => setNewOrdersForPopup(p => p.filter(o => o.id !== id))} onView={(o) => { setRecentCreatedOrderFlow(o); onNavigate('order-success'); }} />}
          {productForBarcode && <BarcodePrintPopup product={productForBarcode} onClose={() => { setProductForBarcode(null); onNavigate('admincp'); }} />}
          
          {view === 'admin-form' ? (
            <AdminProductForm product={selectedProduct} categories={categories} suppliers={suppliers} onSubmit={async (p) => {
              try {
                const res = products.some(x => x.id === p.id) ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
                if (res.success) {
                  const savedProduct = res.product || p;
                  updateProductInState(savedProduct);
                  setProductForBarcode(savedProduct);

                  loadData(true).then((syncSuccess) => {
                    if (!syncSuccess) {
                      showNotification('تم حفظ البيانات، ولكن تعذر تحديث البيانات من الخادم، وسيتم إعادة المزامنة لاحقاً.', 'error');
                    }
                  }).catch((err) => {
                    console.error("Silent background sync failed:", err);
                    showNotification('تم حفظ البيانات، ولكن تعذر تحديث البيانات من الخادم، وسيتم إعادة المزامنة لاحقاً.', 'error');
                  });
                } else {
                  showNotification(res.message || 'حدث خطأ أثناء حفظ المنتج', 'error');
                }
              } catch (err) {
                console.error("Optimistic update submit error:", err);
                showNotification('حدث خطأ تقني أثناء محاولة حفظ المنتج.', 'error');
              }
            }} onCancel={() => onNavigate('admincp')} onRefreshData={() => loadData(true)} />
          ) : view === 'admin-invoice' ? (
            isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-slate-800 text-sm animate-pulse">جاري تحميل بيانات الوردية والمخزن...</p>
              </div>
            ) : !activeShift ? (
              <div className="min-h-screen bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleOpenShiftFromBlocker} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-slideUp border border-slate-100">
                  <div className="text-center space-y-2">
                    <span className="text-5xl">🔒</span>
                    <h3 className="text-2xl font-black text-slate-800">يجب فتح وردية أولاً</h3>
                    <p className="text-slate-400 font-bold text-xs leading-relaxed">
                      لتتمكن من إنشاء فواتير أو تعديل المبيعات، يجب بدء وردية جديدة وتحديد نقدية الدرج.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 mr-2">اسم الوردية <span className="text-rose-500">*</span> (مثال: وردية الصباح)</label>
                    <input
                      required
                      type="text"
                      value={shiftNameInput}
                      onChange={(e) => setShiftNameInput(e.target.value)}
                      placeholder="وردية الصباح، الوردية الأولى..."
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-bold text-sm text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 mr-2">نقدية بداية الوردية (الدرج)</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={startingCashInput}
                      onChange={(e) => setStartingCashInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 font-black text-lg text-center"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      disabled={isOpeningShift}
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg disabled:opacity-50 transition-all"
                    >
                      {isOpeningShift ? 'جاري فتح الوردية...' : '🚀 فتح الوردية وبدء العمل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('admincp')}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
                    >
                      العودة للوحة التحكم
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <AdminInvoiceForm products={products} users={users} orders={orders} categories={categories} currentUser={currentUser} onRefreshData={() => loadData(true)} initialCustomerName={currentUser?.name} initialPhone={currentUser?.phone} globalDeliveryFee={deliveryFee} order={editingOrder} onSubmit={async (o) => { const s = editingOrder ? await ApiService.updateOrder(o) : await ApiService.saveOrder(o); if (s) { setRecentCreatedOrderFlow(o); prevOrderIds.current.add(o.id); loadData(true); if (!editingOrder) { openCashDrawer(); } onNavigate('order-success'); } }} onCancel={() => { setEditingOrder(null); onNavigate('admincp'); }} />
            )
          ) : (
            <AdminDashboard 
              products={products} categories={categories} orders={orders} users={users} suppliers={suppliers} currentUser={currentUser} isLoading={isLoading} adminSummary={adminSummary}
              isOnline={isOnline} offlineQueueCount={offlineQueueCount} loadProgress={loadProgress} isSyncing={isSyncing}
              onPrintBarcode={(p) => setProductForBarcode(p)}
              onSyncOffline={async () => {
                showNotification('جاري المزامنة...', 'success');
                const syncResult = await ApiService.syncOfflineData();
                setOfflineQueueCount(syncResult.remainingCount);
                if (syncResult.syncedCount > 0) {
                  showNotification(`تم مزامنة ${syncResult.syncedCount} فاتورة بنجاح.`, 'success');
                  loadData(true);
                } else if (syncResult.remainingCount > 0) {
                   const firstErr = syncResult.errors && syncResult.errors.length > 0 ? String(syncResult.errors[0]) : '';
                   showNotification(`فشلت المزامنة: ${firstErr || 'تحقق من الاتصال'}`, 'error');
                } else {
                   showNotification('لا توجد فواتير معلقة.', 'success');
                }
              }}
              onOpenAddForm={() => { setSelectedProduct(null); onNavigate('admin-form'); }}
              onOpenEditForm={(p) => { setSelectedProduct(p); onNavigate('admin-form'); }}
              onOpenInvoiceForm={() => { setEditingOrder(null); onNavigate('admin-invoice'); }}
              onEditOrder={(o) => { setEditingOrder(o); onNavigate('admin-invoice'); }}
              onDeleteProduct={async (id) => {
                setProducts(prev => prev.filter(p => p.id !== id));
                const ok = await ApiService.deleteProduct(id);
                if (!ok) showNotification('فشل حذف المنتج من السيرفر', 'error');
                loadData(true);
              }}
              onAddCategory={async (c) => { if(await ApiService.addCategory(c)) loadData(true); }}
              onUpdateCategory={async (c) => { if(await ApiService.updateCategory(c)) loadData(true); }}
              onDeleteCategory={async (id) => {
                setCategories(prev => prev.filter(c => c.id !== id));
                const ok = await ApiService.deleteCategory(id);
                if (!ok) showNotification('فشل حذف القسم من السيرفر', 'error');
                loadData(true);
              }}
              onViewOrder={(o) => { setRecentCreatedOrderFlow(o); onNavigate('order-success'); }}
              onUpdateOrderPayment={async (id, m) => {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'completed' as any, paymentMethod: m } : o));
                const ok = await ApiService.updateOrderPayment(id, m);
                if (!ok) showNotification('فشل تأكيد استلام النقدية على السيرفر', 'error');
                else showNotification('تم تأكيد الدفع واستلام النقدية بنجاح.', 'success');
                loadData(true);
              }}
              onReturnOrder={async (id) => {
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as any } : o));
                const res = await ApiService.returnOrder(id);
                if (res && res.status === 'error') {
                  showNotification('فشل استرجاع الفاتورة: ' + (res.message || 'خطأ غير معروف'), 'error');
                } else {
                  showNotification('تم استرجاع الفاتورة وإعادة الكميات للمخزن بنجاح.', 'success');
                }
                loadData(true);
              }}
              onDeleteUser={async (id) => {
                setUsers(prev => prev.filter(u => u.id !== id));
                const ok = await ApiService.deleteUser(id);
                if (!ok) showNotification('فشل حذف المستخدم من السيرفر', 'error');
                loadData(true);
              }}
              soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onLogout={handleLogout} onRefreshData={() => loadData(true)}
            />
          )}
        </div>
      </React.Suspense>
    );
  }

  return (
    <PullToRefresh onRefresh={() => loadData(true)}>
      <div className="min-h-screen flex flex-col bg-[#f8fafc] pb-24 md:pb-0">
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        <React.Suspense fallback={<div className="flex justify-center p-8 text-gray-500">جاري التحميل...</div>}>
          {showAuthModal && <AuthView onClose={() => setShowAuthModal(false)} onSuccess={handleAuth} />}
        </React.Suspense>
        
        <Header 
          cartCount={cart.length} wishlistCount={wishlist.length} categories={categories} currentUser={currentUser}
          onNavigate={onNavigate} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout}
          onSearch={(q) => {
            setSearchQuery(q);
            const count = products.filter(p => {
              if (!p) return false;
              const name = p.name ? String(p.name).toLowerCase() : '';
              const id = p.id ? String(p.id).toLowerCase() : '';
              const query = q ? String(q).toLowerCase() : '';
              return name.includes(query) || id.includes(query);
            }).length;
            AnalyticsTracker.trackSearch(q, count);
          }} onCategorySelect={(id) => { setSelectedCategoryId(id); onNavigate('store'); }}
        />

        <main className="flex-grow container mx-auto px-2 md:px-4 pt-24 md:pt-32">
          <React.Suspense fallback={<div className="flex justify-center p-8 text-gray-500">جاري التحميل...</div>}>
            {renderStoreContent()}
          </React.Suspense>
        </main>

        <Footer categories={categories} onNavigate={onNavigate} onCategorySelect={setSelectedCategoryId} />
        <FloatingCartButton count={cart.length} onClick={() => onNavigate('cart')} isVisible={true} />
        <FloatingQuickInvoiceButton currentView={view} onNavigate={onNavigate} />
        {isAdmin && <FloatingAdminButton currentView={view} onNavigate={onNavigate} />}
        <MobileNav currentView={view} cartCount={cart.length} onNavigate={onNavigate} onCartClick={() => onNavigate('cart')} isAdmin={isAdmin} />
      </div>
    </PullToRefresh>
  );
};

export default App;