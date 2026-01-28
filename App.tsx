import React, { useState, useEffect, useCallback } from 'react';
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

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'إلكترونيات' },
  { id: 'cat_2', name: 'أزياء' },
  { id: 'cat_3', name: 'منزل ومطبخ' },
  { id: 'cat_4', name: 'جمال وعناية' },
  { id: 'cat_5', name: 'اكسسوارات' }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'سماعات لاسلكية برو',
    description: 'تجربة صوتية محيطية مع خاصية إلغاء الضجيج وعمر بطارية طويل يصل لـ 40 ساعة.',
    price: 299,
    categoryId: 'cat_1',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600'],
    colors: ['أسود', 'أبيض', 'أزرق'],
    stockQuantity: 15,
    createdAt: Date.now(),
    salesCount: 150,
    seoSettings: { metaTitle: 'سماعات برو | متجر النخبة', metaDescription: 'أفضل سماعات لاسلكية', metaKeywords: 'سماعات, بلوتوث', slug: 'wireless-headphones-pro' }
  }
];

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
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleRouting = useCallback(() => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0) {
      setView('store');
      setSelectedCategoryId('all');
      setSelectedProduct(null);
    } else if (parts[0] === 'product' && parts[1]) {
      const product = products.find(p => p.seoSettings?.slug === parts[1] || p.id === parts[1]);
      if (product) {
        setSelectedProduct(product);
        setView('product-details');
      } else {
        setView('store');
      }
    } else if (parts[0] === 'category' && parts[1]) {
      const category = categories.find(c => c.id === parts[1]);
      if (category) {
        setSelectedCategoryId(category.id);
        setView('category-page');
      } else {
        setView('store');
      }
    } else {
      const validViews: View[] = ['admin', 'cart', 'auth', 'checkout', 'wishlist'];
      if (validViews.includes(parts[0] as View)) {
        setView(parts[0] as View);
      } else {
        setView('store');
      }
    }
  }, [products, categories]);

  const navigate = useCallback((newView: View, params?: { slug?: string, id?: string }) => {
    let path = '/';
    if (newView === 'product-details' && params?.slug) path = `/product/${params.slug}`;
    else if (newView === 'category-page' && params?.id) path = `/category/${params.id}`;
    else if (newView !== 'store') path = `/${newView}`;

    window.history.pushState({}, '', path);
    handleRouting();
  }, [handleRouting]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const fetchedProducts = await ApiService.getProducts();
        let fetchedCats = await ApiService.getCategories();
        const fetchedOrders = await ApiService.getOrders();

        if (fetchedCats.length === 0) {
          // محاولة إضافة التصنيفات الافتراضية إذا كانت فارغة
          for (const cat of DEFAULT_CATEGORIES) {
            await ApiService.addCategory(cat);
          }
          fetchedCats = DEFAULT_CATEGORIES;
        }

        setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
        setCategories(Array.isArray(fetchedCats) ? fetchedCats : DEFAULT_CATEGORIES);
        setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);

        const savedCart = localStorage.getItem('elite_cart');
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedWishlist = localStorage.getItem('elite_wishlist');
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      } catch (err) {
        console.error("Critical failure during loadData:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    window.addEventListener('popstate', handleRouting);
    return () => window.removeEventListener('popstate', handleRouting);
  }, []);

  useEffect(() => {
    if (!isLoading && products.length >= 0) {
      handleRouting();
    }
  }, [isLoading, products.length, handleRouting]);

  useEffect(() => {
    localStorage.setItem('elite_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('elite_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleFavorite = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const addToCart = (product: Product, size?: string, color?: string) => {
    if (product.stockQuantity <= 0) return alert('عذراً، هذا المنتج غير متوفر حالياً');
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && item.selectedSize === size && item.selectedColor === color
      );
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedSize === size && item.selectedColor === color)
            ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
  };

  const handlePlaceOrder = useCallback(async (details: any) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      customerName: details.fullName,
      phone: details.phone,
      city: details.city,
      address: details.address,
      items: [...cart],
      subtotal,
      total,
      paymentMethod: details.paymentMethod,
      status: 'pending',
      createdAt: Date.now()
    };

    await ApiService.saveOrder(newOrder);
    
    // تحديث الكميات
    for (const item of cart) {
      const p = products.find(x => x.id === item.id);
      if (p) {
        await ApiService.updateProduct({
          ...p,
          stockQuantity: Math.max(0, p.stockQuantity - item.quantity),
          salesCount: (p.salesCount || 0) + item.quantity
        });
      }
    }

    setOrders(prev => [newOrder, ...prev]);
    const refreshedProducts = await ApiService.getProducts();
    setProducts(refreshedProducts);
    
    setLastPlacedOrder(newOrder);
    setCart([]);
    setView('order-success');
  }, [cart, products]);

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
    <div className="min-h-screen flex flex-col font-sans">
      <Header 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        currentView={view}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onNavigate={(v) => navigate(v)}
        onSearch={setSearchQuery}
        onCategorySelect={(id) => {
          if (id === 'all') navigate('store');
          else navigate('category-page', { id });
        }}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        {view === 'store' && (
          <StoreView 
            products={products}
            categories={categories}
            searchQuery={searchQuery}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={(id) => {
              if (id === 'all') navigate('store');
              else navigate('category-page', { id });
            }}
            onAddToCart={(p) => addToCart(p, p.sizes?.[0], p.colors?.[0])} 
            onViewProduct={(p) => navigate('product-details', { slug: p.seoSettings?.slug || p.id })}
            wishlist={wishlist}
            onToggleFavorite={toggleFavorite}
          />
        )}
        
        {view === 'category-page' && currentCategory && (
          <CategoryPageView 
            category={currentCategory}
            products={products}
            onAddToCart={(p) => addToCart(p, p.sizes?.[0], p.colors?.[0])}
            onViewProduct={(p) => navigate('product-details', { slug: p.seoSettings?.slug || p.id })}
            wishlist={wishlist}
            onToggleFavorite={toggleFavorite}
            onBack={() => navigate('store')}
          />
        )}

        {view === 'wishlist' && (
          <div className="animate-fadeIn">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              قائمة المفضلة ({wishlist.length})
            </h2>
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.filter(p => wishlist.includes(p.id)).map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    category={categories.find(c => c.id === product.categoryId)?.name || 'عام'}
                    onAddToCart={() => addToCart(product)} 
                    onView={() => navigate('product-details', { slug: product.seoSettings?.slug || product.id })}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-500">لا توجد منتجات في المفضلة حالياً.</p>
                <button onClick={() => navigate('store')} className="mt-4 text-indigo-600 font-bold">تصفح المتجر الآن</button>
              </div>
            )}
          </div>
        )}

        {view === 'admin' && (
          <AdminDashboard 
            products={products} 
            categories={categories}
            orders={orders}
            onOpenAddForm={() => setView('admin-form')}
            onOpenEditForm={(p) => { setProductToEdit(p); setView('admin-form'); }}
            onDeleteProduct={async (id) => { 
              const success = await ApiService.deleteProduct(id);
              if(success) setProducts(prev => prev.filter(p => p.id !== id));
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

        {view === 'cart' && (
          <CartView 
            cart={cart} 
            onUpdateQuantity={(id, d) => setCart(prev => prev.map(item => (item.id === id) ? { ...item, quantity: Math.max(1, item.quantity + d) } : item))}
            onRemove={(id) => setCart(prev => prev.filter(item => item.id !== id))}
            onCheckout={() => navigate('checkout')}
            onContinueShopping={() => navigate('store')}
          />
        )}

        {view === 'product-details' && selectedProduct && (
          <ProductDetailsView 
            product={selectedProduct}
            categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
            onAddToCart={addToCart}
            onBack={() => navigate('store')}
            isFavorite={wishlist.includes(selectedProduct.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {view === 'checkout' && (
          <CheckoutView cart={cart} onPlaceOrder={handlePlaceOrder} onBack={() => navigate('cart')} />
        )}

        {view === 'order-success' && lastPlacedOrder && (
          <OrderSuccessView order={lastPlacedOrder} onContinueShopping={() => navigate('store')} />
        )}

        {view === 'auth' && <AuthView onSuccess={() => navigate('store')} />}
        {view === 'admin-form' && <AdminProductForm product={productToEdit} categories={categories} onSubmit={async (p) => { 
          if(productToEdit) {
            await ApiService.updateProduct(p);
            setProducts(prev => prev.map(x => x.id === p.id ? p : x));
          } else {
            await ApiService.addProduct(p);
            setProducts(prev => [p, ...prev]);
          }
          setView('admin'); 
        }} onCancel={() => setView('admin')} />}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-12 text-center text-gray-500">
        &copy; {new Date().getFullYear()} متجر النخبة. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
};

export default App;