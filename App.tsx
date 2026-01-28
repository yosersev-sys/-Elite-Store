
import React, { useState, useEffect } from 'react';
import { View, Product, CartItem, Category, Order } from './types';
import Header from './components/Header';
import StoreView from './components/StoreView';
import AdminDashboard from './components/AdminDashboard';
import CartView from './components/CartView';
import ProductDetailsView from './components/ProductDetailsView';
import AdminProductForm from './components/AdminProductForm';
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
  const [isLoading, setIsLoading] = useState(true);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  const slugify = (text: string) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\u0621-\u064A-]+/g, '').replace(/--+/g, '-');

  const updateUrl = (params: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.pushState({}, '', url.toString());
  };

  const handleRouting = (allProducts: Product[], allCats: Category[]) => {
    const params = new URLSearchParams(window.location.search);
    const productSlug = params.get('p');
    const categorySlug = params.get('cat');
    const viewParam = params.get('v');

    if (productSlug) {
      const product = allProducts.find(p => p.seoSettings?.slug === productSlug || p.id === productSlug);
      if (product) {
        setSelectedProduct(product);
        setView('product-details');
        return;
      }
    }

    if (categorySlug) {
      const category = allCats.find(c => slugify(c.name) === categorySlug || c.id === categorySlug);
      if (category) {
        setSelectedCategoryId(category.id);
        setView('category-page');
        return;
      }
    }

    if (viewParam === 'admin') setView('admin');
    else if (viewParam === 'cart') setView('cart');
    else if (viewParam === 'wishlist') setView('wishlist');
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
      if (!params.get('p') && !params.get('cat') && !params.get('v')) {
        setView('store');
        setSelectedCategoryId('all');
        setSelectedProduct(null);
      } else {
        // Re-run routing on back/forward
        // Note: products and categories should be available from state
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToStore = () => {
    updateUrl({ p: null, v: null, cat: null });
    setView('store');
    setSelectedCategoryId('all');
    setSelectedProduct(null);
  };

  const navigateToCategory = (catId: string | 'all') => {
    if (catId === 'all') {
      navigateToStore();
    } else {
      const category = categories.find(c => c.id === catId);
      if (category) {
        updateUrl({ cat: slugify(category.name), p: null, v: null });
        setSelectedCategoryId(catId);
        setView('category-page');
      }
    }
  };

  const navigateToProduct = (product: Product) => {
    const slug = product.seoSettings?.slug || product.id;
    updateUrl({ p: slug, v: null, cat: null });
    setSelectedProduct(product);
    setView('product-details');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold">جاري جلب البيانات من السيرفر...</p>
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
            updateUrl({ v, p: null, cat: null });
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
            products={products} 
            categories={categories}
            orders={orders}
            onOpenAddForm={() => window.location.href = 'add-product.php'} 
            onOpenEditForm={(p) => { window.location.href = `add-product.php?id=${p.id}`; }}
            onDeleteProduct={async (id) => { 
              const success = await ApiService.deleteProduct(id);
              if (success) setProducts(prev => prev.filter(p => p.id !== id));
            }}
            onAddCategory={async (c) => { 
              await ApiService.addCategory(c);
              setCategories(prev => [...prev, c]);
            }}
            onDeleteCategory={async (id) => { 
              await ApiService.deleteCategory(id);
              setCategories(prev => prev.filter(c => c.id !== id));
            }}
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

        {view === 'cart' && (
          <CartView cart={cart} onUpdateQuantity={(id, d) => setCart(prev => prev.map(item => (item.id === id) ? { ...item, quantity: Math.max(1, item.quantity + d) } : item))} onRemove={(id) => setCart(prev => prev.filter(item => item.id !== id))} onCheckout={() => setView('checkout')} onContinueShopping={navigateToStore} />
        )}

        {view === 'checkout' && <CheckoutView cart={cart} onPlaceOrder={() => setView('order-success')} onBack={() => setView('cart')} />}
        {view === 'order-success' && lastPlacedOrder && <OrderSuccessView order={lastPlacedOrder} onContinueShopping={navigateToStore} />}
        
        {view === 'wishlist' && (
           <div className="animate-fadeIn">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3">المفضلة ({wishlist.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.filter(p => wishlist.includes(p.id)).map(product => (
                <ProductCard key={product.id} product={product} category={categories.find(c => c.id === product.categoryId)?.name || 'عام'} onAddToCart={() => addToCart(product)} onView={() => navigateToProduct(product)} isFavorite={true} onToggleFavorite={() => toggleFavorite(product.id)} />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-12 text-center">
        <p>&copy; {new Date().getFullYear()} متجر النخبة | جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

export default App;
