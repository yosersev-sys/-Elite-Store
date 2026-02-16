
import React from 'react';
import { Category, View } from '../types';

interface FooterProps {
  categories: Category[];
  onNavigate: (view: View) => void;
  onCategorySelect: (id: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-12 pb-8 mt-20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center space-y-6">
          
          {/* Logo & Name */}
          <div className="flex items-center gap-2 opacity-80">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
              <img src="https://soqelasr.com/shopping-bag.png" className="w-5 h-5 object-contain" alt="Logo" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter">سوق العصر</h2>
          </div>

          {/* Minimal Links */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <button onClick={() => onNavigate('store')} className="text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors">الرئيسية</button>
            <button onClick={() => onNavigate('cart')} className="text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors">سلة المشتريات</button>
            <button onClick={() => onNavigate('my-orders')} className="text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors">طلباتي</button>
            <button onClick={() => onNavigate('profile')} className="text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors">حسابي</button>
          </nav>

          {/* Divider */}
          <div className="w-12 h-px bg-slate-100"></div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              صنع بكل حب في فاقوس &copy; {new Date().getFullYear()}
            </p>
            <p className="text-[9px] font-black text-emerald-500 mt-1 uppercase tracking-tighter">
              SOQ AL-ASR - FAQOUS
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
