
import React from 'react';

const BRANDS = [
  { name: 'Almarai', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Almarai_logo.svg/1200px-Almarai_logo.svg.png' },
  { name: 'Nestle', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Nestle_text_logo.svg/1200px-Nestle_text_logo.svg.png' },
  { name: 'Danone', logo: 'https://logos-world.net/wp-content/uploads/2021/08/Danone-Logo.png' },
  { name: 'Puck', logo: 'https://www.arla.com/siteassets/arla-global/brands/puck/puck-logo.png?width=250&height=250&mode=crop' },
  { name: 'KDD', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/KDD_logo.png' },
  { name: 'Sadia', logo: 'https://www.sadia.com.sa/wp-content/themes/sadia/images/logo.png' },
];

interface BrandsSectionProps {
  onSearch: (query: string) => void;
}

const BrandsSection: React.FC<BrandsSectionProps> = ({ onSearch }) => {
  const duplicatedBrands = [...BRANDS, ...BRANDS, ...BRANDS];

  const handleBrandClick = (name: string) => {
    onSearch(name);
    // التمرير لقائمة المنتجات
    const el = document.getElementById('products-list');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-16 bg-white rounded-[3rem] border border-green-50 shadow-sm mb-12 overflow-hidden group">
      <div className="absolute top-4 right-8 z-10">
        <h3 className="text-green-600 font-black text-sm bg-green-50 px-4 py-1 rounded-full inline-block">
          شركاء الجودة
        </h3>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-black text-gray-800 tracking-tighter">العلامات التجارية الموثوقة</h2>
        <p className="text-gray-400 text-sm mt-1 font-bold">اضغط على الشعار لعرض منتجات الشركة</p>
      </div>

      <div className="relative flex overflow-hidden select-none">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

        <div className="flex animate-scroll hover:pause whitespace-nowrap items-center py-4">
          {duplicatedBrands.map((brand, index) => (
            <div 
              key={`${brand.name}-${index}`} 
              onClick={() => handleBrandClick(brand.name)}
              className="mx-12 flex-shrink-0 flex items-center justify-center w-32 h-16 opacity-60 hover:opacity-100 transition-all duration-500 cursor-pointer transform hover:scale-110"
            >
              <img 
                src={brand.logo} 
                alt={brand.name} 
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(33.33%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default BrandsSection;
