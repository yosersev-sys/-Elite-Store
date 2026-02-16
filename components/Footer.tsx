
import React from 'react';
import { Category, View } from '../types';

interface FooterProps {
  categories: Category[];
  onNavigate: (view: View) => void;
  onCategorySelect: (id: string) => void;
}

const Footer: React.FC<FooterProps> = ({ categories, onNavigate, onCategorySelect }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10 md:pb-12 mt-20 rounded-t-[3rem] md:rounded-t-[5rem] overflow-hidden relative">
      {/* Decorative Blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <img src="https://soqelasr.com/shopping-bag.png" className="w-8 h-8 object-contain" alt="Logo" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter">سوق العصر</h2>
            </div>
            <p className="text-sm font-bold leading-relaxed text-slate-400">
              أول منصة تسوق إلكترونية متكاملة في مدينة فاقوس. نهدف لتوفير أجود المنتجات الطازجة والمستلزمات المنزلية بأسرع وقت وأقل جهد.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon="f" href="#" color="bg-blue-600" />
              <SocialIcon icon="in" href="#" color="bg-rose-500" />
              <SocialIcon icon="wa" href="https://wa.me/201026034170" color="bg-emerald-500" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-white font-black text-lg border-r-4 border-emerald-500 pr-3">روابط تهمك</h3>
            <ul className="space-y-3">
              <FooterLink label="الرئيسية" onClick={() => onNavigate('store')} />
              <FooterLink label="سلة المشتريات" onClick={() => onNavigate('cart')} />
              <FooterLink label="طلباتي السابقة" onClick={() => onNavigate('my-orders')} />
              <FooterLink label="إعدادات الحساب" onClick={() => onNavigate('profile')} />
              <FooterLink label="سياسة التوصيل" onClick={() => {}} />
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            <h3 className="text-white font-black text-lg border-r-4 border-emerald-500 pr-3">أقسام المتجر</h3>
            <ul className="space-y-3">
              {categories.slice(0, 5).map(cat => (
                <FooterLink 
                  key={cat.id} 
                  label={cat.name} 
                  onClick={() => { onCategorySelect(cat.id); onNavigate('store'); }} 
                />
              ))}
              <FooterLink label="كل الأقسام..." onClick={() => { onCategorySelect('all'); onNavigate('store'); }} />
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-white font-black text-lg border-r-4 border-emerald-500 pr-3">تواصل معنا</h3>
            <div className="space-y-4">
              <ContactItem icon="📍" title="العنوان" text="فاقوس، الشرقية - شارع المحطة" />
              <ContactItem icon="📞" title="الجوال" text="01026034170" isLtr />
              <ContactItem icon="✉️" title="البريد" text="support@souqalasr.com" />
            </div>
            <div className="pt-4">
               <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">مواعيد التوصيل</p>
                  <p className="text-xs font-bold text-slate-300">يومياً من 8 صباحاً حتى 12 مساءً</p>
               </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-500 text-center md:text-right">
            جميع الحقوق محفوظة © {new Date().getFullYear()} لـ <span className="text-emerald-500">سوق العصر - فاقوس</span>
          </p>
          <div className="flex items-center gap-2 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
            <div className="bg-white px-2 py-0.5 rounded text-[8px] font-black text-slate-900">CASH</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Fixed: Using React.FC to properly handle React internal props like 'key' in mapped lists.
const FooterLink: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
  <li>
    <button 
      onClick={onClick}
      className="text-sm font-bold text-slate-400 hover:text-emerald-400 hover:translate-x-[-5px] transition-all duration-300"
    >
      {label}
    </button>
  </li>
);

// Fixed: Added basic typing for better consistency.
const SocialIcon: React.FC<{ icon: string, href: string, color: string }> = ({ icon, href, color }) => (
  <a 
    href={href} 
    className={`w-10 h-10 ${color} text-white rounded-xl flex items-center justify-center font-black shadow-lg hover:scale-110 transition-transform active:scale-90`}
  >
    {icon}
  </a>
);

// Fixed: Added basic typing for better consistency.
const ContactItem: React.FC<{ icon: string, title: string, text: string, isLtr?: boolean }> = ({ icon, title, text, isLtr }) => (
  <div className="flex items-start gap-3">
    <span className="text-xl">{icon}</span>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{title}</p>
      <p className={`text-sm font-black text-slate-200 ${isLtr ? 'text-left' : ''}`} dir={isLtr ? 'ltr' : 'rtl'}>{text}</p>
    </div>
  </div>
);

export default Footer;
