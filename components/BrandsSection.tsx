
import React from 'react';

const BRANDS = [
  { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
  { name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
  { name: 'Sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg' },
  { name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
  { name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
  { name: 'HP', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg' },
  { name: 'LG', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg' },
  { name: 'Dell', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg' },
];

const BrandsSection: React.FC = () => {
  // تكرار المصفوفة لضمان حركة مستمرة وسلسة في التمرير اللانهائي
  const duplicatedBrands = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="relative py-16 bg-white rounded-3xl border border-gray-100 shadow-sm mb-12 overflow-hidden group">
      {/* العنوان الجانبي */}
      <div className="absolute top-4 right-8 z-10">
        <h3 className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-1 rounded-full inline-block">
          شركاء النجاح
        </h3>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-800">العلامات التجارية العالمية</h2>
        <p className="text-gray-400 text-sm mt-1">نحن وكلاء معتمدون لأكبر الشركات حول العالم</p>
      </div>

      {/* حاوية الشريط المتحرك */}
      <div className="relative flex overflow-hidden select-none">
        {/* تأثير التلاشي عند الحواف */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

        {/* الشريط المتحرك - استخدام Tailwind CSS Animation */}
        <div className="flex animate-scroll hover:pause whitespace-nowrap items-center py-4">
          {duplicatedBrands.map((brand, index) => (
            <div 
              key={`${brand.name}-${index}`} 
              className="mx-12 flex-shrink-0 flex items-center justify-center w-32 h-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer transform hover:scale-110"
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

      {/* إضافة الأنماط اللازمة للحركة */}
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
