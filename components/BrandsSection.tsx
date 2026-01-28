
import React, { useState, useEffect } from 'react';
import { Brand } from '../types';
import { ApiService } from '../services/api';

const BrandsSection: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const data = await ApiService.getBrands();
      setBrands(data);
    };
    fetchBrands();
  }, []);

  if (brands.length === 0) return null;

  // Duplicate brands for continuous infinite scroll
  const duplicatedBrands = [...brands, ...brands, ...brands];

  return (
    <section className="relative py-16 bg-white rounded-3xl border border-gray-100 shadow-sm mb-12 overflow-hidden group">
      <div className="absolute top-4 right-8 z-10">
        <h3 className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-1 rounded-full inline-block">
          شركاء النجاح
        </h3>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-800">العلامات التجارية العالمية</h2>
        <p className="text-gray-400 text-sm mt-1">نحن وكلاء معتمدون لأكبر الشركات حول العالم</p>
      </div>

      <div className="relative flex overflow-hidden select-none">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

        <div className="flex animate-scroll hover:pause whitespace-nowrap items-center py-4">
          {duplicatedBrands.map((brand, index) => (
            <div 
              key={`${brand.id}-${index}`} 
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
