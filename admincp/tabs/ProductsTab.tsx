import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Category, Supplier, User, CartItem } from '../../types';
import { ApiService } from '../../services/api';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  orders: Order[]; // Passed down via tabProps
  suppliers: Supplier[]; // Passed down via tabProps
  currentUser: User | null; // Passed down via tabProps
  adminSearch: string;
  setAdminSearch: (val: string) => void;
  onOpenEditForm: (product: Product) => void;
  onDeleteProduct: (id: string) => Promise<void> | void;
  initialFilter?: string;
  onPrintBarcode?: (product: Product) => void;
  onRefreshData?: () => void;
}

// Type declaration for Order to satisfy TS in this scope
interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  status: string;
  createdAt: number;
}

const getUnitArabic = (u: string) => {
  switch (u) {
    case 'piece': return 'قطعة';
    case 'carton': return 'كرتونة';
    case 'box': return 'علبة';
    case 'bottle': return 'زجاجة';
    case 'kg': return 'كجم';
    case 'gram': return 'جم';
    case 'liter': return 'لتر';
    case 'meter': return 'متر';
    default: return u || 'قطعة';
  }
};

// Row component wrapped in React.memo to prevent re-renders when selection changes
const ProductRow = React.memo<{
  product: Product;
  categories: Category[];
  suppliers: Supplier[];
  isManager: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (product: Product) => void;
  onPrintBarcode: (product: Product) => void;
  onOpenEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  turnoverLabel: string;
  turnoverColor: string;
}>(({ product, categories, suppliers, isManager, isSelected, isDeleting, onToggleSelect, onOpenDetails, onPrintBarcode, onOpenEdit, onDelete, turnoverLabel, turnoverColor }) => {
  const stock = Number(product.stockQuantity || 0);
  const reorder = product.reorderLevel !== undefined ? Number(product.reorderLevel) : 5;
  const isOut = stock <= 0;
  const isLow = stock > 0 && stock < reorder;

  const getEquivalentUnitsText = () => {
    if (!product.units || product.units.length === 0) return '';
    const largerUnits = [...product.units]
      .filter(u => u.conversionFactor > 1 && Number(u.isActive) !== 0)
      .sort((a, b) => b.conversionFactor - a.conversionFactor);
    if (largerUnits.length === 0) return '';
    const targetUnit = largerUnits[0];
    const factor = Number(targetUnit.conversionFactor || 1);
    if (factor <= 1) return '';
    const wholeUnits = Math.floor(stock / factor);
    const remainder = Math.round(stock % factor);
    const unitLabel = targetUnit.unitName || 'وحدة';
    const baseUnitLabel = getUnitArabic(product.baseUnit || product.unit || 'piece');
    if (wholeUnits === 0) {
      return `(يعادل 0 ${unitLabel} و ${remainder} ${baseUnitLabel})`;
    }
    if (remainder === 0) {
      return `(يعادل ${wholeUnits} ${unitLabel})`;
    }
    return `(يعادل ${wholeUnits} ${unitLabel} و ${remainder} ${baseUnitLabel})`;
  };
  
  // Profitability margins
  const cost = Number(product.wholesalePrice || 0);
  const price = Number(product.price || 0);
  const isLoss = price < cost;
  const marginPercent = price > 0 ? ((price - cost) / price) * 100 : 0;
  
  let marginBadge = { bg: 'bg-emerald-50 text-emerald-600', label: 'هامش مرتفع' };
  if (isLoss) {
    marginBadge = { bg: 'bg-rose-50 text-rose-600 border border-rose-100', label: 'خسارة' };
  } else if (marginPercent < 12) {
    marginBadge = { bg: 'bg-amber-50 text-amber-600', label: 'هامش منخفض' };
  } else if (marginPercent < 25) {
    marginBadge = { bg: 'bg-blue-50 text-blue-600', label: 'متوسط' };
  }

  // Stock status badge
  let stockBadge = { bg: 'bg-emerald-50 text-emerald-700', text: 'متوفر' };
  if (isOut) {
    stockBadge = { bg: 'bg-rose-100 text-rose-700 animate-pulse', text: 'نفد' };
  } else if (isLow) {
    stockBadge = { bg: 'bg-amber-100 text-amber-700', text: 'منخفض' };
  }

  // Visual Stock Progress bar
  const maxBar = Math.max(reorder * 2, 10);
  const progressWidth = Math.min(100, (stock / maxBar) * 100);
  let progressColor = 'bg-emerald-500';
  if (isOut) progressColor = 'bg-rose-500';
  else if (isLow) progressColor = 'bg-amber-500';

  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'عام';
  const supplierName = suppliers.find(s => s.id === product.supplierId)?.name || 'غير محدد';

  const [copied, setCopied] = useState(false);
  const handleCopyBarcode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.barcode) {
      navigator.clipboard.writeText(product.barcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <tr className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${isSelected ? 'bg-slate-50' : ''}`} onClick={() => onOpenDetails(product)}>
      {/* Checkbox Column */}
      <td className="px-6 py-4 text-center shrink-0" onClick={e => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          className="w-4.5 h-4.5 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500 transition-all cursor-pointer"
        />
      </td>

      {/* Product Description */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-100 shadow-sm shrink-0 bg-slate-50 flex items-center justify-center">
            {product.images && product.images[0] ? (
              <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
            ) : (
              <span className="text-xl text-slate-300">📦</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-black text-slate-700 truncate max-w-[200px] text-xs md:text-sm">{product.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase">ID: {product.id.slice(-6)}</span>
              {product.barcode && (
                <button 
                  onClick={handleCopyBarcode}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  title="نسخ الباركود"
                >
                  <span>{copied ? '✓ تم النسخ' : `🏷️ ${product.barcode}`}</span>
                </button>
              )}
            </div>
            {product.createdAt && (
              <div className="text-[9px] text-slate-400 font-bold mt-1 flex items-center gap-1.5">
                <span>📅 {new Date(product.createdAt).toLocaleDateString('ar-EG')}</span>
                <span className="text-slate-300">•</span>
                <span>🕒 {new Date(product.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Category & Supplier */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black w-max">
            {categoryName}
          </span>
          <span className="text-[9px] text-slate-400 font-black truncate max-w-[120px]">
            {supplierName}
          </span>
        </div>
      </td>

      {/* Stock Levels & Turnover */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1.5 w-full min-w-[120px]">
          <div className="flex items-center justify-between gap-2">
            <span className={`font-black text-xs ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
              {stock} {getUnitArabic(product.baseUnit || product.unit || 'piece')}
            </span>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${stockBadge.bg}`}>
              {stockBadge.text}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className={`${progressColor} h-full transition-all duration-500`} style={{ width: `${progressWidth}%` }}></div>
          </div>
          {(() => {
            const equivText = getEquivalentUnitsText();
            if (!equivText) return null;
            return (
              <p className="text-[10px] text-indigo-600 font-black leading-none mt-0.5" dir="rtl">
                {equivText}
              </p>
            );
          })()}
          <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold">
            <span>الحد الأدنى: {reorder}</span>
            <span className={`font-black px-1.5 rounded ${turnoverColor}`}>{turnoverLabel}</span>
          </div>
        </div>
      </td>

      {/* Pricing & Profitability Margin (Managers Only) */}
      {isManager ? (
        <>
          <td className="px-6 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-400 text-xs">شراء: {cost.toLocaleString()} ج.م</span>
              <span className="font-black text-slate-700 text-xs md:text-sm">بيع: {price.toLocaleString()} ج.م</span>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-col gap-1 items-start">
              <span className="font-black text-slate-800 text-xs">%{marginPercent.toFixed(1)}</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${marginBadge.bg}`}>
                {marginBadge.label}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 font-black text-slate-900 text-xs md:text-sm">
            {(() => {
              let defaultFactor = 1;
              if (product.units && product.units.length > 0) {
                const defUnit = product.units.find(u => u.isDefault === 1 && Number(u.isActive) !== 0);
                if (defUnit) {
                  defaultFactor = Number(defUnit.conversionFactor || 1);
                }
              }
              const defaultQty = stock / defaultFactor;
              return (defaultQty * cost).toLocaleString();
            })()} <small className="text-[9px] text-slate-400">ج.م</small>
          </td>
        </>
      ) : (
        <td className="px-6 py-4 font-black text-slate-900 text-xs md:text-sm">
          {price.toLocaleString()} <small className="text-[9px] text-slate-400">ج.م</small>
        </td>
      )}

      {/* Actions */}
      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center gap-1.5">
          <button 
            onClick={() => onPrintBarcode(product)} 
            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0"
            title="طباعة الباركود"
          >
            🏷️
          </button>
          <button 
            onClick={() => onOpenEdit(product)} 
            className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0"
            title="تعديل المنتج"
          >
            ✎
          </button>
          <button 
            disabled={isDeleting}
            onClick={() => onDelete(product.id)} 
            className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[32px] shrink-0"
            title="حذف المنتج"
          >
            {isDeleting ? (
              <span className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
            ) : '🗑'}
          </button>
        </div>
      </td>
    </tr>
  );
});

ProductRow.displayName = 'ProductRow';

const formatCompact = (num: number): string => {
  if (num === 0) return '0';
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 1_000_000_000) return sign + (absNum / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' مليار';
  if (absNum >= 1_000_000) return sign + (absNum / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' مليون';
  if (absNum >= 1_000) return sign + (absNum / 1_000).toFixed(1).replace(/\.0$/, '') + ' ألف';
  return sign + absNum.toLocaleString('ar-EG', { maximumFractionDigits: 2 });
};

const ProductsTab: React.FC<ProductsTabProps> = ({ 
  products, 
  categories, 
  orders = [], 
  suppliers = [], 
  currentUser, 
  adminSearch, 
  setAdminSearch, 
  onOpenEditForm, 
  onDeleteProduct, 
  initialFilter, 
  onPrintBarcode,
  onRefreshData
}) => {
  const isManager = currentUser?.role === 'admin';
  const [currentPage, setCurrentPage] = useState(() => Number(localStorage.getItem('admin_products_page')) || 1);
  useEffect(() => {
    localStorage.setItem('admin_products_page', String(currentPage));
  }, [currentPage]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const itemsPerPage = 10;
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  
  // Advanced filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockStatus, setStockStatus] = useState(initialFilter || 'all');
  const [profitStatus, setProfitStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');

  // Drawer states
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [quickStockVal, setQuickStockVal] = useState('');
  const [quickStockReason, setQuickStockReason] = useState('purchase');
  const [quickStockNotes, setQuickStockNotes] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  // Bulk operation popups
  const [bulkPriceVal, setBulkPriceVal] = useState('');
  const [bulkPriceType, setBulkPriceType] = useState<'price' | 'wholesalePrice'>('price');
  const [bulkPriceAdjust, setBulkPriceAdjust] = useState<'fixed' | 'percent'>('fixed');
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  
  const [bulkReorderVal, setBulkReorderVal] = useState('');
  const [showBulkReorderModal, setShowBulkReorderModal] = useState(false);

  const [bulkCatVal, setBulkCatVal] = useState('');
  const [showBulkCatModal, setShowBulkCatModal] = useState(false);

  const [bulkSupplierVal, setBulkSupplierVal] = useState('');
  const [showBulkSupplierModal, setShowBulkSupplierModal] = useState(false);

  const [executingBulk, setExecutingBulk] = useState(false);

  // Sync outside filter trigger
  const isInitialFilterFirstMount = useRef(true);
  useEffect(() => {
    if (initialFilter) {
      setStockStatus(initialFilter);
      if (isInitialFilterFirstMount.current) {
        isInitialFilterFirstMount.current = false;
        return;
      }
      setCurrentPage(1);
    }
  }, [initialFilter]);

  // Calculate 30-day sales count & average inventory per product for Turnover
  const statsSummary = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const salesMap: Record<string, number> = {};

    orders.forEach(o => {
      if (o.createdAt >= thirtyDaysAgo && o.status !== 'cancelled') {
        o.items.forEach(item => {
          salesMap[item.id] = (salesMap[item.id] || 0) + Number(item.quantity || 0);
        });
      }
    });

    return salesMap;
  }, [orders]);

  // Dynamic calculations for all product statistics
  const stats = useMemo(() => {
    let totalItems = products.length;
    let purchaseVal = 0;
    let saleVal = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let stagnantCount = 0;

    const turnoverMap: Record<string, { rate: number; label: string; color: string }> = {};

    products.forEach(p => {
      const stock = Number(p.stockQuantity || 0);
      const cost = Number(p.wholesalePrice || 0);
      const price = Number(p.price || 0);
      const reorder = p.reorderLevel !== undefined ? Number(p.reorderLevel) : 5;

      // معامل تحويل العبوة الافتراضية
      let defaultFactor = 1;
      if (p.units && p.units.length > 0) {
        const defUnit = p.units.find(u => u.isDefault === 1 && Number(u.isActive) !== 0);
        if (defUnit) {
          defaultFactor = Number(defUnit.conversionFactor || 1);
        }
      }

      const defaultQty = stock / defaultFactor;
      purchaseVal += cost * defaultQty;
      saleVal += price * defaultQty;

      if (stock <= 0) outOfStockCount++;
      else if (stock < reorder) lowStockCount++;

      // Turnover rate calculation
      const qtySold = statsSummary[p.id] || 0;
      const rate = qtySold / Math.max(stock, 1);
      
      let label = 'راكد 💤';
      let color = 'bg-slate-100 text-slate-500';
      if (qtySold > 0) {
        if (rate > 1.8) {
          label = 'سريع ⚡';
          color = 'bg-emerald-100 text-emerald-700';
        } else if (rate > 0.5) {
          label = 'معتدل 📈';
          color = 'bg-blue-100 text-blue-700';
        } else {
          label = 'بطيء 🐢';
          color = 'bg-amber-100 text-amber-700';
        }
      } else {
        stagnantCount++;
      }

      turnoverMap[p.id] = { rate, label, color };
    });

    return {
      totalItems,
      purchaseVal,
      saleVal,
      profitVal: saleVal - purchaseVal,
      lowStockCount,
      outOfStockCount,
      stagnantCount,
      turnoverMap
    };
  }, [products, statsSummary]);

  // Apply search, filters & sort
  const filteredProducts = useMemo(() => {
    const q = adminSearch.toLowerCase().trim();
    let result = [...products];

    // Text search
    if (q) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.barcode && String(p.barcode).includes(q)) ||
        p.id.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // Supplier filter
    if (selectedSupplier !== 'all') {
      result = result.filter(p => p.supplierId === selectedSupplier);
    }

    // Stock level status filter
    if (stockStatus !== 'all') {
      result = result.filter(p => {
        const stock = Number(p.stockQuantity || 0);
        const reorder = p.reorderLevel !== undefined ? Number(p.reorderLevel) : 5;
        if (stockStatus === 'in_stock') return stock > 0;
        if (stockStatus === 'low_stock') return stock > 0 && stock < reorder;
        if (stockStatus === 'out_of_stock') return stock <= 0;
        if (stockStatus === 'stagnant') return (statsSummary[p.id] || 0) === 0;
        if (stockStatus === 'fast_moving') return (stats.turnoverMap[p.id]?.rate || 0) > 1.8;
        return true;
      });
    }

    // Profitability level status filter
    if (profitStatus !== 'all') {
      result = result.filter(p => {
        const cost = Number(p.wholesalePrice || 0);
        const price = Number(p.price || 0);
        const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
        if (profitStatus === 'loss') return price < cost;
        if (profitStatus === 'low_margin') return price >= cost && margin < 12;
        if (profitStatus === 'high_margin') return margin > 25;
        return true;
      });
    }

    // Sort options
    result.sort((a, b) => {
      const stockA = Number(a.stockQuantity || 0);
      const stockB = Number(b.stockQuantity || 0);
      const priceA = Number(a.price || 0);
      const priceB = Number(b.price || 0);
      const costA = Number(a.wholesalePrice || 0);
      const costB = Number(b.wholesalePrice || 0);

      switch (sortBy) {
        case 'created_desc': return (b.createdAt || 0) - (a.createdAt || 0);
        case 'created_asc': return (a.createdAt || 0) - (b.createdAt || 0);
        case 'name_asc': return a.name.localeCompare(b.name, 'ar');
        case 'name_desc': return b.name.localeCompare(a.name, 'ar');
        case 'stock_desc': return stockB - stockA;
        case 'stock_asc': return stockA - stockB;
        case 'price_desc': return priceB - priceA;
        case 'price_asc': return priceA - priceB;
        case 'margin_desc': {
          const marginA = priceA > 0 ? (priceA - costA) / priceA : 0;
          const marginB = priceB > 0 ? (priceB - costB) / priceB : 0;
          return marginB - marginA;
        }
        case 'turnover_desc': return (stats.turnoverMap[b.id]?.rate || 0) - (stats.turnoverMap[a.id]?.rate || 0);
        default: return 0;
      }
    });

    return result;
  }, [products, adminSearch, selectedCategory, selectedSupplier, stockStatus, profitStatus, sortBy, statsSummary, stats.turnoverMap]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Adjust page count if filter changes
  const isFiltersFirstMount = useRef(true);
  useEffect(() => {
    if (isFiltersFirstMount.current) {
      isFiltersFirstMount.current = false;
      return;
    }
    setCurrentPage(1);
    setSelectedIds([]);
  }, [selectedCategory, selectedSupplier, stockStatus, profitStatus, adminSearch, sortBy]);

  // Handle single deletion
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من المخزن؟')) return;
    setDeletingIds(prev => [...prev, id]);
    try {
      await onDeleteProduct(id);
      setSelectedIds(prev => prev.filter(x => x !== id));
      if (onRefreshData) onRefreshData();
    } catch(err) {
      console.error(err);
    } finally {
      setDeletingIds(prev => prev.filter(x => x !== id));
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select all visible on current page
  const handleToggleSelectAllVisible = () => {
    const visibleIds = paginatedProducts.map(p => p.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  // Open Drawer and fetch dynamic log history
  const handleOpenDetails = async (product: Product) => {
    setDetailProduct(product);
    setLoadingHistory(true);
    setHistoryLogs([]);
    try {
      const logs = await ApiService.getProductHistory(product.id);
      setHistoryLogs(logs);
    } catch(e) {
      console.error("Failed to load product logs", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Drawer quick stock restock action
  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailProduct || !quickStockVal) return;
    const value = parseFloat(quickStockVal);
    if (isNaN(value) || value === 0) return;

    setSavingStock(true);
    let reasonText = '';
    switch (quickStockReason) {
      case 'purchase': reasonText = 'إمداد بضاعة جديدة - شراء'; break;
      case 'audit': reasonText = 'تسوية جرد للمخزن'; break;
      case 'damage': reasonText = 'تالف ومفقودات'; break;
      default: reasonText = quickStockNotes || 'تعديل مخزون يدوي';
    }

    try {
      const res = await ApiService.adjustStock(detailProduct.id, value, reasonText);
      if (res.success) {
        // Update local drawer state
        setDetailProduct(prev => prev ? { ...prev, stockQuantity: res.newStock ?? (prev.stockQuantity + value) } : null);
        setQuickStockVal('');
        setQuickStockNotes('');
        
        // Refresh histories
        const logs = await ApiService.getProductHistory(detailProduct.id);
        setHistoryLogs(logs);
        
        if (onRefreshData) onRefreshData();
      } else {
        alert(res.message);
      }
    } catch(err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التعديل للمخزون');
    } finally {
      setSavingStock(false);
    }
  };

  // Bulk Adjust Price Submit
  const handleBulkPriceSubmit = async () => {
    if (!bulkPriceVal || selectedIds.length === 0) return;
    const val = parseFloat(bulkPriceVal);
    if (isNaN(val)) return;

    setExecutingBulk(true);
    try {
      const ok = await ApiService.bulkUpdatePrices(selectedIds, bulkPriceType, bulkPriceAdjust, val);
      if (ok) {
        setShowBulkPriceModal(false);
        setBulkPriceVal('');
        setSelectedIds([]);
        if (onRefreshData) onRefreshData();
      } else {
        alert('فشل التعديل الجماعي للأسعار');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setExecutingBulk(false);
    }
  };

  // Bulk Adjust Reorder Submit
  const handleBulkReorderSubmit = async () => {
    if (!bulkReorderVal || selectedIds.length === 0) return;
    const val = parseFloat(bulkReorderVal);
    if (isNaN(val)) return;

    setExecutingBulk(true);
    try {
      const ok = await ApiService.bulkUpdateReorderLevel(selectedIds, val);
      if (ok) {
        setShowBulkReorderModal(false);
        setBulkReorderVal('');
        setSelectedIds([]);
        if (onRefreshData) onRefreshData();
      } else {
        alert('فشلت عملية تحديث حد إعادة الطلب جماعياً');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setExecutingBulk(false);
    }
  };

  // Bulk Category Submit
  const handleBulkCategorySubmit = async () => {
    if (!bulkCatVal || selectedIds.length === 0) return;
    setExecutingBulk(true);
    try {
      const ok = await ApiService.bulkUpdateCategory(selectedIds, bulkCatVal);
      if (ok) {
        setShowBulkCatModal(false);
        setBulkCatVal('');
        setSelectedIds([]);
        if (onRefreshData) onRefreshData();
      } else {
        alert('فشلت عملية نقل القسم جماعياً');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setExecutingBulk(false);
    }
  };

  // Bulk Supplier Submit
  const handleBulkSupplierSubmit = async () => {
    setExecutingBulk(true);
    const val = bulkSupplierVal === 'none' ? null : bulkSupplierVal;
    try {
      const ok = await ApiService.bulkUpdateSupplier(selectedIds, val);
      if (ok) {
        setShowBulkSupplierModal(false);
        setBulkSupplierVal('');
        setSelectedIds([]);
        if (onRefreshData) onRefreshData();
      } else {
        alert('فشلت عملية تغيير المورد جماعياً');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setExecutingBulk(false);
    }
  };

  // Bulk Toggle Active State
  const handleBulkToggleActive = async (active: number) => {
    if (selectedIds.length === 0) return;
    if (!confirm(active === 1 ? 'تفعيل جميع المنتجات المحددة للبيع؟' : 'إخفاء وتعطيل جميع المنتجات المحددة من شاشة البيع؟')) return;

    setExecutingBulk(true);
    try {
      const ok = await ApiService.bulkToggleProducts(selectedIds, active);
      if (ok) {
        setSelectedIds([]);
        if (onRefreshData) onRefreshData();
      } else {
        alert('فشل تعديل حالة المنتجات المحددة');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setExecutingBulk(false);
    }
  };

  // Export selected to Excel-like CSV
  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const selectedProds = products.filter(p => selectedIds.includes(p.id));
    
    const headers = ['المعرف', 'الاسم', 'الباركود', 'القسم', 'المخزون', 'سعر البيع', 'سعر الشراء', 'هامش الربح', 'المورد', 'حد إعادة الطلب'];
    const rows = selectedProds.map(p => [
      p.id,
      p.name,
      p.barcode || '',
      categories.find(c => c.id === p.categoryId)?.name || 'عام',
      p.stockQuantity,
      p.price,
      p.wholesalePrice || 0,
      `${p.price > 0 ? (((p.price - (p.wholesalePrice || 0)) / p.price) * 100).toFixed(1) : 0}%`,
      suppliers.find(s => s.id === p.supplierId)?.name || 'بدون مورد',
      p.reorderLevel ?? 5
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_مخزون_سوق_العصر_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSelectedIds([]);
  };

  // Bulk Print Barcode triggers print for first selected
  const handleBulkPrintBarcode = () => {
    if (selectedIds.length === 0 || !onPrintBarcode) return;
    const firstProd = products.find(p => p.id === selectedIds[0]);
    if (firstProd) {
      onPrintBarcode(firstProd);
    }
  };

  // Drawer sales graph renderer (Draw dynamic responsive SVG)
  const renderDrawerSalesChart = () => {
    if (!detailProduct) return null;
    
    // Group sales volume of this product in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const dailySales: { dateStr: string; qty: number }[] = [];
    
    // Initialize 30 days array
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailySales.push({
        dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
        qty: 0
      });
    }

    orders.forEach(o => {
      if (o.createdAt >= thirtyDaysAgo && o.status !== 'cancelled') {
        const orderDate = new Date(o.createdAt);
        const dateStr = `${orderDate.getMonth() + 1}/${orderDate.getDate()}`;
        const item = o.items.find(it => it.id === detailProduct.id);
        if (item) {
          const matched = dailySales.find(x => x.dateStr === dateStr);
          if (matched) {
            matched.qty += Number(item.quantity || 0);
          }
        }
      }
    });

    const maxQty = Math.max(...dailySales.map(x => x.qty), 5);
    const width = 500;
    const height = 110;
    const padding = 15;
    
    // Plot coordinates
    const points = dailySales.map((x, idx) => {
      const xCoord = padding + (idx / 29) * (width - padding * 2);
      const yCoord = height - padding - (x.qty / maxQty) * (height - padding * 2);
      return { x: xCoord, y: yCoord, label: x.dateStr, qty: x.qty };
    });

    const pathData = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaPathData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <h4 className="font-black text-xs text-slate-500 mb-2">رسم بياني للمبيعات (آخر 30 يوماً):</h4>
        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1.5" />
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeDasharray="3 3" />
            
            {/* Area under path */}
            <path d={areaPathData} fill="url(#chartGrad)" />
            
            {/* Smooth line */}
            <path d={pathData} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Highlighted dots */}
            {points.map((p, idx) => {
              if (p.qty === 0) return null;
              return (
                <g key={idx} className="group/dot cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#fff" strokeWidth="2" />
                  <rect x={p.x - 20} y={p.y - 22} width="40" height="16" rx="4" fill="#0f172a" className="hidden group-hover/dot:block" />
                  <text x={p.x} y={p.y - 11} fill="#fff" fontSize="8" fontWeight="black" textAnchor="middle" className="hidden group-hover/dot:block">
                    {p.qty} قطة
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between items-center text-[8px] text-slate-400 font-bold mt-1 px-2">
          <span>منذ 30 يوم</span>
          <span>اليوم</span>
        </div>
      </div>
    );
  };

  // Find all loss-making items for warnings
  const lossMakingProducts = useMemo(() => {
    return products.filter(p => Number(p.price || 0) < Number(p.wholesalePrice || 0));
  }, [products]);

  // Find products with outlier values (potential data entry errors like scanning barcode into quantity/price)
  const outlierProducts = useMemo(() => {
    return products.filter(p => {
      const stock = Number(p.stockQuantity || 0);
      const cost = Number(p.wholesalePrice || 0);
      const price = Number(p.price || 0);

      let defaultFactor = 1;
      if (p.units && p.units.length > 0) {
        const defUnit = p.units.find(u => u.isDefault === 1 && Number(u.isActive) !== 0);
        if (defUnit) {
          defaultFactor = Number(defUnit.conversionFactor || 1);
        }
      }
      const defaultQty = stock / defaultFactor;

      const isHugeValue = (defaultQty * cost) > 500000 || (defaultQty * price) > 500000;
      const isHugeStock = stock > 10000 && p.unit !== 'gram';
      return isHugeValue || isHugeStock;
    });
  }, [products]);

  return (
    <div className="space-y-6">
      
      {/* 1. Dashboard KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div 
          onClick={() => { setStockStatus('all'); setProfitStatus('all'); setSelectedCategory('all'); setSelectedSupplier('all'); setCurrentPage(1); }}
          className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${stockStatus === 'all' && profitStatus === 'all' && selectedCategory === 'all' && selectedSupplier === 'all' ? 'bg-indigo-50/10 border-indigo-500/80 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-xl font-bold shrink-0">📦</div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-black tracking-widest block uppercase">إجمالي المنتجات</span>
            <span className="text-xl md:text-2xl font-black text-slate-700 block mt-0.5">{stats.totalItems}</span>
          </div>
        </div>

        {/* Total Cost Value (Managers only) */}
        <div 
          onClick={() => { setStockStatus('in_stock'); setCurrentPage(1); }}
          className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${stockStatus === 'in_stock' ? 'bg-rose-50/10 border-rose-500/80 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 text-xl font-bold shrink-0">📉</div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-black tracking-widest block uppercase">قيمة المخزن (تكلفة)</span>
            <span className="text-xl md:text-2xl font-black text-rose-600 block mt-0.5" title={isManager ? stats.purchaseVal.toLocaleString() + ' ج.م' : ''}>
              {isManager ? formatCompact(stats.purchaseVal) : '***'} <small className="text-xs text-slate-400">ج.م</small>
            </span>
          </div>
        </div>

        {/* Expected Sales Value (Managers only) */}
        <div 
          onClick={() => { setStockStatus('in_stock'); setCurrentPage(1); }}
          className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${stockStatus === 'in_stock' ? 'bg-emerald-50/10 border-emerald-500/80 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 text-xl font-bold shrink-0">📈</div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-black tracking-widest block uppercase">قيمة البيع المتوقعة</span>
            <span className="text-xl md:text-2xl font-black text-emerald-600 block mt-0.5" title={isManager ? stats.saleVal.toLocaleString() + ' ج.م' : ''}>
              {isManager ? formatCompact(stats.saleVal) : formatCompact(stats.totalItems * 10)} <small className="text-xs text-slate-400">ج.م</small>
            </span>
          </div>
        </div>

        {/* Expected Profit (Managers only) */}
        <div 
          onClick={() => { setStockStatus('in_stock'); setCurrentPage(1); }}
          className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${stockStatus === 'in_stock' ? 'bg-amber-50/10 border-amber-500/80 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 text-xl font-bold shrink-0">💰</div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-black tracking-widest block uppercase">الربح المتوقع للمدير</span>
            <span className="text-xl md:text-2xl font-black text-slate-700 block mt-0.5" title={isManager ? stats.profitVal.toLocaleString() + ' ج.م' : ''}>
              {isManager ? formatCompact(stats.profitVal) : '***'} <small className="text-xs text-slate-400">ج.م</small>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Low Stock count */}
        <div 
          onClick={() => { setStockStatus('low_stock'); setCurrentPage(1); }}
          className={`p-4 rounded-3xl border-2 flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${stockStatus === 'low_stock' ? 'bg-amber-50/10 border-amber-500/80 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 text-lg shrink-0">⚠️</div>
          <div>
            <span className="text-[9px] text-slate-400 font-black uppercase">أصناف منخفضة</span>
            <span className="text-lg font-black text-amber-600 block">{stats.lowStockCount} أصناف</span>
          </div>
        </div>

        {/* Out of Stock count */}
        <div 
          onClick={() => { setStockStatus('out_of_stock'); setCurrentPage(1); }}
          className={`p-4 rounded-3xl border-2 flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${stockStatus === 'out_of_stock' ? 'bg-rose-50/10 border-rose-500/80 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 text-lg shrink-0">🚨</div>
          <div>
            <span className="text-[9px] text-slate-400 font-black uppercase">أصناف نفدت</span>
            <span className="text-lg font-black text-rose-600 block">{stats.outOfStockCount} أصناف</span>
          </div>
        </div>

        {/* Stagnant count */}
        <div 
          onClick={() => { setStockStatus('stagnant'); setCurrentPage(1); }}
          className={`p-4 rounded-3xl border-2 flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${stockStatus === 'stagnant' ? 'bg-slate-50/20 border-slate-400/80 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 text-lg shrink-0">💤</div>
          <div>
            <span className="text-[9px] text-slate-400 font-black uppercase">أصناف راكدة</span>
            <span className="text-lg font-black text-slate-600 block">{stats.stagnantCount} صنف</span>
          </div>
        </div>

        {/* Average Inventory Turnover */}
        <div 
          onClick={() => { setStockStatus('fast_moving'); setCurrentPage(1); }}
          className={`p-4 rounded-3xl border-2 flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${stockStatus === 'fast_moving' ? 'bg-indigo-50/10 border-indigo-500/80 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg shrink-0">⚡</div>
          <div>
            <span className="text-[9px] text-slate-400 font-black uppercase">حالة حركة المخزون</span>
            <span className="text-xs font-black text-indigo-600 block mt-0.5">سريعة ومعتدلة بالكامل</span>
          </div>
        </div>
      </div>

      {/* 2. Smart Alerts Panel - Redesigned & Collapsible */}
      {isManager && (lossMakingProducts.length > 0 || stats.outOfStockCount > 0 || outlierProducts.length > 0) && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between cursor-pointer select-none hover:from-slate-850 hover:to-slate-750 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-amber-400/20 rounded-xl flex items-center justify-center text-sm">⚡</span>
              <div>
                <h3 className="text-sm font-black text-white">تنبيهات ذكية</h3>
                <p className="text-[10px] text-slate-400 font-bold">توصيات تلقائية لتحسين الأداء</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!alertsOpen && (
                <span className="px-3 py-1 bg-amber-500 text-slate-900 rounded-lg text-[9px] font-black animate-pulse">
                  {lossMakingProducts.length + products.filter(p => Number(p.stockQuantity || 0) <= 0).length + outlierProducts.length} تنبيهات معلقة
                </span>
              )}
              <span 
                className="text-white text-xs transition-transform duration-350"
                style={{ transform: alertsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▼
              </span>
            </div>
          </div>
          {alertsOpen && (
            <div className="divide-y divide-slate-50 animate-fadeIn max-h-[350px] overflow-y-auto">
              {outlierProducts.map(p => (
                <div key={'outlier-'+p.id} className="flex items-start gap-3 px-5 py-3.5 bg-rose-50/20 hover:bg-rose-50/40 transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs shrink-0 mt-0.5 group-hover:bg-rose-100 transition-colors">⚠️</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700 leading-relaxed">
                      <span className="text-rose-650 font-extrabold">{p.name}</span>
                      <span className="text-rose-600 font-bold"> — خطأ إدخال محتمل! قيمة مخزون شاذة جداً</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {(() => {
                        let defaultFactor = 1;
                        if (p.units && p.units.length > 0) {
                          const defUnit = p.units.find(u => u.isDefault === 1 && Number(u.isActive) !== 0);
                          if (defUnit) {
                            defaultFactor = Number(defUnit.conversionFactor || 1);
                          }
                        }
                        const defaultQty = Number(p.stockQuantity || 0) / defaultFactor;
                        return `الكمية: ${Number(p.stockQuantity).toLocaleString()} · سعر البيع: ${Number(p.price).toLocaleString()} ج.م · القيمة الكلية للمنتج: ${Number(defaultQty * (p.wholesalePrice || p.price)).toLocaleString()} ج.م`;
                      })()}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenEditForm(p); }}
                    className="shrink-0 text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-150 transition-colors mt-0.5"
                  >تعديل القيمة</button>
                </div>
              ))}
              {lossMakingProducts.map(p => (
                <div key={'loss-'+p.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-amber-50/40 transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-xs shrink-0 mt-0.5 group-hover:bg-amber-100 transition-colors">⚠️</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700 leading-relaxed">
                      <span className="text-amber-600">{p.name}</span>
                      <span className="text-slate-400 font-bold"> — يُباع بخسارة</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      بيع: {Number(p.price).toLocaleString()} ج.م · تكلفة: {Number(p.wholesalePrice).toLocaleString()} ج.م
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenEditForm(p); }}
                    className="shrink-0 text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors mt-0.5"
                  >تعديل</button>
                </div>
              ))}
              {products.filter(p => Number(p.stockQuantity || 0) <= 0).map(p => (
                <div key={'out-'+p.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-rose-50/40 transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-xs shrink-0 mt-0.5 group-hover:bg-rose-100 transition-colors">📦</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700 leading-relaxed">
                      <span className="text-rose-600">{p.name}</span>
                      <span className="text-slate-400 font-bold"> — نفد المخزون</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      المخزون الحالي: 0 · يرجى إمداده
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenEditForm(p); }}
                    className="shrink-0 text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors mt-0.5"
                  >إمداد</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Advanced Filtering and Actions */}
      <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 outline-none"
            >
              <option value="all">كل الأقسام ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={selectedSupplier} 
              onChange={e => setSelectedSupplier(e.target.value)}
              className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 outline-none"
            >
              <option value="all">كل الموردين ({suppliers.length})</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select 
              value={stockStatus} 
              onChange={e => setStockStatus(e.target.value)}
              className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 outline-none"
            >
              <option value="all">حالة الكمية (الكل)</option>
              <option value="in_stock">متوفر بالمخزن (أكبر من 0)</option>
              <option value="low_stock">نواقص (أقل من الحد الأدنى)</option>
              <option value="out_of_stock">نفد بالكامل (0 قطع)</option>
              <option value="stagnant">راكد (بدون مبيعات 30 يوم)</option>
              <option value="fast_moving">سريع الحركة والبيع</option>
            </select>

            {isManager && (
              <select 
                value={profitStatus} 
                onChange={e => setProfitStatus(e.target.value)}
                className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 outline-none"
              >
                <option value="all">الهامش الربحي (الكل)</option>
                <option value="loss">منتجات تباع بخسارة</option>
                <option value="low_margin">هامش ربح منخفض (أقل من %12)</option>
                <option value="high_margin">هامش ربح مرتفع (أعلى من %25)</option>
              </select>
            )}
          </div>

          <div className="flex gap-2">
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 outline-none w-full md:w-auto"
            >
              <option value="created_desc">المضاف حديثاً</option>
              <option value="created_asc">المضاف قديماً</option>
              <option value="name_asc">الاسم (أ - ي)</option>
              <option value="name_desc">الاسم (ي - أ)</option>
              <option value="stock_desc">المخزون (الأعلى للأقل)</option>
              <option value="stock_asc">المخزون (الأقل للأعلى)</option>
              <option value="price_desc">السعر (الأعلى للأقل)</option>
              <option value="price_asc">السعر (الأقل للأعلى)</option>
              <option value="margin_desc">هامش الربح (الأعلى للأقل)</option>
              <option value="turnover_desc">سرعة الدوران (الأعلى للأقل)</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder="بحث سريع بالباركود..." 
                value={adminSearch} 
                onChange={e => setAdminSearch(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5 text-xs outline-none font-bold" 
              />
              <span className="absolute left-3 top-2.5 text-slate-300 text-xs">🔍</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Bulk Actions Bar (Slides from bottom when selectedIds.length > 0) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur text-white px-6 py-4 rounded-[2rem] shadow-2xl flex flex-wrap items-center justify-between gap-4 z-40 border border-slate-800 animate-slideUp w-[90%] md:w-max">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-black">أصناف محددة</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isManager && (
              <>
                <button 
                  onClick={() => setShowBulkPriceModal(true)} 
                  className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-700 transition-all"
                >
                  💵 تعديل الأسعار
                </button>
                <button 
                  onClick={() => setShowBulkReorderModal(true)} 
                  className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-700 transition-all"
                >
                  ⚠️ حد الطلب
                </button>
                <button 
                  onClick={() => setShowBulkCatModal(true)} 
                  className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-700 transition-all"
                >
                  📁 نقل القسم
                </button>
                <button 
                  onClick={() => setShowBulkSupplierModal(true)} 
                  className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-700 transition-all"
                >
                  👤 تغيير المورد
                </button>
                <button 
                  onClick={() => handleBulkToggleActive(0)} 
                  className="bg-rose-950/80 text-rose-300 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-rose-900 transition-all"
                >
                  🚫 تعطيل
                </button>
                <button 
                  onClick={() => handleBulkToggleActive(1)} 
                  className="bg-emerald-950/80 text-emerald-300 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-emerald-900 transition-all"
                >
                  🟢 تفعيل
                </button>
              </>
            )}
            <button 
              onClick={handleBulkPrintBarcode} 
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all"
            >
              🏷️ طباعة باركود
            </button>
            <button 
              onClick={handleBulkExport} 
              className="bg-slate-700 text-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-650 transition-all"
            >
              📥 تصدير Excel
            </button>
            <button 
              onClick={() => setSelectedIds([])} 
              className="text-slate-400 hover:text-white px-2 text-[10px] font-black"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* 5. Products Table */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
              <th className="px-6 py-4 text-center shrink-0 w-12">
                <input 
                  type="checkbox" 
                  checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                  onChange={handleToggleSelectAllVisible}
                  className="w-4.5 h-4.5 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500 transition-all cursor-pointer"
                />
              </th>
              <th className="px-6 py-4">المنتج والباركود</th>
              <th className="px-6 py-4">القسم والمورد</th>
              <th className="px-6 py-4">المخزون والدوران</th>
              {isManager ? (
                <>
                  <th className="px-6 py-4">الأسعار مالياً</th>
                  <th className="px-6 py-4">الهامش الفعلي</th>
                  <th className="px-6 py-4">إجمالي التكلفة</th>
                </>
              ) : (
                <th className="px-6 py-4">سعر البيع</th>
              )}
              <th className="px-6 py-4 text-center">خيارات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map(p => {
                const turnData = stats.turnoverMap[p.id] || { rate: 0, label: 'راكد', color: 'bg-slate-100 text-slate-500' };
                return (
                  <ProductRow 
                    key={p.id}
                    product={p}
                    categories={categories}
                    suppliers={suppliers}
                    isManager={isManager}
                    isSelected={selectedIds.includes(p.id)}
                    isDeleting={deletingIds.includes(p.id)}
                    onToggleSelect={handleToggleSelect}
                    onOpenDetails={handleOpenDetails}
                    onPrintBarcode={onPrintBarcode || (() => {})}
                    onOpenEdit={onOpenEditForm}
                    onDelete={handleDeleteProduct}
                    turnoverLabel={turnData.label}
                    turnoverColor={turnData.color}
                  />
                );
              })
            ) : (
              <tr>
                <td colSpan={isManager ? 8 : 6} className="px-6 py-20 text-center text-slate-300 font-bold italic">
                  لا توجد منتجات مطابقة لهذا الفلتر أو البحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            عرض الصفحة {currentPage} من أصل {totalPages} صفحات
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); }}
              className="p-3 bg-slate-50 text-slate-400 rounded-xl disabled:opacity-30 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-black text-xs"
            >
              السابق 🡒
            </button>
            
            <div className="flex gap-1">
              {Array.from({length: totalPages}, (_, i) => i + 1).map(num => (
                <button 
                  key={num}
                  onClick={() => { setCurrentPage(num); }}
                  className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === num ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  {num}
                </button>
              )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); }}
              className="p-3 bg-slate-50 text-slate-400 rounded-xl disabled:opacity-30 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-black text-xs"
            >
              🡐 التالي
            </button>
          </div>
        </div>
      )}

      {/* 6. Product Detail Drawer */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop overlay */}
            <div className="absolute inset-0 bg-slate-500 bg-opacity-40 transition-opacity" onClick={() => setDetailProduct(null)}></div>
            
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0">
              <div className="pointer-events-auto w-screen max-w-lg md:max-w-xl transform transition-transform duration-355 ease-in-out">
                <div className="flex h-full flex-col bg-white shadow-2xl overflow-y-auto">
                  
                  {/* Drawer Header */}
                  <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">ملف المنتج التفصيلي</h2>
                      <p className="text-base font-black truncate max-w-[280px] mt-0.5">{detailProduct.name}</p>
                    </div>
                    <button 
                      onClick={() => setDetailProduct(null)} 
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black transition-all"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Drawer Body */}
                  <div className="flex-1 p-6 space-y-6">
                    
                    {/* Basic financial metrics */}
                    <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-bold block">المخزون الحالي</span>
                        <span className="text-sm font-black text-slate-700 mt-1 block">
                          {detailProduct.stockQuantity} {getUnitArabic(detailProduct.baseUnit || detailProduct.unit || 'piece')}
                        </span>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <span className="text-[9px] text-slate-400 font-bold block">سعر البيع</span>
                        <span className="text-sm font-black text-slate-700 mt-1 block">
                          {detailProduct.price} ج.م
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-bold block">حد الأمان</span>
                        <span className="text-sm font-black text-rose-500 mt-1 block">
                          {detailProduct.reorderLevel ?? 5} قطع
                        </span>
                      </div>
                    </div>

                    {/* Conversion Equivalents */}
                    {detailProduct.units && detailProduct.units.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-black text-xs text-slate-600">تعادل الوحدات والعبوات الفرعية:</h4>
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs font-bold text-slate-600 space-y-1.5">
                          {detailProduct.units.filter(u => u.isActive === 1).map(u => {
                            const equiv = (Number(detailProduct.stockQuantity || 0) / u.conversionFactor).toFixed(1);
                            return (
                              <div key={u.id} className="flex justify-between items-center">
                                <span>{u.unitName} (عبوة {u.conversionFactor})</span>
                                <span className="font-black text-slate-700">{equiv} {u.unitName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sales trend chart */}
                    {renderDrawerSalesChart()}

                    {/* Quick Restock / Adjust panel (Managers only) */}
                    {isManager && (
                      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-4">
                        <h4 className="font-black text-xs text-slate-700 flex items-center gap-1.5">
                          <span>📦</span> لوحة الإمداد والتعديل السريع للمخزون:
                        </h4>
                        
                        <form onSubmit={handleQuickRestockSubmit} className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 block mb-1">مقدار التعديل (سالب للخصم)</label>
                              <input 
                                type="number" 
                                placeholder="مثال: 50 أو -10"
                                value={quickStockVal}
                                onChange={e => setQuickStockVal(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 block mb-1">سبب التعديل</label>
                              <select 
                                value={quickStockReason} 
                                onChange={e => setQuickStockReason(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                              >
                                <option value="purchase">شراء وإمداد مخزون (+)</option>
                                <option value="audit">تسوية جرد دوري (+/-)</option>
                                <option value="damage">تالف وهالك (-)</option>
                                <option value="other">أسباب مخصصة أخرى</option>
                              </select>
                            </div>
                          </div>

                          {quickStockReason === 'other' && (
                            <div>
                              <label className="text-[10px] font-black text-slate-400 block mb-1">أدخل السبب للتعديل يدوياً</label>
                              <input 
                                type="text"
                                placeholder="اكتب ملاحظة التعديل هنا..."
                                value={quickStockNotes}
                                onChange={e => setQuickStockNotes(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                required
                              />
                            </div>
                          )}

                          <button 
                            type="submit" 
                            disabled={savingStock}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-xs font-black disabled:opacity-50 transition-all"
                          >
                            {savingStock ? 'جاري حفظ التعديل...' : 'حفظ وتحديث المخزون فورا'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Inventory ledger / logs */}
                    <div className="space-y-2">
                      <h4 className="font-black text-xs text-slate-700 flex items-center gap-1.5">
                        <span>📋</span> سجل حركة الصنف الكامل (Inventory Ledger):
                      </h4>
                      
                      <div className="border border-slate-100 rounded-3xl overflow-hidden overflow-y-auto max-h-60 bg-white">
                        <table className="w-full text-right text-[10px] font-bold">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 border-b">
                              <th className="px-3 py-2">التاريخ</th>
                              <th className="px-3 py-2">النوع</th>
                              <th className="px-3 py-2">الكمية</th>
                              <th className="px-3 py-2">الحركة / القائم بها</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {loadingHistory ? (
                              <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-400">جاري تحميل سجل الحركات...</td>
                              </tr>
                            ) : historyLogs.length > 0 ? (
                              historyLogs.map(log => {
                                let badgeColor = 'bg-slate-100 text-slate-600';
                                let qtyPrefix = '';
                                if (log.type === 'SALE') {
                                  badgeColor = 'bg-rose-50 text-rose-600';
                                  qtyPrefix = '-';
                                } else if (log.type === 'RETURN') {
                                  badgeColor = 'bg-blue-50 text-blue-600';
                                  qtyPrefix = '+';
                                } else if (log.type === 'RESTOCK' || log.type === 'INITIAL') {
                                  badgeColor = 'bg-emerald-50 text-emerald-600';
                                  qtyPrefix = '+';
                                }
                                
                                const logDate = new Date(log.createdAt);
                                const dateFormatted = `${logDate.toLocaleDateString('ar-EG')} - ${logDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;

                                return (
                                  <tr key={log.id} className="hover:bg-slate-50/50">
                                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{dateFormatted}</td>
                                    <td className="px-3 py-2.5">
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black ${badgeColor}`}>
                                        {log.label}
                                      </span>
                                    </td>
                                    <td className={`px-3 py-2.5 font-black whitespace-nowrap ${qtyPrefix === '-' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                      {qtyPrefix}{log.qty} {log.unit}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <p className="text-slate-700 font-black">{log.notes}</p>
                                      <p className="text-[8px] text-slate-400">بواسطة: {log.party}</p>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-300">لا توجد حركات مسجلة لهذا المنتج بعد</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Pricing Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-zoomIn space-y-4 text-right">
            <h3 className="text-sm font-black text-slate-700">تعديل أسعار المنتجات المحددة جماعياً</h3>
            <p className="text-xs font-bold text-slate-400">سيتم تطبيق هذا التغيير على عدد {selectedIds.length} صنف تم تحديدهم.</p>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">الرقم المالي للتعديل</label>
                <select 
                  value={bulkPriceType} 
                  onChange={e => setBulkPriceType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="price">سعر البيع للمستهلك</option>
                  <option value="wholesalePrice">سعر الشراء / التكلفة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">آلية التغيير</label>
                  <select 
                    value={bulkPriceAdjust} 
                    onChange={e => setBulkPriceAdjust(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="fixed">قيمة ثابتة (ج.م)</option>
                    <option value="percent">نسبة مئوية (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">مقدار التعديل (+/-)</label>
                  <input 
                    type="number" 
                    placeholder="مثال: +10 أو -5"
                    value={bulkPriceVal}
                    onChange={e => setBulkPriceVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowBulkPriceModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl px-4 py-2 text-xs font-black"
              >
                إلغاء
              </button>
              <button 
                onClick={handleBulkPriceSubmit}
                disabled={executingBulk}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 text-xs font-black disabled:opacity-50"
              >
                {executingBulk ? 'جاري التنفيذ...' : 'تعديل وتطبيق الأسعار'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reorder Level Modal */}
      {showBulkReorderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-zoomIn space-y-4 text-right">
            <h3 className="text-sm font-black text-slate-700">تعديل حد إعادة الطلب للأصناف المحددة</h3>
            <p className="text-xs font-bold text-slate-400">تعديل حد الأمان الذي تنبه عنده لوحة التحكم لعدد {selectedIds.length} صنف.</p>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">الحد الأدنى للمخزون الجديد</label>
              <input 
                type="number" 
                placeholder="مثال: 5 أو 10 قطع"
                value={bulkReorderVal}
                onChange={e => setBulkReorderVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowBulkReorderModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl px-4 py-2 text-xs font-black"
              >
                إلغاء
              </button>
              <button 
                onClick={handleBulkReorderSubmit}
                disabled={executingBulk}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 text-xs font-black disabled:opacity-50"
              >
                {executingBulk ? 'جاري الحفظ...' : 'تحديث حد الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Category Modal */}
      {showBulkCatModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-zoomIn space-y-4 text-right">
            <h3 className="text-sm font-black text-slate-700">نقل الأصناف المحددة إلى قسم جديد</h3>
            <p className="text-xs font-bold text-slate-400">سيتم نقل جميع الأصناف المحددة ({selectedIds.length}) إلى القسم المختار.</p>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">اختر القسم الجديد</label>
              <select 
                value={bulkCatVal} 
                onChange={e => setBulkCatVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="">اختر القسم...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowBulkCatModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl px-4 py-2 text-xs font-black"
              >
                إلغاء
              </button>
              <button 
                onClick={handleBulkCategorySubmit}
                disabled={executingBulk || !bulkCatVal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 text-xs font-black disabled:opacity-50"
              >
                {executingBulk ? 'جاري النقل...' : 'تحديث وتغيير القسم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Supplier Modal */}
      {showBulkSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-zoomIn space-y-4 text-right">
            <h3 className="text-sm font-black text-slate-700">تغيير المورد المرتبط للأصناف المحددة</h3>
            <p className="text-xs font-bold text-slate-400">سيتم تحديث المورد لعدد {selectedIds.length} صنف تم اختيارهم.</p>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">اختر المورد الجديد</label>
              <select 
                value={bulkSupplierVal} 
                onChange={e => setBulkSupplierVal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="">اختر المورد...</option>
                <option value="none">بدون مورد (إزالة الارتباط)</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowBulkSupplierModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl px-4 py-2 text-xs font-black"
              >
                إلغاء
              </button>
              <button 
                onClick={handleBulkSupplierSubmit}
                disabled={executingBulk || !bulkSupplierVal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 text-xs font-black disabled:opacity-50"
              >
                {executingBulk ? 'جاري التعديل...' : 'تحديث وتغيير المورد'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductsTab;
