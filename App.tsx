
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { Product, CartItem, Category, Order } from './types.ts';
import Header from './components/Header.tsx';
import StoreView from './components/StoreView.tsx';
import AdminDashboard from './admincp/AdminDashboard.tsx';
import AdminProductForm from './admincp/AdminProductForm.tsx';
import AdminInvoiceForm from './admincp/AdminInvoiceForm.tsx';
import CartView from './components/CartView.tsx';
import ProductDetailsView from './components/ProductDetailsView.tsx';
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
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
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
      console.error("Critical Load Error:", err);
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

  if (isLoading) return null; // يتم التعامل معه عبر اللودر في index.html

  const isAdminView = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfb]">
      <Header 
        cartCount={cart.length} 
        wishlistCount={wishlist.length} 
        currentView={isAdminView ? 'admin' : 'store'} 
        categories={categories}
        selectedCategoryId="all"
        onNavigate={() => {}}
        onSearch={setSearchQuery} 
        onCategorySelect={(id) => navigate(id === 'all' ? '/' : `/category/${id}`)}
      />

      <main className="flex-grow pt-32 md:pt-40">
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
            <CategoryWrapper products={products} categories={categories} searchQuery={searchQuery} onAddToCart={onAddToCart} wishlist={wishlist} setWishlist={setWishlist} />
          } />

          <Route path="/admin/products" element={
            <div className="container mx-auto px-4">
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
          
          <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
          <Route path="/admin/add" element={<AdminProductForm product={null} categories={categories} onSubmit={async (p) => { await ApiService.addProduct(p); loadData(); navigate('/admin/products'); }} onCancel={() => navigate('/admin/products')} />} />
          <Route path="/cart" element={<CartView cart={cart} onUpdateQuantity={() => {}} onRemove={() => {}} onCheckout={() => navigate('/admin/invoice')} onContinueShopping={() => navigate('/')} />} />
          
          <Route path="/product/:id" element={
             <ProductDetailsWrapper products={products} categories={categories} onAddToCart={onAddToCart} wishlist={wishlist} setWishlist={setWishlist} />
          } />
        </Routes>
      </main>

      <FloatingAdminButton />

      <footer className="bg-slate-900 text-white py-12 text-center mt-20 no-print">
        <h2 className="text-xl font-black mb-4">🛍️ فاقوس ستور</h2>
        <p className="text-slate-400 text-xs tracking-widest uppercase">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لشركة فاقوس الرقمية</p>
      </footer>
    </div>
  );
};

// مكونات وسيطة لحل مشكلة useParams داخل Routes مباشرة
const CategoryWrapper = ({ products, categories, searchQuery, onAddToCart, wishlist, setWishlist }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-4">
      <StoreView 
        products={products} categories={categories} searchQuery={searchQuery} selectedCategoryId={id || 'all'}
        showHero={false}
        onCategorySelect={(newId) => navigate(newId === 'all' ? '/' : `/category/${newId}`)} 
        onAddToCart={onAddToCart} 
        onViewProduct={(p) => navigate(`/product/${p.id}`)}
        wishlist={wishlist} onToggleFavorite={(fid) => setWishlist((prev: any) => prev.includes(fid) ? prev.filter((i: any) => i !== fid) : [...prev, fid])}
      />
    </div>
  );
};

const ProductDetailsWrapper = ({ products, categories, onAddToCart, wishlist, setWishlist }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = products.find((prod: any) => prod.id === id);
  if (!p) return <div className="py-20 text-center font-black">المنتج غير موجود 🔍</div>;
  return (
    <div className="container mx-auto px-4">
      <ProductDetailsView 
        product={p} 
        categoryName={categories.find((c: any) => c.id === p.categoryId)?.name || 'عام'} 
        onAddToCart={onAddToCart} 
        onBack={() => navigate(-1)} 
        isFavorite={wishlist.includes(p.id)} 
        onToggleFavorite={(fid: any) => setWishlist((prev: any) => prev.includes(fid) ? prev.filter((i: any) => i !== fid) : [...prev, fid])} 
      />
    </div>
  );
};

export default App;
