
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

  // تحديث الرابط في المتصفح
  const updateUrl = (params: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.pushState({}, '', url.toString());
  };

  // معالجة التوجيه بناءً على الرابط الحالي
  const handleRouting = (allProducts: Product[], allCategories: Category[]) => {
    const params = new URLSearchParams(window.location.search);
    const categoryName = params.get('category');
    const productSlug = params.get('p');
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

    // الاستماع لزر الرجوع في المتصفح
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const categoryName = params.get('category');
      
      if (categoryName) {
        const cat = categories.find(c => c.name === categoryName);
        if (cat) {
          setSelectedCategoryId(cat.id);
          setView('category-page');
        }
      } else if (!params.get('v') && !params.get('p')) {
        setView('store');
        setSelectedCategoryId('all');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [categories.length]);

  const navigateToStore = () => {
    updateUrl({ category: null, p: null, v: null });
    setSelectedCategoryId('all');
    setView('store');
    setSelectedProduct(null);
  };

  const navigateToCategory = (id: string | 'all') => {
    if (id === 'all') {
      navigateToStore();
    } else {
      const cat = categories.find(c => c.id === id);
      if (cat) {
        updateUrl({ category: cat.name, p: null, v: null });
        setSelectedCategoryId(id);
        setView('category-page');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const navigateToProduct = (product: Product) => {
    const slug = product.seoSettings?.slug || product.id;
    updateUrl({ p: slug, v: null, category: null });
    setSelectedProduct(product);
    setView('product-details');
    window.scrollTo(0, 0);
  };

  const addToCart = (product: Product, size?: string, color?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size && item.selectedColor === color);
      let newList;
      if (existing) {
        newList = prev.map(item => (item.id === product.id && item.selectedSize === size && item.selectedColor === color) ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        newList = [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
      }
      localStorage.setItem('elite_cart', JSON.stringify(newList));
      return newList;
    });
  };

  const toggleFavorite = (productId: string) => {
    setWishlist(prev => {
      const newList = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem('elite_wishlist', JSON.stringify(newList));
      return newList;
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-500">تحميل عالم النخبة...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
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
            onAddToCart={(p) => addToCart(p)} 
            onViewProduct={navigateToProduct}
            wishlist={wishlist}
            onToggleFavorite={toggleFavorite}
          />
        )}
        
        {view === 'category-page' && selectedCategoryId !== 'all' && (
          <CategoryPageView 
            category={categories.find(c => c.id === selectedCategoryId)!}
            products={products}
            onAddToCart={(p) => addToCart(p)}
            onViewProduct={navigateToProduct}
            wishlist={wishlist}
            onToggleFavorite={toggleFavorite}
            onBack={navigateToStore}
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
          <CartView 
            cart={cart}
            onUpdateQuantity={(id, d) => {
              setCart(prev => {
                const newList = prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + d) } : item);
                localStorage.setItem('elite_cart', JSON.stringify(newList));
                return newList;
              });
            }}
            onRemove={(id) => {
              setCart(prev => {
                const newList = prev.filter(item => item.id !== id);
                localStorage.setItem('elite_cart', JSON.stringify(newList));
                return newList;
              });
            }}
            onCheckout={() => setView('checkout')}
            onContinueShopping={navigateToStore}
          />
        )}

        {view === 'checkout' && (
           <CheckoutView 
             cart={cart} 
             onPlaceOrder={async (details) => {
               const newOrder: Order = {
                 id: 'ORD-'+Date.now(), customerName: details.fullName, phone: details.phone, city: details.city, address: details.address,
                 items: [...cart], subtotal: cart.reduce((s, i) => s + (i.price * i.quantity), 0), total: cart.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.15,
                 paymentMethod: details.paymentMethod, status: 'pending', createdAt: Date.now()
               };
               await ApiService.saveOrder(newOrder);
               setLastPlacedOrder(newOrder);
               setCart([]);
               localStorage.removeItem('elite_cart');
               setView('order-success');
             }}
             onBack={() => setView('cart')}
           />
        )}

        {view === 'order-success' && lastPlacedOrder && (
          <OrderSuccessView order={lastPlacedOrder} onContinueShopping={navigateToStore} />
        )}

        {view === 'wishlist' && (
           <div className="animate-fadeIn">
            <h2 className="text-3xl font-black mb-8">المفضلة ({wishlist.length})</h2>
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
          </div>
        )}

        {view === 'admin' && (
          <AdminDashboard 
            products={products} categories={categories} orders={orders}
            onOpenAddForm={() => window.location.href = 'add-product.php'}
            onOpenEditForm={(p) => window.location.href = `add-product.php?id=${p.id}`}
            onDeleteProduct={async (id) => { await ApiService.deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); }}
            onAddCategory={async (c) => { await ApiService.addCategory(c); setCategories(prev => [...prev, c]); }}
            onDeleteCategory={async (id) => { await ApiService.deleteCategory(id); setCategories(prev => prev.filter(c => c.id !== id)); }}
          />
        )}
      </main>

      <footer className="bg-slate-900 text-white py-12 text-center mt-12">
        <h2 className="text-xl font-black mb-2">متجر النخبة | Elite Store</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

export default App;
