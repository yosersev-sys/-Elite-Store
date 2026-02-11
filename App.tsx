
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Product, CartItem, Category, Order } from './types';
import Header from './components/Header';
import StoreView from './components/StoreView';
import AdminDashboard from './admincp/AdminDashboard';
import AdminProductForm from './admincp/AdminProductForm';
import AdminInvoiceForm from './admincp/AdminInvoiceForm';
import CartView from './components/CartView';
import ProductDetailsView from './components/ProductDetailsView';
import AuthView from './components/AuthView';
import CheckoutView from './components/CheckoutView';
import OrderSuccessView from './components/OrderSuccessView';
import CategoryPageView from './components/CategoryPageView';
import FloatingAdminButton from './components/FloatingAdminButton';
import { ApiService } from './services/api';

const App: React.FC = () => {
  const [view, setView] = useState<View>('store');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUrl = (params: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.pushState({}, '', url.toString());
  };

  const syncWithUrl = useCallback((allProducts: Product[], allCategories: Category[]) => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('v') as View | null;
    if (viewParam) setView(viewParam);
  }, []);

  const loadData = async () => {
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
      syncWithUrl(fetchedProducts, fetchedCats);
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [syncWithUrl]);

  const onNavigateAction = (v: View) => {
    setView(v);
    updateUrl({ v });
  };

  const handleInvoiceSubmit = async (order: Order) => {
    await ApiService.saveOrder(order);
    setOrders(prev => [order, ...prev]);
    setLastCreatedOrder(order);
    setView('order-success');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-green-600">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black tracking-tighter text-xl">جاري تحضير مبيعات فاقوس...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-[#f8faf7]">
      <Header 
        cartCount={cart.length} wishlistCount={wishlist.length} currentView={view} categories={categories}
        selectedCategoryId={selectedCategoryId} onNavigate={onNavigateAction}
        onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); if(view !== 'store') onNavigateAction('store'); }}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        {view === 'store' && (
          <StoreView 
            products={products} categories={categories} searchQuery={searchQuery} selectedCategoryId={selectedCategoryId}
            onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={(p) => setCart([...cart, {...p, quantity: 1}])} 
            onViewProduct={(p) => { setSelectedProduct(p); onNavigateAction('product-details'); }}
            wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}
        
        {view === 'admin' && (
          <AdminDashboard 
            products={products} categories={categories} orders={orders}
            onOpenAddForm={() => { setSelectedProduct(null); setView('admin-form'); }}
            onOpenEditForm={(p) => { setSelectedProduct(p); setView('admin-form'); }}
            onOpenInvoiceForm={() => setView('admin-invoice')}
            onDeleteProduct={async (id) => { await ApiService.deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); }}
            onAddCategory={async (c) => { await ApiService.addCategory(c); setCategories(prev => [...prev, c]); }}
            onUpdateCategory={async (c) => { await ApiService.updateCategory(c); setCategories(prev => prev.map(cat => cat.id === c.id ? c : cat)); }}
            onDeleteCategory={async (id) => { await ApiService.deleteCategory(id); setCategories(prev => prev.filter(c => c.id !== id)); }}
          />
        )}

        {view === 'admin-form' && (
          <AdminProductForm 
            product={selectedProduct} categories={categories} 
            onSubmit={async (p) => {
               const isEdit = products.some(prod => prod.id === p.id);
               if (isEdit) await ApiService.updateProduct(p); else await ApiService.addProduct(p);
               await loadData();
               onNavigateAction('admin');
            }}
            onCancel={() => onNavigateAction('admin')}
          />
        )}

        {view === 'admin-invoice' && (
          <AdminInvoiceForm 
            products={products}
            onSubmit={handleInvoiceSubmit}
            onCancel={() => onNavigateAction('admin')}
          />
        )}

        {view === 'order-success' && lastCreatedOrder && (
          <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('admin')} />
        )}

        {view === 'cart' && <CartView cart={cart} onUpdateQuantity={()=>{}} onRemove={()=>{}} onCheckout={()=>{}} onContinueShopping={()=>onNavigateAction('store')} />}
      </main>

      <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />

      <footer className="bg-green-900 text-white py-12 text-center mt-20">
        <h2 className="text-xl font-black mb-2">اسواق فاقوس المزارع</h2>
        <p className="text-green-300 opacity-50 text-[10px] tracking-widest">&copy; {new Date().getFullYear()} نظام الإدارة الفعال</p>
      </footer>
    </div>
  );
};

export default App;
