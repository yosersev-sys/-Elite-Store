
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
    salesCount: 150
  },
  {
    id: '2',
    name: 'ساعة ذكية رياضية',
    description: 'تتبع نشاطك البدني، نبضات القلب، والنوم مع شاشة AMOLED واضحة ومقاومة للماء.',
    price: 450,
    categoryId: 'cat_1',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'],
    colors: ['أسود', 'فضي', 'وردي'],
    stockQuantity: 3,
    createdAt: Date.now() - 100000,
    salesCount: 85
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

  useEffect(() => {
    const loadData = async () => {
      const fetchedProducts = await ApiService.getProducts();
      const fetchedCats = await ApiService.getCategories();
      const fetchedOrders = await ApiService.getOrders();

      if (fetchedProducts.length === 0) {
        setProducts(INITIAL_PRODUCTS);
        localStorage.setItem('elite_products', JSON.stringify(INITIAL_PRODUCTS));
      } else {
        setProducts(fetchedProducts);
      }

      if (fetchedCats.length === 0) {
        setCategories(DEFAULT_CATEGORIES);
        // حفظ الأقسام الافتراضية في التخزين المحلي لضمان وجودها
        localStorage.setItem('elite_categories', JSON.stringify(DEFAULT_CATEGORIES));
      } else {
        setCategories(fetchedCats);
      }

      setOrders(fetchedOrders);

      const savedCart = localStorage.getItem('elite_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('elite_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    };

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

    await ApiService.saveOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity) };
      }
      return p;
    }));

    setLastPlacedOrder(newOrder);
    setCart([]);
    setView('order-success');
  };

  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen flex flex-col font-sans">
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
            onOpenAddForm={() => setView('admin-form')}
            onOpenEditForm={(p) => { setProductToEdit(p); setView('admin-form'); }}
            onDeleteProduct={async (id) => { setProducts(prev => prev.filter(p => p.id !== id)); ApiService.deleteProduct(id); }}
            onAddCategory={(c) => { setCategories(prev => [...prev, c]); ApiService.addCategory(c); }}
            onDeleteCategory={(id) => { setCategories(prev => prev.filter(c => c.id !== id)); ApiService.deleteCategory(id); }}
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
        {view === 'admin-form' && <AdminProductForm product={productToEdit} categories={categories} onSubmit={(p) => { setProducts(prev => productToEdit ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]); setView('admin'); }} onCancel={() => setView('admin')} />}
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-12 text-center text-gray-500">
        &copy; {new Date().getFullYear()} متجر النخبة. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
};

export default App;
