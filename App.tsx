
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
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedProducts, fetchedCats, fetchedOrders] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getOrders()
      ]);

      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
      setCategories(Array.isArray(fetchedCats) ? fetchedCats : []);
      setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);

      const savedCart = localStorage.getItem('elite_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('elite_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (err) {
      console.error("Failed to load initial data from API:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('v') === 'admin') {
      setView('admin');
    }
    loadData();
  }, []);

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
    alert('تمت الإضافة للسلة بنجاح');
  };

  const handlePlaceOrder = async (details: any) => {
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

    try {
      await ApiService.saveOrder(newOrder);
      
      // تحديث المخزون
      for (const item of cart) {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
          await ApiService.updateProduct({
            ...prod,
            stockQuantity: Math.max(0, prod.stockQuantity - item.quantity),
            salesCount: (prod.salesCount || 0) + item.quantity
          });
        }
      }

      setOrders(prev => [newOrder, ...prev]);
      setLastPlacedOrder(newOrder);
      setCart([]);
      setView('order-success');
      loadData(); // إعادة تحميل البيانات لتحديث المخزون في الواجهة
    } catch (e) {
      alert('فشل في إرسال الطلب، يرجى المحاولة مرة أخرى');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold">جاري تحميل المتجر من السيرفر...</p>
        </div>
      </div>
    );
  }

  const currentCategory = categories.find(c => c.id === selectedCategoryId);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <Header 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        currentView={view}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onNavigate={(v) => { setView(v); setSelectedProduct(null); }}
        onSearch={setSearchQuery}
        onCategorySelect={(id) => {
          setSelectedCategoryId(id);
          setView(id === 'all' ? 'store' : 'category-page');
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
              setSelectedCategoryId(id);
              if (id !== 'all') setView('category-page');
            }}
            onAddToCart={(p) => addToCart(p, p.sizes?.[0], p.colors?.[0])} 
            onViewProduct={(p) => { setSelectedProduct(p); setView('product-details'); }}
            wishlist={wishlist}
            onToggleFavorite={toggleFavorite}
          />
        )}
        
        {view === 'category-page' && currentCategory && (
          <CategoryPageView 
            category={currentCategory}
            products={products}
            onAddToCart={(p) => addToCart(p, p.sizes?.[0], p.colors?.[0])}
            onViewProduct={(p) => { setSelectedProduct(p); setView('product-details'); }}
            wishlist={wishlist}
            onToggleFavorite={toggleFavorite}
            onBack={() => { setView('store'); setSelectedCategoryId('all'); }}
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
                    onView={() => { setSelectedProduct(product); setView('product-details'); }}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-500">لا توجد منتجات في المفضلة حالياً.</p>
                <button onClick={() => setView('store')} className="mt-4 text-indigo-600 font-bold">تصفح المتجر الآن</button>
              </div>
            )}
          </div>
        )}

        {view === 'admin' && (
          <AdminDashboard 
            products={products} 
            categories={categories}
            orders={orders}
            onOpenAddForm={() => window.location.href = 'add-product.php'} 
            onOpenEditForm={(p) => { setProductToEdit(p); setView('admin-form'); }}
            onDeleteProduct={async (id) => { 
              if(confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                const success = await ApiService.deleteProduct(id);
                if (success) setProducts(prev => prev.filter(p => p.id !== id));
              }
            }}
            onAddCategory={async (c) => { 
              await ApiService.addCategory(c);
              setCategories(prev => [...prev, c]);
            }}
            onDeleteCategory={async (id) => { 
              if(confirm('حذف القسم سيؤثر على المنتجات التابعة له، هل أنت متأكد؟')) {
                await ApiService.deleteCategory(id);
                setCategories(prev => prev.filter(c => c.id !== id));
              }
            }}
          />
        )}

        {view === 'cart' && (
          <CartView 
            cart={cart} 
            onUpdateQuantity={(id, d) => setCart(prev => prev.map(item => (item.id === id) ? { ...item, quantity: Math.max(1, item.quantity + d) } : item))}
            onRemove={(id) => setCart(prev => prev.filter(item => item.id !== id))}
            onCheckout={() => setView('checkout')}
            onContinueShopping={() => setView('store')}
          />
        )}

        {view === 'product-details' && selectedProduct && (
          <ProductDetailsView 
            product={selectedProduct}
            categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
            onAddToCart={addToCart}
            onBack={() => setView('store')}
            isFavorite={wishlist.includes(selectedProduct.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {view === 'checkout' && (
          <CheckoutView cart={cart} onPlaceOrder={handlePlaceOrder} onBack={() => setView('cart')} />
        )}

        {view === 'order-success' && lastPlacedOrder && (
          <OrderSuccessView order={lastPlacedOrder} onContinueShopping={() => setView('store')} />
        )}

        {view === 'auth' && <AuthView onSuccess={() => setView('store')} />}
        
        {view === 'admin-form' && <AdminProductForm product={productToEdit} categories={categories} onSubmit={async (p) => { 
          if (productToEdit) {
            await ApiService.updateProduct(p);
          } else {
            await ApiService.addProduct(p);
          }
          await loadData();
          setView('admin'); 
        }} onCancel={() => setView('admin')} />}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-12 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-black mb-4 tracking-tighter">ELITE<span className="text-indigo-500">STORE</span></h2>
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمتجر النخبة.</p>
        </div>
      </footer>

      {/* زر لوحة التحكم العائم */}
      <button 
        onClick={() => setView(view === 'admin' || view === 'admin-form' ? 'store' : 'admin')}
        className={`fixed bottom-8 left-8 z-50 flex items-center justify-center gap-3 px-6 py-4 rounded-full font-black text-sm shadow-2xl transition-all duration-500 transform hover:scale-110 active:scale-90 ${
          view === 'admin' || view === 'admin-form'
          ? 'bg-slate-900 text-white'
          : 'bg-indigo-600 text-white shadow-indigo-200'
        }`}
      >
        <span>{view === 'admin' || view === 'admin-form' ? "العودة للمتجر" : "لوحة التحكم"}</span>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
    </div>
  );
};

export default App;