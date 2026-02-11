
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Product, CartItem, Category, Order } from './types';
import Header from './components/Header';
import StoreView from './components/StoreView';
import AdminDashboard from './admincp/AdminDashboard';
import AdminProductForm from './admincp/AdminProductForm';
import CartView from './components/CartView';
import ProductDetailsView from './components/ProductDetailsView';
import AuthView from './components/AuthView';
import CheckoutView from './components/CheckoutView';
import OrderSuccessView from './components/OrderSuccessView';
import CategoryPageView from './components/CategoryPageView';
import ProductCard from './components/ProductCard';
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
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUrl = (params: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    
    if (params.category === null && params.v === null && params.p === null) {
      url.searchParams.delete('category');
      url.searchParams.delete('v');
      url.searchParams.delete('p');
    }

    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const syncWithUrl = useCallback((allProducts: Product[], allCategories: Category[]) => {
    const params = new URLSearchParams(window.location.search);
    const categoryName = params.get('category');
    const productSlug = params.get('p');
    const viewParam = params.get('v') as View | null;

    if (productSlug) {
      const product = allProducts.find(p => p.seoSettings?.slug === productSlug || p.id === productSlug);
      if (product) {
        setSelectedProduct(product);
        setView('product-details');
        window.scrollTo(0, 0);
        return;
      }
    }

    if (categoryName) {
      const category = allCategories.find(cat => cat.name === categoryName);
      if (category) {
        setSelectedCategoryId(category.id);
        setView('category-page'); 
        window.scrollTo(0, 0);
        return;
      }
    }

    if (viewParam) {
      setView(viewParam);
      if (viewParam !== 'product-details' && viewParam !== 'admin-form') setSelectedProduct(null);
    } else {
      setView('store');
      setSelectedCategoryId('all');
      setSelectedProduct(null);
    }
  }, []);

  useEffect(() => {
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
    loadData();
  }, [syncWithUrl]);

  useEffect(() => {
    const handleLocationChange = () => syncWithUrl(products, categories);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [syncWithUrl, products, categories]);

  const onNavigateAction = (v: View) => {
    setView(v);
    if (v === 'store') updateUrl({ category: null, p: null, v: null });
    else updateUrl({ v, p: null, category: null });
  };

  const handleProductSubmit = async (p: Product) => {
    const isEdit = products.some(prod => prod.id === p.id);
    const success = isEdit ? await ApiService.updateProduct(p) : await ApiService.addProduct(p);
    
    if (success) {
      setProducts(prev => isEdit ? prev.map(prod => prod.id === p.id ? p : prod) : [p, ...prev]);
      onNavigateAction('admin');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-green-600">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black tracking-tighter text-xl">جاري تحضير طلبات فاقوس...</p>
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
            onDeleteProduct={async (id) => { await ApiService.deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); }}
            onAddCategory={async (c) => { await ApiService.addCategory(c); setCategories(prev => [...prev, c]); }}
            onDeleteCategory={async (id) => { await ApiService.deleteCategory(id); setCategories(prev => prev.filter(c => c.id !== id)); }}
          />
        )}

        {view === 'admin-form' && (
          <AdminProductForm 
            product={selectedProduct} categories={categories} 
            onSubmit={handleProductSubmit}
            onCancel={() => onNavigateAction('admin')}
          />
        )}

        {/* ... بقية الـ Views ... */}
        {view === 'cart' && <CartView cart={cart} onUpdateQuantity={()=>{}} onRemove={()=>{}} onCheckout={()=>{}} onContinueShopping={()=>onNavigateAction('store')} />}
        {view === 'category-page' && categories.find(c => c.id === selectedCategoryId) && (
          <CategoryPageView 
            category={categories.find(c => c.id === selectedCategoryId)!} products={products}
            onAddToCart={()=>{}} onViewProduct={()=>{}} wishlist={[]} onToggleFavorite={()=>{}} onBack={()=>onNavigateAction('store')}
          />
        )}
      </main>

      <footer className="bg-green-900 text-white py-20 text-center">
        <h2 className="text-2xl font-black mb-4">اسواق فاقوس</h2>
        <p className="text-green-300 opacity-50 text-[10px]">&copy; {new Date().getFullYear()} من مزارعنا إليكم مباشرة</p>
      </footer>
    </div>
  );
};

export default App;
