
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
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

  // تهيئة الصوت وفك القفل عند أول تفاعل
  useEffect(() => {
    if (!audioObj.current) {
      audioObj.current = new Audio(NOTIFICATION_SOUND_URL);
      audioObj.current.load();
    }

    const unlockAudio = () => {
      if (audioObj.current && !isAudioUnlocked) {
        audioObj.current.play().then(() => {
          audioObj.current!.pause();
          audioObj.current!.currentTime = 0;
          setIsAudioUnlocked(true);
          console.log("Audio Unlocked for Manager");
        }).catch(() => {});
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [isAudioUnlocked]);

  const playNotificationSound = useCallback(() => {
    // تشغيل الصوت فقط إذا كان المستخدم أدمن والصوت مفعّل
    if (currentUser?.role !== 'admin' || !soundEnabled || !audioObj.current) return;
    
    audioObj.current.currentTime = 0;
    const playPromise = audioObj.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => console.error("Sound play failed:", e));
    }
  }, [soundEnabled, currentUser]);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const loadData = async (isSilent: boolean = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      
      const [user, adminInfo, fetchedProducts, fetchedCats] = await Promise.all([
        ApiService.getCurrentUser(),
        ApiService.getAdminPhone(),
        ApiService.getProducts(),
        ApiService.getCategories()
      ]);

      setCurrentUser(user);
      if (adminInfo?.phone) setAdminPhone(adminInfo.phone);
      setProducts(fetchedProducts);
      setCategories(fetchedCats);
      
      if (user) {
        const fetchedOrders = await ApiService.getOrders();
        
        // التحقق من وجود طلبات جديدة للمدير حصراً
        if (user.role === 'admin') {
          if (prevOrderIds.current.size > 0) {
            const trulyNew = fetchedOrders.filter(o => !prevOrderIds.current.has(o.id));
            if (trulyNew.length > 0) {
              playNotificationSound();
              setNewOrdersForPopup(prev => [...prev, ...trulyNew]);
            }
          }
          prevOrderIds.current = new Set(fetchedOrders.map(o => o.id));
          
          const fetchedUsers = await ApiService.getUsers();
          setUsers(fetchedUsers);
        }
        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error("Data loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث البيانات تلقائياً كل 30 ثانية للمدير فقط
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (currentUser?.role === 'admin') {
        loadData(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.role]);

  const onNavigateAction = (v: View) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (v === 'admin' || v === 'admin-invoice' || v === 'quick-invoice') {
      loadData(true);
    }
    if (v === 'quick-invoice') {
      setView('admin-invoice');
    } else {
      setView(v);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setCurrentUser(null);
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
    showNotify('تمت الإضافة للسلة');
  };

  useEffect(() => {
    localStorage.setItem('souq_cart', JSON.stringify(cart));
  }, [cart]);

  const isAdminView = view === 'admin' || view === 'admin-auth' || view === 'admin-form' || view === 'admin-invoice';

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
                  if(await ApiService.deleteProduct(id)) { showNotify('تم الحذف'); loadData(true); }
              }}
              onAddCategory={async (c) => { 
                  if(await ApiService.addCategory(c)) { showNotify('تم الإضافة'); loadData(true); }
              }}
              onUpdateCategory={async (c) => { 
                  if(await ApiService.updateCategory(c)) { showNotify('تم التحديث'); loadData(true); }
              }}
              onDeleteCategory={async (id) => { 
                  if(await ApiService.deleteCategory(id)) { showNotify('تم الحذف'); loadData(true); }
              }}
              onViewOrder={(order) => {
                setLastCreatedOrder(order);
                onNavigateAction('order-success');
              }}
              onUpdateOrderPayment={async (id, method) => {
                if(await ApiService.updateOrderPayment(id, method)) { showNotify('تم التحديث'); loadData(true); }
              }}
              onReturnOrder={async (id) => {
                if(!confirm('تأكيد الاسترجاع؟')) return;
                const res = await ApiService.returnOrder(id);
                if(res.status === 'success') { showNotify('تم الاسترجاع'); loadData(true); }
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
                  showNotify('تم الحفظ');
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
                  playNotificationSound(); 
                  showNotify('تم حفظ الفاتورة');
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
                  showNotify('تم الطلب بنجاح');
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
