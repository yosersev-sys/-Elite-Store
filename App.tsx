
import React, { useState, useEffect, useCallback } from 'react';
import { View, Product, CartItem, Category, Order } from './types';
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
      console.error("Initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onNavigateAction = (v: View) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  const handleInvoiceSubmit = async (order: Order) => {
    await ApiService.saveOrder(order);
    setOrders(prev => [order, ...prev]);
    setLastCreatedOrder(order);
    onNavigateAction('order-success');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-green-600 font-black">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        جاري تحميل فاقوس ستور...
      </div>
    );
  }

  // تحديد ما إذا كنا في وضع الإدارة الكامل
  const isAdminView = view === 'admin' || view === 'admin-form' || view === 'admin-invoice';

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f0]">
      
      {/* هيدر المتجر يختفي في لوحة الإدارة */}
      {!isAdminView && (
        <Header 
          cartCount={cart.length} 
          wishlistCount={wishlist.length} 
          currentView={view} 
          categories={categories}
          selectedCategoryId={selectedCategoryId} 
          onNavigate={onNavigateAction}
          onSearch={setSearchQuery} 
          onCategorySelect={(id) => { setSelectedCategoryId(id); onNavigateAction('store'); }}
        />
      )}

      {/* منطقة المحتوى - تأخذ كامل العرض في الإدارة */}
      <main className={`flex-grow ${isAdminView ? 'w-full h-screen overflow-hidden' : 'container mx-auto px-4 py-8'}`}>
        
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
            onDeleteProduct={async (id) => { if(confirm('متأكد من حذف المنتج من المخزون؟')) { await ApiService.deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); } }}
            onAddCategory={async (c) => { await ApiService.addCategory(c); setCategories(prev => [...prev, c]); }}
            onUpdateCategory={async (c) => { await ApiService.updateCategory(c); setCategories(prev => prev.map(cat => cat.id === c.id ? c : cat)); }}
            onDeleteCategory={async (id) => { if(confirm('سيتم حذف القسم بالكامل، هل أنت متأكد؟')) { await ApiService.deleteCategory(id); setCategories(prev => prev.filter(c => c.id !== id)); } }}
          />
        )}

        {view === 'admin-form' && (
          <div className="h-full overflow-y-auto bg-slate-50">
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
          </div>
        )}

        {view === 'admin-invoice' && (
          <div className="h-full overflow-y-auto bg-slate-50">
            <AdminInvoiceForm 
              products={products}
              onSubmit={handleInvoiceSubmit}
              onCancel={() => onNavigateAction('admin')}
            />
          </div>
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

        {view === 'cart' && <CartView cart={cart} onUpdateQuantity={()=>{}} onRemove={()=>{}} onCheckout={()=>{}} onContinueShopping={()=>onNavigateAction('store')} />}
        
        {view === 'order-success' && lastCreatedOrder && (
          <div className="h-full overflow-y-auto">
            <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => onNavigateAction('admin')} />
          </div>
        )}

      </main>

      {!isAdminView && (
        <>
          <FloatingAdminButton currentView={view} onNavigate={onNavigateAction} />
          <footer className="bg-green-900 text-white py-12 text-center mt-20">
            <h2 className="text-xl font-black mb-2 flex items-center justify-center gap-2">
              <span className="text-2xl">🛍️</span> فاقوس ستور
            </h2>
            <p className="text-green-300 opacity-50 text-[10px] tracking-widest uppercase">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمتجر فاقوس</p>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
