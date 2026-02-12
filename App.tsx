
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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white text-orange-500">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black">فاقوس ستور - جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfb]">
      <Header 
        cartCount={cart.length} 
        wishlistCount={wishlist.length} 
        currentView="store"
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
              onAddToCart={(p) => setCart(prev => [...prev, {...p, quantity: 1}])} 
              onViewProduct={(p) => navigate(`/product/${p.id}`)}
              wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          } />
          <Route path="/admin/*" element={<AdminDashboard products={products} categories={categories} orders={orders} onOpenAddForm={() => {}} onOpenEditForm={() => {}} onOpenInvoiceForm={() => {}} onDeleteProduct={() => {}} onAddCategory={() => {}} onUpdateCategory={() => {}} onDeleteCategory={() => {}} />} />
          <Route path="/cart" element={<CartView cart={cart} onUpdateQuantity={() => {}} onRemove={() => {}} onCheckout={() => {}} onContinueShopping={() => navigate('/')} />} />
        </Routes>
      </main>

      <FloatingAdminButton />
      
      <footer className="bg-slate-900 text-white py-12 text-center mt-20">
        <p className="font-black">🛍️ فاقوس ستور - جميع الحقوق محفوظة {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
