
import React, { useState } from 'react';

const BRANDS = [
  { name: 'المراعي', domain: 'almarai.com' },
  { name: 'نستله', domain: 'nestle.com' },
  { name: 'نادك', domain: 'nadec.com.sa' },
  { name: 'بوك', domain: 'puckarabia.com' },
  { name: 'كي دي دي', domain: 'kddc.com' },
  { name: 'ساديا', domain: 'sadia.com' },
  { name: 'لورباك', domain: 'lurpak.com' },
  { name: 'صافولا', domain: 'savola.com' }
];

interface BrandLogoProps {
  brand: typeof BRANDS[0];
}

const BrandLogo: React.FC<BrandLogoProps> = ({ brand }) => {
  const [error, setError] = useState(false);
  const logoUrl = `https://logo.clearbit.com/${brand.domain}?size=128`;

  return (
    <div className="mx-6 md:mx-10 flex-shrink-0 flex items-center justify-center min-w-[100px] h-14 transition-all duration-500 transform hover:scale-110 cursor-pointer">
      {!error ? (
        <img 
          src={logoUrl} 
          alt={brand.name} 
          className="max-h-12 w-auto object-contain grayscale hover:grayscale-0 opacity-40 hover:opacity-100 transition-all duration-500"
          onError={() => setError(true)}
          loading="lazy"
        />
      ) : (
        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 font-black text-xs whitespace-nowrap">
          {brand.name}
        </div>
      )}
    </div>
  );
};

const BrandsSection: React.FC = () => {
  const duplicatedBrands = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="relative py-8 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm mb-12 overflow-hidden group">
      <div className="absolute top-3 right-8 z-10">
        <span className="flex items-center gap-2 text-emerald-600 font-black text-[9px] bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-100/50">
          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
          شركاء الجودة
        </span>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-sm md:text-lg font-black text-slate-800">ماركات عالمية نوفرها لك</h2>
      </div>

      <div className="relative flex overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        <div className="flex animate-scroll hover:pause-scroll items-center py-2">
          {duplicatedBrands.map((brand, index) => (
            <BrandLogo key={`${brand.domain}-${index}`} brand={brand} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(33.33%); }
        }
        .animate-scroll {
          display: flex;
          width: fit-content;
          animation: scroll 40s linear infinite;
        }
        .pause-scroll:hover {
          animation-play-state: paused;
        }
        [dir="rtl"] .animate-scroll {
          animation: scroll-rtl 40s linear infinite;
        }
        @keyframes scroll-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(33.33%); }
        }
      `}</style>
    </section>
  );
};

export default BrandsSection;
