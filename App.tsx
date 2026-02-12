
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Product, CartItem, Category, Order } from './types.ts';
import Header from './components/Header.tsx';
import StoreView from './components/StoreView.tsx';
import AdminDashboard from './admincp/AdminDashboard.tsx';
import AdminProductForm from './admincp/AdminProductForm.tsx';
import AdminInvoiceForm from './admincp/AdminInvoiceForm.tsx';
import CartView from './components/CartView.tsx';
import ProductDetailsView from './components/ProductDetailsView.tsx';
import CheckoutView from './components/CheckoutView.tsx';
import OrderSuccessView from './components/OrderSuccessView.tsx';
import FloatingAdminButton from './components/FloatingAdminButton.tsx';
import Notification from './components/Notification.tsx';
import CategoryPageView from './components/CategoryPageView.tsx';
import { ApiService } from './services/api.ts';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedProducts = await ApiService.getProducts();
      if (fetchedProducts) setProducts(fetchedProducts);

      const fetchedCats = await ApiService.getCategories();
      if (fetchedCats) setCategories(fetchedCats);

      const fetchedOrders = await ApiService.getOrders();
      if (fetchedOrders) setOrders(fetchedOrders);
    } catch (err) {
      console.error("Data loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-emerald-600">جاري تحميل المتجر...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <Header 
        cartCount={cart.length} 
        wishlistCount={wishlist.length} 
        categories={categories}
        onNavigate={(v) => navigate(v === 'store' ? '/' : `/${v}`)}
        onSearch={setSearchQuery} 
        onCategorySelect={(id) => navigate(id === 'all' ? '/' : `/category/${id}`)}
      />

      <main className="flex-grow container mx-auto px-4 pt-40 pb-20">
        <Routes>
          <Route path="/" element={
            <StoreView 
              products={products} categories={categories} searchQuery={searchQuery} selectedCategoryId="all"
              onCategorySelect={(id) => navigate(id === 'all' ? '/' : `/category/${id}`)} 
              onAddToCart={(p) => { setCart([...cart, {...p, quantity: 1}]); showNotify('تمت الإضافة للسلة'); }} 
              onViewProduct={(p) => navigate(`/product/${p.id}`)}
              wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          } />

          <Route path="/category/:id" element={<CategoryRouteWrapper products={products} categories={categories} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} showNotify={showNotify} />} />
          
          <Route path="/product/:id" element={<ProductRouteWrapper products={products} categories={categories} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} showNotify={showNotify} />} />

          <Route path="/cart" element={
            <CartView 
              cart={cart} 
              onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))}
              onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
              onCheckout={() => navigate('/checkout')}
              onContinueShopping={() => navigate('/')}
            />
          } />

          <Route path="/admin" element={
            <AdminDashboard 
              products={products} categories={categories} orders={orders}
              onOpenAddForm={() => navigate('/admin/product/add')}
              onOpenEditForm={(p) => navigate(`/admin/product/edit/${p.id}`)}
              onOpenInvoiceForm={() => navigate('/admin/invoice')}
              onDeleteProduct={async (id) => { 
                  const success = await ApiService.deleteProduct(id); 
                  if (success) showNotify('تم حذف المنتج بنجاح');
                  loadData(); 
              }}
              onAddCategory={async (c) => { 
                  const success = await ApiService.addCategory(c); 
                  if (success) showNotify('تم إضافة القسم بنجاح');
                  loadData(); 
              }}
              onUpdateCategory={async (c) => { 
                  const success = await ApiService.updateCategory(c); 
                  if (success) showNotify('تم تحديث القسم بنجاح');
                  loadData(); 
              }}
              onDeleteCategory={async (id) => { 
                  const success = await ApiService.deleteCategory(id); 
                  if (success) showNotify('تم حذف القسم بنجاح');
                  loadData(); 
              }}
            />
          } />

          <Route path="/admin/product/add" element={
            <AdminProductForm 
              product={null} categories={categories} 
              onSubmit={async (p) => {
                 const success = await ApiService.addProduct(p);
                 if (success) { showNotify('تم النشر بنجاح! ✨'); await loadData(); navigate('/admin'); }
              }}
              onCancel={() => navigate('/admin')}
            />
          } />

          <Route path="/admin/product/edit/:id" element={<AdminEditWrapper products={products} categories={categories} loadData={loadData} showNotify={showNotify} />} />

          <Route path="/admin/invoice" element={
            <AdminInvoiceForm 
              products={products}
              onSubmit={async (order) => {
                await ApiService.saveOrder(order);
                showNotify('تم إصدار الفاتورة بنجاح');
                await loadData();
                navigate(`/order-success/${order.id}`, { state: { order } });
              }}
              onCancel={() => navigate('/admin')}
            />
          } />

          <Route path="/checkout" element={
            <CheckoutView 
              cart={cart}
              onBack={() => navigate('/cart')}
              onPlaceOrder={async (details) => {
                const newOrder: Order = {
                  id: 'ORD-' + Date.now().toString().slice(-6),
                  ...details,
                  items: cart,
                  total: cart.reduce((s, i) => s + (i.price * i.quantity), 0),
                  subtotal: cart.reduce((s, i) => s + (i.price * i.quantity), 0),
                  createdAt: Date.now(),
                  status: 'pending'
                };
                await ApiService.saveOrder(newOrder);
                setCart([]);
                showNotify('تم إرسال طلبك بنجاح');
                navigate(`/order-success/${newOrder.id}`, { state: { order: newOrder } });
              }}
            />
          } />

          <Route path="/order-success/:id" element={<OrderSuccessWrapper onContinueShopping={() => navigate('/')} />} />
        </Routes>
      </main>

      <FloatingAdminButton currentView="store" onNavigate={(v) => navigate('/admin')} />

      <footer className="bg-slate-900 text-white py-12 text-center">
        <h2 className="text-xl font-black mb-2">فاقوس ستور</h2>
        <p className="text-slate-500 text-xs tracking-widest">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

// Wrappers to handle URL parameters
const CategoryRouteWrapper = ({ products, categories, cart, setCart, wishlist, setWishlist, showNotify }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const category = categories.find((c: any) => c.id === id);
  if (!category) return <div className="text-center py-20 font-bold">القسم غير موجود</div>;

  return (
    <CategoryPageView 
      category={category}
      products={products}
      onAddToCart={(p: any) => { setCart([...cart, {...p, quantity: 1}]); showNotify('تمت الإضافة للسلة'); }}
      onViewProduct={(p: any) => navigate(`/product/${p.id}`)}
      wishlist={wishlist}
      onToggleFavorite={(pid: any) => setWishlist((prev: any) => prev.includes(pid) ? prev.filter((i: any) => i !== pid) : [...prev, pid])}
      onBack={() => navigate('/')}
    />
  );
};

const ProductRouteWrapper = ({ products, categories, cart, setCart, wishlist, setWishlist, showNotify }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p: any) => p.id === id);
  if (!product) return <div className="text-center py-20 font-bold">المنتج غير موجود</div>;

  return (
    <ProductDetailsView 
      product={product}
      categoryName={categories.find((c: any) => c.id === product.categoryId)?.name || 'عام'}
      onAddToCart={(p: any) => { setCart([...cart, {...p, quantity: 1}]); showNotify('تمت الإضافة للسلة'); }}
      onBack={() => navigate(-1)}
      isFavorite={wishlist.includes(product.id)}
      onToggleFavorite={(pid: any) => setWishlist((prev: any) => prev.includes(pid) ? prev.filter((i: any) => i !== pid) : [...prev, pid])}
    />
  );
};

const AdminEditWrapper = ({ products, categories, loadData, showNotify }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p: any) => p.id === id);
  if (!product) return <div className="text-center py-20 font-bold">المنتج غير موجود</div>;

  return (
    <AdminProductForm 
      product={product} categories={categories} 
      onSubmit={async (p) => {
         const success = await ApiService.updateProduct(p);
         if (success) { showNotify('تم التحديث بنجاح! ✨'); await loadData(); navigate('/admin'); }
      }}
      onCancel={() => navigate('/admin')}
    />
  );
};

const OrderSuccessWrapper = ({ onContinueShopping }: any) => {
  const { state } = (window as any).navigation?.currentEntry?.getState() || {};
  // Fallback for direct links if needed, or use a context/API to fetch by ID
  if (!state?.order) return <div className="text-center py-20 font-bold">عذراً، لا يمكن عرض بيانات الطلب</div>;
  return <OrderSuccessView order={state.order} onContinueShopping={onContinueShopping} />;
};

export default App;
