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
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
    title: 'خضروات طازجة يومياً',
    subtitle: 'من المزارع مباشرة إلى باب منزلك، جودة نضمنها لك',
    cta: 'تسوق الخضروات'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=1200',
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
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] max-h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div className="absolute inset-0 bg-black/20 z-10"></div>
          <img
            src={slide.image}
            alt={slide.title}
            width="1200"
            height="500"
            className="w-full h-full object-cover"
            fetchpriority={index === 0 ? "high" : "low"}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-20 text-white">
            <h2 className="text-2xl md:text-5xl font-black mb-1 md:mb-4 animate-fadeIn">
              {slide.title}
            </h2>
            <p className="text-xs md:text-xl text-gray-100 mb-4 md:mb-8 max-w-lg font-bold opacity-90">
              {slide.subtitle}
            </p>
            <div>
              <button className="bg-emerald-600 text-white px-5 py-2 md:px-8 md:py-3 rounded-full font-black shadow-lg text-xs md:text-base active:scale-95 transition-transform">
                {slide.cta}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Slider;