
import React from 'react';

const BRANDS = [
  { name: 'Almarai', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Almarai_logo.svg/1200px-Almarai_logo.svg.png' },
  { name: 'Nestle', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Nestle_text_logo.svg/1200px-Nestle_text_logo.svg.png' },
  { name: 'Nadine', logo: 'https://logos-world.net/wp-content/uploads/2021/08/Danone-Logo.png' },
  { name: 'Puck', logo: 'https://www.arla.com/siteassets/arla-global/brands/puck/puck-logo.png?width=250&height=250&mode=crop' },
  { name: 'KDD', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/KDD_logo.png' },
  { name: 'Sadia', logo: 'https://www.sadia.com.sa/wp-content/themes/sadia/images/logo.png' },
];

const BrandsSection: React.FC = () => {
  const duplicatedBrands = [...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="relative py-6 bg-white rounded-[2rem] border border-green-50 shadow-sm mb-6 overflow-hidden group">
      <div className="absolute top-2 right-6 z-10">
        <h3 className="text-green-600 font-black text-[9px] bg-green-50 px-3 py-0.5 rounded-full inline-block">
          شركاء الجودة
        </h3>
      </div>

      <div className="text-center mb-4">
        <h2 className="text-base font-black text-gray-800 tracking-tighter">ماركات موثوقة</h2>
      </div>

      <div className="relative flex overflow-hidden select-none">
        {/* Fade gradients for smooth scrolling effect */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10"></div>

        <div className="flex animate-scroll hover:pause whitespace-nowrap items-center">
          {duplicatedBrands.map((brand, index) => (
            <div 
              key={`${brand.name}-${index}`} 
              className="mx-6 flex-shrink-0 flex items-center justify-center w-20 h-10 opacity-40 hover:opacity-100 transition-all duration-500 cursor-pointer transform hover:scale-110"
            >
              <img 
                src={brand.logo} 
                alt={brand.name} 
                className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(25%); }
        }
        .animate-scroll {
          animation: scroll 25s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default BrandsSection;
