import React, { useState, useEffect, useCallback } from 'react';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=800',
    title: 'خضروات طازجة يومياً',
    subtitle: 'من المزارع مباشرة إلى باب منزلك، جودة نضمنها لك',
    cta: 'تسوق الخضروات'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=60&w=800',
    title: 'فواكه موسمية لذيذة',
    subtitle: 'تشكيلة واسعة من الفواكه الطازجة المليئة بالفيتامينات',
    cta: 'تسوق الفواكه'
  }
];

const Slider: React.FC = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 7000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-slate-200">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div className="absolute inset-0 bg-black/25 z-10"></div>
          <img
            src={slide.image}
            alt={slide.title}
            width="800"
            height="450"
            className="w-full h-full object-cover"
            // @ts-ignore
            fetchpriority={index === 0 ? "high" : "low"}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-20 text-white">
            <h2 className="text-3xl md:text-6xl font-black mb-2 md:mb-4 drop-shadow-lg animate-fadeIn">
              {slide.title}
            </h2>
            <p className="text-sm md:text-2xl text-gray-100 mb-6 md:mb-10 max-w-lg font-bold opacity-90 drop-shadow-md">
              {slide.subtitle}
            </p>
            <div>
              <button className="bg-emerald-600 text-white px-6 py-3 md:px-10 md:py-4 rounded-full font-black shadow-2xl text-sm md:text-lg active:scale-95 transition-all hover:bg-emerald-500">
                {slide.cta}
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {SLIDES.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-emerald-500' : 'w-2 bg-white/50'}`}></div>
        ))}
      </div>
    </div>
  );
};

export default Slider;