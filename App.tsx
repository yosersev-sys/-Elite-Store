
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Product, CartItem, Category, Order } from './types';
import { ApiService } from './services/api';

// استيراد المكونات
import Header from './components/Header';
import StoreView from './components/StoreView';
import AdminDashboard from './admincp/AdminDashboard';
import AdminProductForm from './admincp/AdminProductForm';
import AdminInvoiceForm from './admincp/AdminInvoiceForm';
import CartView from './components/CartView';
import OrderSuccessView from './components/OrderSuccessView';
import FloatingAdminButton from './components/FloatingAdminButton';
import ProductDetailsView from './components/ProductDetailsView';

// مكون عرض تفاصيل المنتج
const ProductPage: React.FC<{ 
  products: Product[], 
  categories: Category[], 
  onAddToCart: (p: Product) => void, 
  wishlist: string[], 
  onToggleFavorite: (id: string) => void 
}> = ({ products, categories, onAddToCart, wishlist, onToggleFavorite }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);
  const categoryName = categories.find(c => c.id === product?.categoryId)?.name || 'عام';

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
        <h2 className="text-2xl font-black text-gray-800">عذراً، المنتج غير موجود</h2>
        <button onClick={() => navigate('/')} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl font-bold">العودة للمتجر</button>
      </div>
    );
  }

  return (
    <ProductDetailsView 
      product={product} 
      categoryName={categoryName} 
      onAddToCart={onAddToCart} 
      onBack={() => navigate(-1)} 
      isFavorite={wishlist.includes(product.id)} 
      onToggleFavorite={onToggleFavorite} 
    />
  );
};

// مكون تعديل المنتج
const EditProductPage: React.FC<{
  products: Product[],
  categories: Category[],
  onSave: (p: Product) => void,
  onCancel: () => void
}> = ({ products, categories, onSave, onCancel }) => {
  const { id } = useParams();
  const product = products.find(p => p.id === id);

  if (!product) return <div className="p-20 text-center font-bold text-gray-400">جاري البحث عن المنتج...</div>;

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <AdminProductForm product={product} categories={categories} onSubmit={onSave} onCancel={onCancel} />
    </div>
  );
};

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
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedProducts, fetchedCats, fetchedOrders] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getCategories(),
        ApiService.getOrders()
      ]);
      setProducts(fetchedProducts || []);
      setCategories(fetchedCats || []);
      setOrders(fetchedOrders || []);
      setError(null);
    } catch (err) {
      console.error("خطأ في تحميل البيانات:", err);
      // في حالة الفشل، نعتمد على البيانات الوهمية (Mock) التي توفرها ApiService تلقائياً
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onAddToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) {
        return prev.map(item => item.id === p.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prev, {...p, quantity: 1}];
    });
  };

  const onToggleFavorite = (id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-white text-green-600 font-black">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">فاقوس ستور - جاري التحميل...</p>
      </div>
    );
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf7]">
      
      {!isAdminRoute && (
        <Header 
          cartCount={cart.length} 
          wishlistCount={wishlist.length} 
          currentView="store" 
          categories={categories}
          selectedCategoryId={selectedCategoryId} 
          onNavigate={(v) => navigate(v === 'store' ? '/' : `/${v}`)}
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
              wishlist={wishlist} onToggleFavorite={onToggleFavorite}
            />
          } />
          
          <Route path="/admin" element={
            <AdminDashboard 
              products={products} categories={categories} orders={orders}
              onOpenAddForm={() => navigate('/admin/add')}
              onOpenEditForm={(p) => navigate(`/admin/edit/${p.id}`)}
              onOpenInvoiceForm={() => navigate('/admin/invoice')}
              onDeleteProduct={async (id) => { if(confirm('هل أنت متأكد من حذف المنتج؟')) { await ApiService.deleteProduct(id); loadData(); } }}
              onAddCategory={async (c) => { await ApiService.addCategory(c); loadData(); }}
              onUpdateCategory={async (c) => { await ApiService.updateCategory(c); loadData(); }}
              onDeleteCategory={async (id) => { if(confirm('سيتم حذف القسم، هل أنت متأكد؟')) { await ApiService.deleteCategory(id); loadData(); } }}
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
            <EditProductPage 
              products={products} categories={categories} 
              onSave={async (p) => { await ApiService.updateProduct(p); await loadData(); navigate('/admin'); }}
              onCancel={() => navigate('/admin')}
            />
          } />

          <Route path="/admin/invoice" element={
            <div className="h-full overflow-y-auto bg-slate-50">
              <AdminInvoiceForm 
                products={products} 
                onSubmit={async (order) => { 
                  await ApiService.saveOrder(order); 
                  setLastCreatedOrder(order); 
                  navigate('/order-success'); 
                }} 
                onCancel={() => navigate('/admin')} 
              />
            </div>
          } />

          <Route path="/product/:id" element={
            <ProductPage 
              products={products} categories={categories} onAddToCart={onAddToCart}
              wishlist={wishlist} onToggleFavorite={onToggleFavorite}
            />
          } />

          <Route path="/cart" element={
            <CartView 
              cart={cart} 
              onUpdateQuantity={(id, d) => setCart(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} 
              onRemove={(id) => setCart(prev => prev.filter(i => i.id !== id))} 
              onCheckout={() => navigate('/admin/invoice')}
              onContinueShopping={() => navigate('/')} 
            />
          } />

          <Route path="/wishlist" element={
            <StoreView 
              products={products.filter(p => wishlist.includes(p.id))} categories={categories} searchQuery="" selectedCategoryId="all"
              onCategorySelect={() => {}} onAddToCart={onAddToCart} 
              onViewProduct={(p) => navigate(`/product/${p.id}`)}
              wishlist={wishlist} onToggleFavorite={onToggleFavorite}
            />
          } />
          
          <Route path="/order-success" element={
            lastCreatedOrder ? (
              <div className="h-full overflow-y-auto">
                <OrderSuccessView order={lastCreatedOrder} onContinueShopping={() => navigate('/admin')} />
              </div>
            ) : (
              <div className="p-20 text-center font-bold text-gray-500">لا يوجد طلب مسجل حالياً</div>
            )
          } />
        </Routes>
      </main>

      {!isAdminRoute && (
        <>
          <FloatingAdminButton />
          <footer className="bg-green-900 text-white py-12 text-center mt-20">
            <h2 className="text-xl font-black mb-2">🛍️ فاقوس ستور</h2>
            <p className="text-green-300 opacity-50 text-[10px] tracking-widest uppercase">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
