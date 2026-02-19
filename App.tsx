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
  const audioObj = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const loadData = async (isSilent: boolean = false, forcedUser?: User | null) => {
    try {
      if (!isSilent) setIsLoading(true);
      let activeUser = forcedUser !== undefined ? forcedUser : currentUser;
      
      // Fixed: Parallelized core data fetching using destructuring to ensure correct types for each variable.
      // This avoids the issue where properties like 'phone' or 'delivery_fee' weren't found on a mixed results array.
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
        // Fixed: Fetch admin-specific data in a separate parallel call to maintain strong typing.
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
              if (soundEnabled && audioObj.current) audioObj.current.play().catch(e => {});
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
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setCurrentUser(null);
    setOrders([]);
    setView('store');
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

  const isAdminPath = ADMIN_VIEWS.includes(view);
  const isActuallyAdmin = currentUser?.role === 'admin';

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
        {isAdminPath && !isActuallyAdmin && <AdminAuthView onSuccess={handleAuthSuccess} onClose={() => setView('store')} />}
        {showAuthModal && <AuthView onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />}

        {!isAdminPath && (
          <Header 
            cartCount={cart.length} wishlistCount={wishlist.length} categories={categories} currentUser={currentUser}
            onNavigate={onNavigateAction} onLoginClick={() => setShowAuthModal(true)} onLogout={handleLogout}
            onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); setView('store'); }}
          />
        )}

        <main className={`flex-grow container mx-auto px-2 md:px-4 ${isAdminPath ? 'pt-4' : 'pt-24 md:pt-32'}`}>
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
              isLoading={isLoading} adminSummary={adminSummary}
              onOpenAddForm={() => { setSelectedProduct(null); setView('admin-form'); }}
              onOpenEditForm={(p) => { setSelectedProduct(p); setView('admin-form'); }}
              onOpenInvoiceForm={() => { setEditingOrder(null); setView('admin-invoice'); }}
              onEditOrder={(order) => { setEditingOrder(order); setView('admin-invoice'); }}
              onDeleteProduct={async (id) => { if(await ApiService.deleteProduct(id)) loadData(true); }}
              onAddCategory={async (c) => { if(await ApiService.addCategory(c)) loadData(true); }}
              onUpdateCategory={async (c) => { if(await ApiService.updateCategory(c)) loadData(true); }}
              onDeleteCategory={async (id) => { if(await ApiService.deleteCategory(id)) loadData(true); }}
              onViewOrder={(order) => { setLastCreatedOrder(order); setView('order-success'); }}
              onUpdateOrderPayment={(id, method) => ApiService.updateOrderPayment(id, method).then(() => loadData(true))}
              onReturnOrder={async (id) => { if(await ApiService.returnOrder(id)) loadData(true); }}
              onDeleteUser={async (id) => { if(await ApiService.deleteUser(id)) loadData(true); }}
              soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onLogout={handleLogout} onRefreshData={() => loadData(true)}
            />
          )}

          {view === 'admin-form' && isActuallyAdmin && (
            <AdminProductForm 
              product={selectedProduct} categories={categories} suppliers={suppliers}
              onSubmit={async (p) => {
                const success = products.find(prod => prod.id === p.id) ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
                if (success) { loadData(true); setProductForBarcode(p); }
              }}
              onCancel={() => setView('admin')}
            />
          )}

          {(view === 'admin-invoice' || view === 'quick-invoice') && (
            <AdminInvoiceForm 
              products={products} initialCustomerName={currentUser?.name || 'عميل نقدي'} initialPhone={currentUser?.phone || ''}
              globalDeliveryFee={deliveryFee} order={editingOrder}
              onSubmit={async (order) => {
                const success = editingOrder ? await ApiService.updateOrder(order) : await ApiService.saveOrder(order);
                if (success) { setLastCreatedOrder(order); loadData(true); setView('order-success'); }
              }}
              onCancel={() => { setEditingOrder(null); setView(isActuallyAdmin ? 'admin' : 'store'); }}
            />
          )}

          {view === 'cart' && (
            <CartView 
              cart={cart} deliveryFee={deliveryFee}
              onUpdateQuantity={(id, d) => updateCartQuantity(id, cart.find(i => i.id === id)!.quantity + d)}
              onSetQuantity={updateCartQuantity} onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
              onCheckout={() => setView('checkout')} onContinueShopping={() => setView('store')}
            />
          )}

          {view === 'product-details' && selectedProduct && (
            <ProductDetailsView 
              product={selectedProduct} categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
              onAddToCart={(p, qty) => addToCart(p, qty)} onBack={() => setView('store')}
              isFavorite={wishlist.includes(selectedProduct.id)} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          )}

          {view === 'order-success' && lastCreatedOrder && (
            <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => setView('store')} />
          )}

          {view === 'checkout' && (
             <CheckoutView 
              cart={cart} currentUser={currentUser} onBack={() => setView('cart')} deliveryFee={deliveryFee}
              onPlaceOrder={async (details) => {
                const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
                const order: Order = {
                  id: 'ORD-' + Date.now().toString().slice(-6), customerName: details.fullName, phone: details.phone, city: 'فاقوس', address: details.address,
                  items: cart, total: subtotal + deliveryFee, subtotal, createdAt: Date.now(), status: 'completed', paymentMethod: 'عند الاستلام', userId: currentUser?.id
                };
                if (await ApiService.saveOrder(order)) { setLastCreatedOrder(order); setCart([]); setView('order-success'); loadData(true); WhatsAppService.sendOrderNotification(order, adminPhone); }
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
            {isActuallyAdmin && <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />}
            <MobileNav currentView={view} cartCount={cart.length} onNavigate={onNavigateAction} onCartClick={() => setView('cart')} isAdmin={isActuallyAdmin} />
          </>
        )}
        
        {productForBarcode && <BarcodePrintPopup product={productForBarcode} onClose={() => { setProductForBarcode(null); setView('admin'); }} />}
      </div>
    </PullToRefresh>
  );
};

export default App;