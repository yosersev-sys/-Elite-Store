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

// تعريف المسارات الخاصة بالإدارة بشكل صارم
const ADMIN_VIEWS: View[] = ['admin', 'admincp', 'admin-form', 'admin-invoice', 'admin-auth'];

const App: React.FC = () => {
  // دالة محسنة لاستخراج المسار من الرابط
  const parseViewFromHash = (): View => {
    const hash = window.location.hash.toLowerCase();
    
    // التحقق الصارم: إذا وجدنا admin في الرابط بأي شكل
    if (hash.includes('admincp') || hash.includes('admin-form') || hash.includes('admin-invoice')) {
      if (hash.includes('form')) return 'admin-form';
      if (hash.includes('invoice')) return 'admin-invoice';
      return 'admincp';
    }
    
    const cleanHash = hash.replace(/^#\/?/, '').split('?')[0] as View;
    const publicViews: View[] = ['cart', 'my-orders', 'profile', 'checkout', 'quick-invoice', 'order-success', 'product-details'];
    
    if (publicViews.includes(cleanHash)) return cleanHash;
    return 'store';
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('souq_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [view, setView] = useState<View>(() => parseViewFromHash());
  const [adminPhone, setAdminPhone] = useState('201026034170'); 
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [adminSummary, setAdminSummary] = useState<any>(null);
  
  const [newOrdersForPopup, setNewOrdersForPopup] = useState<Order[]>([]);
  const [productForBarcode, setProductForBarcode] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
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
  const [soundEnabled, setSoundEnabled] = useState(true);

  // تحديث الحالة فور تغير الرابط
  useEffect(() => {
    const handleHashChange = () => {
      const nextView = parseViewFromHash();
      setView(nextView);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadData = async (isSilent: boolean = false, forcedUser?: User | null) => {
    try {
      if (!isSilent) setIsLoading(true);
      let activeUser = forcedUser !== undefined ? forcedUser : currentUser;
      
      const [adminInfo, fetchedProducts, fetchedCats, storeSettings] = await Promise.all([
        ApiService.getAdminPhone(),
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getStoreSettings()
      ]);
      
      if (adminInfo?.phone) setAdminPhone(adminInfo.phone);
      if (storeSettings?.delivery_fee) setDeliveryFee(parseFloat(storeSettings.delivery_fee));
      setProducts(fetchedProducts || []);
      setCategories(fetchedCats || []);
      
      if (activeUser?.role === 'admin') {
        const [summary, fetchedUsers, fetchedSuppliers] = await Promise.all([
          ApiService.getAdminSummary(),
          ApiService.getUsers(),
          ApiService.getSuppliers()
        ]);
        setAdminSummary(summary);
        setUsers(fetchedUsers || []);
        setSuppliers(fetchedSuppliers || []);
      }

      if (activeUser) {
        const fetchedOrders = await ApiService.getOrders();
        setOrders(fetchedOrders || []);
        if (activeUser.role === 'admin' && fetchedOrders?.length > 0) {
          if (prevOrderIds.current.size > 0) {
            const trulyNew = fetchedOrders.filter((o: Order) => !prevOrderIds.current.has(o.id));
            if (trulyNew.length > 0) {
              setNewOrdersForPopup(prev => [...prev, ...trulyNew]);
            }
          }
          prevOrderIds.current = new Set(fetchedOrders.map((o: Order) => o.id));
        }
      }
    } catch (err) {
      console.error("Load Error:", err);
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
  }, [currentUser?.id]);

  const onNavigateAction = (v: View) => {
    if ((v === 'profile' || v === 'my-orders') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
    window.location.hash = (v === 'store') ? '' : v;
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setCurrentUser(null);
    setOrders([]);
    onNavigateAction('store');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    loadData(false, user); 
  };

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? {...item, quantity: Number((item.quantity + qty).toFixed(3))} : item);
      }
      return [...prev, { ...product, quantity: Number(qty.toFixed(3)) }];
    });
    setNotification({ message: 'تمت الإضافة للسلة', type: 'success' });
  };

  const updateCartQuantity = (id: string, newQty: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Number(Math.max(0.001, newQty).toFixed(3)) } : item
    ));
  };

  useEffect(() => {
    localStorage.setItem('souq_cart', JSON.stringify(cart));
  }, [cart]);

  // تحديد ما إذا كان المسار الحالي يخص الإدارة
  const isAdminPath = ADMIN_VIEWS.includes(view);
  const isActuallyAdmin = currentUser?.role === 'admin';

  // منطق العرض الشرطي الرئيسي لضمان الفصل التام
  const renderContent = () => {
    // 1. إذا كان المسار للإدارة ولكن المستخدم ليس مديراً -> شاشة تسجيل دخول المدير
    if (isAdminPath && !isActuallyAdmin) {
      return <AdminAuthView onSuccess={handleAuthSuccess} onClose={() => onNavigateAction('store')} />;
    }

    // 2. إذا كان مديراً وفي مسار الإدارة -> لوحة التحكم
    if (isAdminPath && isActuallyAdmin) {
      switch(view) {
        case 'admin-form':
          return (
            <AdminProductForm 
              product={selectedProduct} categories={categories} suppliers={suppliers}
              onSubmit={async (p) => {
                const success = products.find(prod => prod.id === p.id) ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
                if (success) { loadData(true); setProductForBarcode(p); }
              }}
              onCancel={() => onNavigateAction('admincp')}
            />
          );
        case 'admin-invoice':
          return (
            <AdminInvoiceForm 
              products={products} initialCustomerName={currentUser?.name || 'عميل نقدي'} initialPhone={currentUser?.phone || ''}
              globalDeliveryFee={deliveryFee} order={editingOrder}
              onSubmit={async (order) => {
                const success = editingOrder ? await ApiService.updateOrder(order) : await ApiService.saveOrder(order);
                if (success) { setLastCreatedOrder(order); loadData(true); onNavigateAction('order-success'); }
              }}
              onCancel={() => { setEditingOrder(null); onNavigateAction('admincp'); }}
            />
          );
        default:
          return (
            <AdminDashboard 
              products={products} categories={categories} orders={orders} users={users} suppliers={suppliers} currentUser={currentUser}
              isLoading={isLoading} adminSummary={adminSummary}
              onOpenAddForm={() => { setSelectedProduct(null); onNavigateAction('admin-form'); }}
              onOpenEditForm={(p) => { setSelectedProduct(p); onNavigateAction('admin-form'); }}
              onOpenInvoiceForm={() => { setEditingOrder(null); onNavigateAction('admin-invoice'); }}
              onEditOrder={(order) => { setEditingOrder(order); onNavigateAction('admin-invoice'); }}
              onDeleteProduct={async (id) => { if(await ApiService.deleteProduct(id)) loadData(true); }}
              onAddCategory={async (c) => { if(await ApiService.addCategory(c)) loadData(true); }}
              onUpdateCategory={async (c) => { if(await ApiService.updateCategory(c)) loadData(true); }}
              onDeleteCategory={async (id) => { if(await ApiService.deleteCategory(id)) loadData(true); }}
              onViewOrder={(order) => { setLastCreatedOrder(order); onNavigateAction('order-success'); }}
              onUpdateOrderPayment={(id, method) => ApiService.updateOrderPayment(id, method).then(() => loadData(true))}
              onReturnOrder={async (id) => { if(await ApiService.returnOrder(id)) loadData(true); }}
              onDeleteUser={async (id) => { if(await ApiService.deleteUser(id)) loadData(true); }}
              soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onLogout={handleLogout} onRefreshData={() => loadData(true)}
            />
          );
      }
    }

    // 3. واجهة المتجر العامة
    switch(view) {
      case 'cart':
        return <CartView cart={cart} deliveryFee={deliveryFee} onUpdateQuantity={(id, d) => updateCartQuantity(id, cart.find(i => i.id === id)!.quantity + d)} onSetQuantity={updateCartQuantity} onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))} onCheckout={() => onNavigateAction('checkout')} onContinueShopping={() => onNavigateAction('store')} />;
      case 'product-details':
        return selectedProduct ? <ProductDetailsView product={selectedProduct} categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'} onAddToCart={(p, qty) => addToCart(p, qty)} onBack={() => onNavigateAction('store')} isFavorite={wishlist.includes(selectedProduct.id)} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} /> : null;
      case 'checkout':
        return <CheckoutView cart={cart} currentUser={currentUser} onBack={() => onNavigateAction('cart')} deliveryFee={deliveryFee} onPlaceOrder={async (details) => { const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0); const order: Order = { id: 'ORD-' + Date.now().toString().slice(-6), customerName: details.fullName, phone: details.phone, city: 'فاقوس', address: details.address, items: cart, total: subtotal + deliveryFee, subtotal, createdAt: Date.now(), status: 'completed', paymentMethod: 'عند الاستلام', userId: currentUser?.id }; if (await ApiService.saveOrder(order)) { setLastCreatedOrder(order); setCart([]); onNavigateAction('order-success'); loadData(true); WhatsAppService.sendOrderNotification(order, adminPhone); } }} />;
      case 'order-success':
        return lastCreatedOrder ? <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('store')} /> : null;
      case 'my-orders':
        return <MyOrdersView orders={orders} onViewDetails={(o) => {setLastCreatedOrder(o); onNavigateAction('order-success');}} onBack={() => onNavigateAction('store')} />;
      case 'profile':
        return currentUser ? <ProfileView currentUser={currentUser} onSuccess={handleLogout} onBack={() => onNavigateAction('store')} /> : null;
      case 'quick-invoice':
        return <AdminInvoiceForm products={products} initialCustomerName={currentUser?.name || 'عميل نقدي'} initialPhone={currentUser?.phone || ''} globalDeliveryFee={deliveryFee} onSubmit={async (order) => { if (await ApiService.saveOrder(order)) { setLastCreatedOrder(order); loadData(true); onNavigateAction('order-success'); } }} onCancel={() => onNavigateAction('store')} />;
      default:
        return <StoreView products={products} categories={categories} searchQuery={searchQuery} onSearch={setSearchQuery} selectedCategoryId={selectedCategoryId} onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => addToCart(p)} onViewProduct={(p) => { setSelectedProduct(p); onNavigateAction('product-details'); }} wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} />;
    }
  };

  return (
    <PullToRefresh onRefresh={() => loadData(true)}>
      <div className={`min-h-screen flex flex-col bg-[#f8fafc] ${isAdminPath ? '' : 'pb-24 md:pb-0'}`}>
        {isActuallyAdmin && newOrdersForPopup.length > 0 && (
          <NewOrderPopup 
            orders={newOrdersForPopup} 
            onClose={(id) => setNewOrdersForPopup(prev => prev.filter(o => o.id !== id))}
            onView={(order) => { setLastCreatedOrder(order); onNavigateAction('order-success'); }}
          />
        )}

        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        
        {/* النماذج المنبثقة العامة */}
        {showAuthModal && <AuthView onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />}
        {productForBarcode && <BarcodePrintPopup product={productForBarcode} onClose={() => { setProductForBarcode(null); onNavigateAction('admincp'); }} />}

        {/* الهيدر يظهر فقط في المتجر */}
        {!isAdminPath && (
          <Header 
            cartCount={cart.length} wishlistCount={wishlist.length} categories={categories} currentUser={currentUser}
            onNavigate={onNavigateAction} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout}
            onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); onNavigateAction('store'); }}
          />
        )}

        <main className={`flex-grow container mx-auto px-2 md:px-4 ${isAdminPath ? 'pt-4' : 'pt-24 md:pt-32'}`}>
          {renderContent()}
        </main>

        {/* الفوتر وأزرار التحكم تظهر فقط في المتجر */}
        {!isAdminPath && (
          <>
            <Footer categories={categories} onNavigate={onNavigateAction} onCategorySelect={setSelectedCategoryId} />
            <FloatingCartButton count={cart.length} onClick={() => onNavigateAction('cart')} isVisible={!isAdminPath} />
            <FloatingQuickInvoiceButton currentView={view} onNavigate={onNavigateAction} />
            {isActuallyAdmin && <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />}
            <MobileNav currentView={view} cartCount={cart.length} onNavigate={onNavigateAction} onCartClick={() => onNavigateAction('cart')} isAdmin={isActuallyAdmin} />
          </>
        )}
      </div>
    </PullToRefresh>
  );
};

export default App;