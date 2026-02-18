
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
    if (hash === 'admin' || hash === 'admincp' || window.location.href.includes('admin')) return 'admin';
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

  useEffect(() => {
    const soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    audioObj.current = new Audio(soundUrl);
    audioObj.current.load();
  }, []);

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
      
      const promises: any[] = [
        ApiService.getAdminPhone(),
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getStoreSettings()
      ];

      if (activeUser?.role === 'admin') {
        promises.push(ApiService.getAdminSummary());
      }

      const results = await Promise.all(promises);
      const adminInfo = results[0];
      const fetchedProducts = results[1];
      const fetchedCats = results[2];
      const storeSettings = results[3];
      
      if (adminInfo?.phone) setAdminPhone(adminInfo.phone);
      if (storeSettings?.delivery_fee) setDeliveryFee(parseFloat(storeSettings.delivery_fee));
      setProducts(fetchedProducts || []);
      setCategories(fetchedCats || []);
      
      if (activeUser?.role === 'admin') {
        setAdminSummary(results[4]);
      }

      if (activeUser) {
        ApiService.getOrders().then(fetchedOrders => {
          setOrders(fetchedOrders || []);
          if (activeUser.role === 'admin' && fetchedOrders?.length > 0) {
            if (prevOrderIds.current.size === 0) {
              prevOrderIds.current = new Set(fetchedOrders.map((o: Order) => o.id));
            } else {
              const trulyNew = fetchedOrders.filter((o: Order) => !prevOrderIds.current.has(o.id));
              if (trulyNew.length > 0) {
                if (soundEnabled && audioObj.current) {
                  audioObj.current.currentTime = 0;
                  audioObj.current.play().catch(e => {});
                }
                setNewOrdersForPopup(prev => [...prev, ...trulyNew]);
                trulyNew.forEach(o => prevOrderIds.current.add(o.id));
              }
            }
          }
        });
        
        if (activeUser.role === 'admin') {
          ApiService.getUsers().then(u => setUsers(u || []));
          ApiService.getSuppliers().then(s => setSuppliers(s || []));
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setCurrentUser(null);
    setOrders([]);
    setUsers([]);
    setSuppliers([]);
    setAdminSummary(null);
    prevOrderIds.current.clear();
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
        const newQty = Number((existing.quantity + qty).toFixed(3));
        return prev.map(item => item.id === product.id ? {...item, quantity: newQty} : item);
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
          <AdminAuthView onSuccess={handleAuthSuccess} onClose={() => setView('store')} />
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
              onUpdateOrderPayment={(id, method) => {
                // تحسين الأداء: تحديث الحالة لحظياً قبل إرسال الطلب للسيرفر
                const previousOrders = [...orders];
                const orderToUpdate = orders.find(o => o.id === id);
                if (!orderToUpdate) return;

                // تحديث الواجهة فوراً
                setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentMethod: method } : o));
                setNotification({message: 'جاري تحديث الدفع...', type: 'success'});

                // تحديث الملخص المالي فوراً إذا كان الانتقال لنقدي
                if (adminSummary && method.includes('نقدي')) {
                  setAdminSummary((prev: any) => ({
                    ...prev,
                    total_customer_debt: Math.max(0, (prev.total_customer_debt || 0) - (orderToUpdate.total || 0))
                  }));
                }

                // تنفيذ الطلب في الخلفية
                ApiService.updateOrderPayment(id, method).then(success => {
                  if (success) {
                    setNotification({message: 'تم تحديث حالة الدفع بنجاح', type: 'success'});
                    loadData(true);
                  } else {
                    // في حال الفشل، نقوم بالتراجع
                    setOrders(previousOrders);
                    setNotification({message: 'فشل تحديث الدفع، يرجى المحاولة لاحقاً', type: 'error'});
                  }
                });
              }}
              onReturnOrder={async (id) => {
                if(!confirm('تأكيد الاسترجاع؟')) return;
                const res = await ApiService.returnOrder(id);
                if(res.status === 'success') { 
                  setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as any } : o));
                  setNotification({message: 'تم الاسترجاع بنجاح', type: 'success'}); 
                  loadData(true);
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
                const isUpdate = !!products.find(prod => prod.id === p.id);
                const success = isUpdate ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
                
                if (success) { 
                  setNotification({message: 'تم الحفظ بنجاح', type: 'success'}); 
                  setProducts(prev => {
                    if (isUpdate) {
                      return prev.map(prod => prod.id === p.id ? p : prod);
                    } else {
                      return [p, ...prev];
                    }
                  });
                  setProductForBarcode(p); 
                  loadData(true); 
                }
              }}
              onCancel={() => setView('admin')}
            />
          )}

          {(view === 'admin-invoice' || view === 'quick-invoice') && (
            <AdminInvoiceForm 
              products={products} initialCustomerName={currentUser?.name || 'عميل نقدي'} initialPhone={currentUser?.phone || ''}
              globalDeliveryFee={deliveryFee}
              order={editingOrder}
              onSubmit={async (order) => {
                const isUpdate = !!editingOrder;
                const success = isUpdate ? await ApiService.updateOrder(order) : await ApiService.saveOrder(order);
                
                if (success) {
                  prevOrderIds.current.add(order.id);
                  setProducts(prev => prev.map(p => {
                    const itemInOrder = order.items.find(item => item.id === p.id);
                    if (itemInOrder) {
                      const newQty = Math.max(0, p.stockQuantity - itemInOrder.quantity);
                      return { ...p, stockQuantity: newQty, salesCount: (p.salesCount || 0) + itemInOrder.quantity };
                    }
                    return p;
                  }));
                  setOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
                  setLastCreatedOrder(order);
                  setNotification({message: isUpdate ? 'تم تحديث الطلب' : 'تم حفظ الطلب', type: 'success'});
                  if (!isActuallyAdmin && !isUpdate) {
                    WhatsAppService.sendInvoiceToCustomer(order, order.phone);
                  }
                  loadData(true);
                  setEditingOrder(null);
                  setView('order-success');
                }
              }}
              onCancel={() => { setEditingOrder(null); setView(isActuallyAdmin ? 'admin' : 'store'); }}
            />
          )}

          {view === 'cart' && (
            <CartView 
              cart={cart} 
              deliveryFee={deliveryFee}
              onUpdateQuantity={(id, d) => updateCartQuantity(id, cart.find(i => i.id === id)!.quantity + d)}
              onSetQuantity={updateCartQuantity}
              onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
              onCheckout={() => setView('checkout')} onContinueShopping={() => setView('store')}
            />
          )}

          {view === 'product-details' && selectedProduct && (
            <ProductDetailsView 
              product={selectedProduct} categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
              onAddToCart={(p, qty) => addToCart(p, qty)} 
              onBack={() => setView('store')}
              isFavorite={wishlist.includes(selectedProduct.id)} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          )}

          {view === 'order-success' && lastCreatedOrder && (
            <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => setView('store')} />
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
                  items: cart, total, subtotal, createdAt: Date.now(), status: 'completed', paymentMethod: 'عند الاستلام', userId: currentUser?.id
                };
                if (await ApiService.saveOrder(order)) {
                  setLastCreatedOrder(order);
                  setCart([]);
                  setNotification({message: 'تم الطلب بنجاح', type: 'success'});
                  WhatsAppService.sendOrderNotification(order, adminPhone);
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
            {isActuallyAdmin && <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />}
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
