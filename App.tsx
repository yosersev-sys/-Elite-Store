
import React, { useState, useEffect } from 'react';
import { View, Product, CartItem, Category, Order } from './types';
import Header from './components/Header';
import StoreView from './components/StoreView';
import AdminDashboard from './components/AdminDashboard';
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
    window.history.pushState({}, '', url.toString());
  };

  const handleRouting = (allProducts: Product[], allCategories: Category[]) => {
    const params = new URLSearchParams(window.location.search);
    const productSlug = params.get('p');
    const categoryName = params.get('category');
    const viewParam = params.get('v');

    if (productSlug) {
      const product = allProducts.find(p => p.seoSettings?.slug === productSlug || p.id === productSlug);
      if (product) {
        setSelectedProduct(product);
        setView('product-details');
        return;
      }
    }

    if (categoryName) {
      const category = allCategories.find(cat => cat.name === categoryName || cat.id === categoryName);
      if (category) {
        setSelectedCategoryId(category.id);
        setView('category-page');
        return;
      }
    }

    if (viewParam === 'admin') setView('admin');
    else if (viewParam === 'cart') setView('cart');
    else if (viewParam === 'wishlist') setView('wishlist');
    else if (viewParam === 'checkout') setView('checkout');
    else {
      setView('store');
      setSelectedCategoryId('all');
    }
  };

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

        handleRouting(fetchedProducts, fetchedCats);

        const savedCart = localStorage.getItem('elite_cart');
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedWishlist = localStorage.getItem('elite_wishlist');
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const categoryName = params.get('category');
      const productSlug = params.get('p');
      const viewParam = params.get('v');

      if (productSlug) {
        setView('product-details');
      } else if (categoryName) {
        const cat = categories.find(c => c.name === categoryName || c.id === categoryName);
        if (cat) {
          setSelectedCategoryId(cat.id);
          setView('category-page');
        }
      } else if (viewParam) {
        setView(viewParam as View);
      } else {
        setView('store');
        setSelectedCategoryId('all');
        setSelectedProduct(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [categories]);

  const navigateToStore = () => {
    updateUrl({ p: null, v: null, category: null });
    setSelectedCategoryId('all');
    setView('store');
    setSelectedProduct(null);
  };

  const navigateToProduct = (product: Product) => {
    const slug = product.seoSettings?.slug || product.id;
    updateUrl({ p: slug, v: null, category: null });
    setSelectedProduct(product);
    setView('product-details');
  };

  const navigateToCategory = (id: string | 'all') => {
    if (id === 'all') {
      navigateToStore();
    } else {
      const cat = categories.find(c => c.id === id);
      const catUrlName = cat ? cat.name : id;
      updateUrl({ category: catUrlName, p: null, v: null });
      setSelectedCategoryId(id);
      setView('category-page');
    }
  };

  const toggleFavorite = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const addToCart = (product: Product, size?: string, color?: string) => {
    if (product.stockQuantity <= 0) return alert('عذراً، هذا المنتج غير متوفر حالياً');
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size && item.selectedColor === color);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedSize === size && item.selectedColor === color) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <Header 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        currentView={view}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onNavigate={(v) => { 
          if (v === 'store') navigateToStore();
          else {
            setView(v);
            updateUrl({ v, p: null, category: null });
          }
        }}
        onSearch={setSearchQuery}
        onCategorySelect={navigateToCategory}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        {view === 'store' && (
          <StoreView 
            products={products}
            categories={categories}
            searchQuery={searchQuery}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={navigateToCategory}
            onAddToCart={(p) => addToCart(p, p.sizes?.[0], p.colors?.[0])} 
            onViewProduct={navigateToProduct}
            wishlist={wishlist}
            onToggleFavorite={toggleFavorite}
          />
        )}
        
        {view === 'category-page' && currentCategory && (
          <CategoryPageView 
            category={currentCategory}
            products={products}
            onAddToCart={(p) => addToCart(p, p.sizes?.[0], p.colors?.[0])}
            onViewProduct={navigateToProduct}
            wishlist={wishlist}
            onToggleFavorite={toggleFavorite}
            onBack={navigateToStore}
          />
        )}

        {view === 'admin' && (
          <AdminDashboard 
            products={products} categories={categories} orders={orders}
            onOpenAddForm={() => window.location.href = 'add-product.php'} 
            onOpenEditForm={(p) => { window.location.href = `add-product.php?id=${p.id}`; }}
            onDeleteProduct={async (id) => { const success = await ApiService.deleteProduct(id); if (success) setProducts(prev => prev.filter(p => p.id !== id)); }}
            onAddCategory={async (c) => { await ApiService.addCategory(c); setCategories(prev => [...prev, c]); }}
            onDeleteCategory={async (id) => { await ApiService.deleteCategory(id); setCategories(prev => prev.filter(c => c.id !== id)); }}
            onUpdateOrder={(updatedOrder) => { setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)); }}
          />
        )}

        {view === 'cart' && (
          <CartView 
            cart={cart} 
            onUpdateQuantity={(id, d) => setCart(prev => prev.map(item => (item.id === id) ? { ...item, quantity: Math.max(1, item.quantity + d) } : item))}
            onRemove={(id) => setCart(prev => prev.filter(item => item.id !== id))}
            onCheckout={() => { setView('checkout'); updateUrl({ v: 'checkout', p: null, category: null }); }}
            onContinueShopping={navigateToStore}
          />
        )}

        {view === 'product-details' && selectedProduct && (
          <ProductDetailsView 
            product={selectedProduct}
            categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
            onAddToCart={addToCart}
            onBack={navigateToStore}
            isFavorite={wishlist.includes(selectedProduct.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {view === 'checkout' && (
          <CheckoutView cart={cart} onPlaceOrder={async (details) => {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = subtotal * 1.15;
            const newOrder: Order = {
              id: `ORD-${Date.now()}`, customerName: details.fullName, phone: details.phone, city: details.city, address: details.address,
              items: [...cart], subtotal, total, paymentMethod: details.paymentMethod, status: 'pending', createdAt: Date.now()
            };
            await ApiService.saveOrder(newOrder);
            setOrders(prev => [newOrder, ...prev]);
            setCart([]);
            setLastPlacedOrder(newOrder);
            setView('order-success');
            updateUrl({ v: 'order-success' });
          }} onBack={() => setView('cart')} />
        )}

        {view === 'order-success' && lastPlacedOrder && (
          <OrderSuccessView order={lastPlacedOrder} onContinueShopping={navigateToStore} />
        )}

        {view === 'wishlist' && (
           <div className="animate-fadeIn">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              المفضلة ({wishlist.length})
            </h2>
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.filter(p => wishlist.includes(p.id)).map(product => (
                  <ProductCard 
                    key={product.id} product={product} 
                    category={categories.find(c => c.id === product.categoryId)?.name || 'عام'}
                    onAddToCart={() => addToCart(product)} onView={() => navigateToProduct(product)}
                    isFavorite={true} onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-500">لا توجد منتجات في المفضلة.</p>
                <button onClick={navigateToStore} className="mt-4 text-indigo-600 font-bold">تصفح المتجر</button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-12 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-black mb-4">متجر النخبة | Elite Store</h2>
          <p className="text-gray-500 text-sm uppercase">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة.</p>
        </div>
      </footer>

      <button 
        onClick={() => { const nextView = view === 'admin' ? 'store' : 'admin'; if (nextView === 'store') navigateToStore(); else { setView('admin'); updateUrl({ v: 'admin', category: null }); } }}
        className={`fixed bottom-8 left-8 z-50 flex items-center justify-center gap-3 px-6 py-4 rounded-full font-black text-sm shadow-2xl transition-all ${view === 'admin' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}
      >
        <span>{view === 'admin' ? "المتجر" : "الإدارة"}</span>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      </button>
    </div>
  );
};

export default App;
