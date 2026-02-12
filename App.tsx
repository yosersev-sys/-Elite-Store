
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { Product, CartItem, Category, Order } from './types';
import Header from './components/Header';
import StoreView from './components/StoreView';
import AdminDashboard from './admincp/AdminDashboard';
import AdminProductForm from './admincp/AdminProductForm';
import AdminInvoiceForm from './admincp/AdminInvoiceForm';
import CartView from './components/CartView';
import ProductDetailsView from './components/ProductDetailsView';
import OrderSuccessView from './components/OrderSuccessView';
import FloatingAdminButton from './components/FloatingAdminButton';
import { ApiService } from './services/api';

const CategoryPage = ({ products, categories, onAddToCart, wishlist, onToggleFavorite, searchQuery }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <StoreView 
      products={products} 
      categories={categories} 
      searchQuery={searchQuery} 
      selectedCategoryId={id || 'all'}
      showHero={false}
      onCategorySelect={(newId) => navigate(newId === 'all' ? '/' : `/category/${newId}`)} 
      onAddToCart={onAddToCart} 
      onViewProduct={(p) => navigate(`/product/${p.id}`)}
      wishlist={wishlist} 
      onToggleFavorite={onToggleFavorite}
    />
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedProducts, fetchedCats, fetchedOrders] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getOrders()
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCats);
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onAddToCart = (p: Product) => {
    setCart(prev => {
      const exist = prev.find(item => item.id === p.id);
      if (exist) return prev.map(item => item.id === p.id ? {...item, quantity: item.quantity + 1} : item);
      return [...prev, {...p, quantity: 1}];
    });
  };

  const handleInvoiceSubmit = async (order: Order) => {
    await ApiService.saveOrder(order);
    setOrders(prev => [order, ...prev]);
    setLastCreatedOrder(order);
    navigate('/order-success');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-orange-500">
        <div className="w-16 h-16 border-8 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black tracking-tighter text-2xl animate-pulse">فاقوس ستور - جاري التحميل</p>
      </div>
    );
  }

  const isAdminView = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-[#fcfdfb]">
      <Header 
        cartCount={cart.length} 
        wishlistCount={wishlist.length} 
        currentView={isAdminView ? 'admin' : 'store'} 
        categories={categories}
        selectedCategoryId={location.pathname.startsWith('/category/') ? location.pathname.split('/').pop() || 'all' : 'all'} 
        onNavigate={(v) => navigate(v === 'store' ? '/' : `/${v}`)}
        onSearch={setSearchQuery} 
        onCategorySelect={(id) => navigate(id === 'all' ? '/' : `/category/${id}`)}
      />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            <StoreView 
              products={products} categories={categories} searchQuery={searchQuery} selectedCategoryId="all"
              showHero={true} 
              onCategorySelect={(id) => navigate(id === 'all' ? '/' : `/category/${id}`)} 
              onAddToCart={onAddToCart} 
              onViewProduct={(p) => navigate(`/product/${p.id}`)}
              wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          } />

          <Route path="/category/:id" element={
            <CategoryPage 
              products={products} categories={categories} searchQuery={searchQuery} 
              onAddToCart={onAddToCart} wishlist={wishlist} 
              onToggleFavorite={(id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          } />

          <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
          <Route path="/admin/:tab" element={
            <div className="pt-28 pb-10 px-4 container mx-auto">
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
            </div>
          } />

          <Route path="/admin/add" element={
            <div className="pt-28"><AdminProductForm product={null} categories={categories} onSubmit={async (p) => { await ApiService.addProduct(p); await loadData(); navigate('/admin/products'); }} onCancel={() => navigate('/admin/products')} /></div>
          } />

          <Route path="/admin/edit/:id" element={
             <div className="pt-28 animate-fadeIn">
                {(() => {
                  const { id } = useParams();
                  const p = products.find(prod => prod.id === id);
                  if (!p) return <div className="p-20 text-center font-bold text-gray-400 py-20">المنتج غير موجود</div>;
                  return (
                    <AdminProductForm product={p} categories={categories} onSubmit={async (pData: Product) => { await ApiService.updateProduct(pData); await loadData(); navigate('/admin/products'); }} onCancel={() => navigate('/admin/products')} />
                  );
                })()}
             </div>
          } />

          <Route path="/admin/invoice" element={
            <div className="pt-28"><AdminInvoiceForm products={products} onSubmit={handleInvoiceSubmit} onCancel={() => navigate('/admin/products')} /></div>
          } />

          <Route path="/product/:id" element={
             <div className="pt-28 animate-fadeIn container mx-auto">
                {(() => {
                  const { id } = useParams();
                  const p = products.find(prod => prod.id === id);
                  if (!p) return <div className="p-20 text-center font-bold text-gray-400 py-20">المنتج غير موجود</div>;
                  return (
                    <ProductDetailsView product={p} categoryName={categories.find(c => c.id === p.categoryId)?.name || 'عام'} onAddToCart={onAddToCart} onBack={() => navigate(-1)} isFavorite={wishlist.includes(p.id)} onToggleFavorite={(idStr) => setWishlist(prev => prev.includes(idStr) ? prev.filter(i => i !== idStr) : [...prev, idStr])} />
                  );
                })()}
             </div>
          } />

          <Route path="/cart" element={
            <div className="pt-32 container mx-auto px-4"><CartView cart={cart} onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))} onCheckout={() => navigate('/admin/invoice')} onContinueShopping={() => navigate('/')} /></div>
          } />

          <Route path="/wishlist" element={
            <div className="pt-8"><StoreView products={products.filter(p => wishlist.includes(p.id))} categories={categories} searchQuery="" selectedCategoryId="all" showHero={false} onCategorySelect={() => {}} onAddToCart={onAddToCart} onViewProduct={(p) => navigate(`/product/${p.id}`)} wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} /></div>
          } />

          <Route path="/order-success" element={
            lastCreatedOrder ? <div className="pt-28"><OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => navigate('/admin/products')} /></div> : <Navigate to="/" />
          } />
        </Routes>
      </main>

      <FloatingAdminButton />

      <footer className="bg-orange-950 text-white py-16 text-center mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black mb-4">🛍️ فاقوس ستور</h2>
          <p className="text-orange-200/60 max-w-md mx-auto mb-8 font-bold leading-relaxed">منصة متكاملة لتجارة المنتجات الطازجة والمحاصيل الزراعية بأحدث أنظمة الإدارة والبيع.</p>
          <div className="w-24 h-1 bg-orange-500 mx-auto mb-8 rounded-full"></div>
          <p className="text-orange-400 text-[10px] font-black tracking-widest uppercase">&copy; {new Date().getFullYear()} شركة فاقوس للحلول الرقمية - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
