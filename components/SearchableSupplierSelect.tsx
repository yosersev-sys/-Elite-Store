import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Supplier } from '../types';

interface SearchableSupplierSelectProps {
  suppliers: Supplier[];
  value: string;
  onChange: (supplierId: string) => void;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  className?: string;
  inputBgClass?: string;
}

const SearchableSupplierSelect: React.FC<SearchableSupplierSelectProps> = ({
  suppliers = [],
  value,
  onChange,
  placeholder = 'اختر المورد...',
  allowAll = false,
  allLabel = 'جميع الموردين',
  className = '',
  inputBgClass = 'bg-white'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => String(s.id) === String(value));
  }, [suppliers, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) || 
      (s.companyName && s.companyName.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  }, [suppliers, search]);

  const displayLabel = useMemo(() => {
    if ((!value || value === '') && allowAll) return allLabel;
    if (selectedSupplier) {
      return `${selectedSupplier.name}${selectedSupplier.companyName ? ` (${selectedSupplier.companyName})` : ''}`;
    }
    return placeholder;
  }, [value, allowAll, allLabel, selectedSupplier, placeholder]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setSearch('');
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 ${inputBgClass} border border-slate-200 rounded-xl font-bold text-xs text-slate-800 hover:border-indigo-400 outline-none transition-all shadow-sm cursor-pointer`}
      >
        <span className="truncate">{displayLabel}</span>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[4500] p-2 animate-fadeIn text-right dir-rtl" dir="rtl">
          <div className="relative mb-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث باسم المورد، الشركة، أو الهاتف..."
              className="w-full px-3 py-2.5 pl-8 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            ) : (
              <span className="absolute left-2.5 top-2.5 text-slate-300 text-xs">🔍</span>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
            {allowAll && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-between ${
                  !value || value === '' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{allLabel}</span>
                {(!value || value === '') && <span>✓</span>}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-bold">لا يوجد مورد بهذا الاسم</div>
            ) : (
              filtered.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col gap-0.5 ${
                    String(value) === String(s.id) ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-slate-900 font-black">{s.name}</span>
                    {String(value) === String(s.id) && <span className="text-indigo-600 font-black">✓</span>}
                  </div>
                  {(s.companyName || s.phone) && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      {s.companyName ? `🏢 ${s.companyName}` : ''} {s.phone ? ` 📞 ${s.phone}` : ''}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSupplierSelect;
