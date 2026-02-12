
import React, { useState, useEffect, useCallback } from 'react';
import { View, Product, CartItem, Category, Order } from './types.ts';
import Header from './components/Header.tsx';
import StoreView from './components/StoreView.tsx';
import AdminDashboard from './admincp/AdminDashboard.tsx';
import AdminProductForm from './admincp/AdminProductForm.tsx';
import AdminInvoiceForm from './admincp/AdminInvoiceForm.tsx';
import CartView from './components/CartView.tsx';
import ProductDetailsView from './components/ProductDetailsView.tsx';
import AuthView from './components/AuthView.tsx';
import CheckoutView from './components/CheckoutView.tsx';
import OrderSuccessView from './components/OrderSuccessView.tsx';
import FloatingAdminButton from './components/FloatingAdminButton.tsx';
import { ApiService } from './services/api.ts';

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      // تحميل البيانات بشكل منفصل لضمان عمل التطبيق حتى لو فشل جزء واحد
      const fetchedProducts = await ApiService.getProducts();
      if (fetchedProducts) setProducts(fetchedProducts);

      const fetchedCats = await ApiService.getCategories();
      if (fetchedCats) setCategories(fetchedCats);

      const fetchedOrders = await ApiService.getOrders();
      if (fetchedOrders) setOrders(fetchedOrders);
      
    } catch (err) {
      console.error("Data loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onNavigateAction = (v: View) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-emerald-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header 
        cartCount={cart.length} wishlistCount={wishlist.length} currentView={view} categories={categories}
        selectedCategoryId={selectedCategoryId} onNavigate={onNavigateAction}
        onSearch={setSearchQuery} onCategorySelect={(id) => { setSelectedCategoryId(id); if(view !== 'store') onNavigateAction('store'); }}
      />

      <main className="flex-grow container mx-auto px-4 pt-40 pb-20">
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
            onOpenAddForm={() => { setSelectedProduct(null); onNavigateAction('admin-form'); }}
            onOpenEditForm={(p) => { setSelectedProduct(p); onNavigateAction('admin-form'); }}
            onOpenInvoiceForm={() => onNavigateAction('admin-invoice')}
            onDeleteProduct={async (id) => { await ApiService.deleteProduct(id); loadData(); }}
            onAddCategory={async (c) => { await ApiService.addCategory(c); loadData(); }}
            onUpdateCategory={async (c) => { await ApiService.updateCategory(c); loadData(); }}
            onDeleteCategory={async (id) => { await ApiService.deleteCategory(id); loadData(); }}
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
            onSubmit={async (order) => {
              await ApiService.saveOrder(order);
              setLastCreatedOrder(order);
              await loadData();
              onNavigateAction('order-success');
            }}
            onCancel={() => onNavigateAction('admin')}
          />
        )}

        {view === 'order-success' && lastCreatedOrder && (
          <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('admin')} />
        )}

        {view === 'cart' && (
          <CartView 
            cart={cart} 
            onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))}
            onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))}
            onCheckout={() => onNavigateAction('checkout')}
            onContinueShopping={() => onNavigateAction('store')}
          />
        )}

        {view === 'product-details' && selectedProduct && (
          <ProductDetailsView 
            product={selectedProduct}
            categoryName={categories.find(c => c.id === selectedProduct.categoryId)?.name || 'عام'}
            onAddToCart={(p) => setCart([...cart, {...p, quantity: 1}])}
            onBack={() => onNavigateAction('store')}
            isFavorite={wishlist.includes(selectedProduct.id)}
            onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          />
        )}
      </main>

      <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />

      <footer className="bg-slate-900 text-white py-12 text-center">
        <h2 className="text-xl font-black mb-2">فاقوس ستور</h2>
        <p className="text-slate-500 text-xs tracking-widest">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
};

export default App;
