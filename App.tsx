
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { ApiService } from './services/api.ts';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedProducts, fetchedCats, fetchedOrders] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getOrders()
      ]);
      setProducts(fetchedProducts || []);
      setCategories(fetchedCats || []);
      setOrders(fetchedOrders || []);
    } catch (err) {
      console.error("Data loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (location.pathname !== '/') navigate('/');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-emerald-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header 
        cartCount={cart.length} 
        wishlistCount={wishlist.length} 
        categories={categories}
        selectedCategoryId={selectedCategoryId} 
        onSearch={handleSearch} 
        onCategorySelect={(id) => { setSelectedCategoryId(id); if(location.pathname !== '/') navigate('/'); }}
      />

      <main className="flex-grow container mx-auto px-4 pt-40 pb-20">
        <Routes>
          {/* المتجر الرئيسي */}
          <Route path="/" element={
            <StoreView 
              products={products} categories={categories} searchQuery={searchQuery} selectedCategoryId={selectedCategoryId}
              onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => setCart([...cart, {...p, quantity: 1}])} 
              onViewProduct={(p) => navigate(`/product/${p.id}`)}
              wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
              onSearch={handleSearch}
            />
          } />

          {/* تفاصيل المنتج */}
          <Route path="/product/:id" element={
            <ProductDetailsViewWrapper 
              products={products} categories={categories} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist}
            />
          } />

          {/* سلة التسوق */}
          <Route path="/cart" element={
            <CartView 
              cart={cart} 
              onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))}
              onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
              onCheckout={() => navigate('/checkout')}
              onContinueShopping={() => navigate('/')}
            />
          } />

          {/* إتمام الطلب */}
          <Route path="/checkout" element={
            <CheckoutView 
              cart={cart} 
              onPlaceOrder={async (details) => {
                const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                const order: Order = {
                  id: 'ORD-' + Date.now(),
                  customerName: details.fullName,
                  phone: details.phone,
                  city: details.city,
                  address: details.address,
                  items: cart,
                  subtotal: subtotal,
                  total: subtotal * 1.15,
                  paymentMethod: details.paymentMethod,
                  status: 'pending',
                  createdAt: Date.now()
                };
                await ApiService.saveOrder(order);
                setLastCreatedOrder(order);
                setCart([]);
                navigate('/order-success');
              }} 
              onBack={() => navigate('/cart')} 
            />
          } />

          {/* نجاح الطلب */}
          <Route path="/order-success" element={
            lastCreatedOrder ? 
            <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => navigate('/')} /> : 
            <div className="text-center py-20 font-bold">لا يوجد طلب حالي</div>
          } />

          {/* لوحة التحكم */}
          <Route path="/admin" element={
            <AdminDashboard 
              products={products} categories={categories} orders={orders}
              onOpenAddForm={() => navigate('/admin/add')}
              onOpenEditForm={(p) => navigate(`/admin/edit/${p.id}`)}
              onOpenInvoiceForm={() => navigate('/admin/invoice')}
              onDeleteProduct={async (id) => { await ApiService.deleteProduct(id); loadData(); }}
              onAddCategory={async (c) => { await ApiService.addCategory(c); loadData(); }}
              onUpdateCategory={async (c) => { await ApiService.updateCategory(c); loadData(); }}
              onDeleteCategory={async (id) => { await ApiService.deleteCategory(id); loadData(); }}
            />
          } />

          {/* نماذج الإدارة */}
          <Route path="/admin/add" element={
            <AdminProductForm 
              product={null} categories={categories} 
              onSubmit={async (p) => { await ApiService.addProduct(p); await loadData(); navigate('/admin'); }}
              onCancel={() => navigate('/admin')}
            />
          } />

          <Route path="/admin/edit/:id" element={
            <AdminProductEditWrapper products={products} categories={categories} loadData={loadData} />
          } />

          <Route path="/admin/invoice" element={
            <AdminInvoiceForm 
              products={products}
              onSubmit={async (order) => {
                await ApiService.saveOrder(order);
                setLastCreatedOrder(order);
                await loadData();
                navigate('/order-success');
              }}
              onCancel={() => navigate('/admin')}
            />
          } />
        </Routes>
      </main>

      <FloatingAdminButton />

      <footer className="bg-slate-900 text-white py-12 text-center">
        <h2 className="text-xl font-black mb-2">فاقوس ستور</h2>
        <p className="text-slate-500 text-xs tracking-widest">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

// مكون وسيط لجلب بيانات المنتج من الرابط في صفحة التفاصيل
const ProductDetailsViewWrapper = ({ products, categories, cart, setCart, wishlist, setWishlist }: any) => {
  const { id } = React.useParams();
  const navigate = useNavigate();
  const product = products.find((p: any) => p.id === id);
  if (!product) return <div className="text-center py-20 font-bold">المنتج غير موجود</div>;
  
  return (
    <ProductDetailsView 
      product={product}
      categoryName={categories.find((c: any) => c.id === product.categoryId)?.name || 'عام'}
      onAddToCart={(p) => setCart([...cart, {...p, quantity: 1}])}
      onBack={() => navigate(-1)}
      isFavorite={wishlist.includes(product.id)}
      onToggleFavorite={(id) => setWishlist((prev: any) => prev.includes(id) ? prev.filter((i: any) => i !== id) : [...prev, id])}
    />
  );
};

// مكون وسيط لجلب بيانات المنتج في صفحة التعديل
const AdminProductEditWrapper = ({ products, categories, loadData }: any) => {
  const { id } = React.useParams();
  const navigate = useNavigate();
  const product = products.find((p: any) => p.id === id);
  if (!product) return <div className="text-center py-20 font-bold">المنتج غير موجود</div>;

  return (
    <AdminProductForm 
      product={product} categories={categories} 
      onSubmit={async (p) => { await ApiService.updateProduct(p); await loadData(); navigate('/admin'); }}
      onCancel={() => navigate('/admin')}
    />
  );
};

export default App;
