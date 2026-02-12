
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Product, CartItem, Category, Order } from './types';
import Header from './components/Header';
import StoreView from './components/StoreView';
import AdminDashboard from './admincp/AdminDashboard';
import AdminProductForm from './admincp/AdminProductForm';
import AdminInvoiceForm from './admincp/AdminInvoiceForm';
import CartView from './components/CartView';
import ProductDetailsViewWrapper from './components/ProductDetailsViewWrapper';
import OrderSuccessView from './components/OrderSuccessView';
import FloatingAdminButton from './components/FloatingAdminButton';
import { ApiService } from './services/api';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
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

  const handleInvoiceSubmit = async (order: Order) => {
    await ApiService.saveOrder(order);
    setOrders(prev => [order, ...prev]);
    setLastCreatedOrder(order);
    navigate('/order-success');
  };

  const onAddToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) {
        return prev.map(item => item.id === p.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prev, {...p, quantity: 1}];
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-green-600 font-black">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        جاري تحميل فاقوس ستور...
      </div>
    );
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f0]">
      
      {!isAdminRoute && (
        <Header 
          cartCount={cart.length} 
          wishlistCount={wishlist.length} 
          currentView="store" 
          categories={categories}
          selectedCategoryId={selectedCategoryId} 
          onNavigate={(v) => navigate(`/${v === 'store' ? '' : v}`)}
          onSearch={setSearchQuery} 
          onCategorySelect={(id) => { setSelectedCategoryId(id); navigate('/'); }}
        />
      )}

      <main className={`flex-grow ${isAdminRoute ? 'w-full h-screen overflow-hidden' : 'container mx-auto px-4 py-8'}`}>
        <Routes>
          <Route path="/" element={
            <StoreView 
              products={products} categories={categories} searchQuery={searchQuery} selectedCategoryId={selectedCategoryId}
              onCategorySelect={(id) => setSelectedCategoryId(id)} onAddToCart={onAddToCart} 
              onViewProduct={(p) => navigate(`/product/${p.id}`)}
              wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          } />
          
          <Route path="/admin" element={
            <AdminDashboard 
              products={products} categories={categories} orders={orders}
              onOpenAddForm={() => navigate('/admin/add')}
              onOpenEditForm={(p) => navigate(`/admin/edit/${p.id}`)}
              onOpenInvoiceForm={() => navigate('/admin/invoice')}
              onDeleteProduct={async (id) => { if(confirm('متأكد من حذف المنتج؟')) { await ApiService.deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); } }}
              onAddCategory={async (c) => { await ApiService.addCategory(c); setCategories(prev => [...prev, c]); }}
              onUpdateCategory={async (c) => { await ApiService.updateCategory(c); setCategories(prev => prev.map(cat => cat.id === c.id ? c : cat)); }}
              onDeleteCategory={async (id) => { if(confirm('حذف القسم؟')) { await ApiService.deleteCategory(id); setCategories(prev => prev.filter(c => c.id !== id)); } }}
            />
          } />

          <Route path="/admin/add" element={
            <div className="h-full overflow-y-auto bg-slate-50">
               <AdminProductForm 
                  product={null} categories={categories} 
                  onSubmit={async (p) => { await ApiService.addProduct(p); await loadData(); navigate('/admin'); }}
                  onCancel={() => navigate('/admin')}
                />
            </div>
          } />

          <Route path="/admin/edit/:id" element={
            <div className="h-full overflow-y-auto bg-slate-50">
               <AdminProductFormWrapper 
                  products={products} categories={categories} 
                  onSubmit={async (p) => { await ApiService.updateProduct(p); await loadData(); navigate('/admin'); }}
                  onCancel={() => navigate('/admin')}
                />
            </div>
          } />

          <Route path="/admin/invoice" element={
            <div className="h-full overflow-y-auto bg-slate-50">
              <AdminInvoiceForm products={products} onSubmit={handleInvoiceSubmit} onCancel={() => navigate('/admin')} />
            </div>
          } />

          <Route path="/product/:id" element={
            <ProductDetailsViewWrapper 
              products={products} categories={categories} onAddToCart={onAddToCart}
              onBack={() => navigate(-1)} wishlist={wishlist}
              onToggleFavorite={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            />
          } />

          <Route path="/cart" element={<CartView cart={cart} onUpdateQuantity={()=>{}} onRemove={()=>{}} onCheckout={()=>{}} onContinueShopping={()=>navigate('/')} />} />
          <Route path="/wishlist" element={
            <StoreView 
              products={products.filter(p => wishlist.includes(p.id))} categories={categories} searchQuery="" selectedCategoryId="all"
              onCategorySelect={() => {}} onAddToCart={onAddToCart} 
              onViewProduct={(p) => navigate(`/product/${p.id}`)}
              wishlist={wishlist} onToggleFavorite={(id) => setWishlist(prev => prev.filter(i => i !== id))}
            />
          } />
          
          <Route path="/order-success" element={
            <div className="h-full overflow-y-auto">
              <OrderSuccessView order={lastCreatedOrder!} onContinueShopping={() => navigate('/admin')} />
            </div>
          } />
        </Routes>
      </main>

      {!isAdminRoute && (
        <>
          <FloatingAdminButton currentView="store" onNavigate={(v) => navigate(`/${v === 'store' ? '' : v}`)} />
          <footer className="bg-green-900 text-white py-12 text-center mt-20">
            <h2 className="text-xl font-black mb-2">🛍️ فاقوس ستور</h2>
            <p className="text-green-300 opacity-50 text-[10px]">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </footer>
        </>
      )}
    </div>
  );
};

// Wrapper components to handle URL params
const ProductDetailsViewWrapper = ({ products, categories, ...props }: any) => {
  const { id } = React.useContext(React.createContext as any); // Mocking or using hook
  const { id: paramId } = (window as any).ReactRouterDOM.useParams();
  const product = products.find((p: any) => p.id === paramId);
  const categoryName = categories.find((c: any) => c.id === product?.categoryId)?.name || 'عام';
  
  if (!product) return <div className="p-20 text-center">جاري التحميل...</div>;
  
  const ProductDetailsView = (window as any).ProductDetailsViewComponent; // Assuming global or exported
  // Note: For simplicity in this environment, we rely on the component being accessible
  return <props.Component product={product} categoryName={categoryName} {...props} />;
};

const AdminProductFormWrapper = ({ products, categories, onSubmit, onCancel }: any) => {
  const { id } = (window as any).ReactRouterDOM.useParams();
  const product = products.find((p: any) => p.id === id);
  return <AdminProductForm product={product} categories={categories} onSubmit={onSubmit} onCancel={onCancel} />;
};

export default App;
