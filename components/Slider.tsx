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
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600',
    title: 'خضروات طازجة يومياً',
    subtitle: 'من المزارع مباشرة إلى باب منزلك، جودة نضمنها لك',
    cta: 'تسوق الخضروات'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=1600',
    title: 'فواكه موسمية لذيذة',
    subtitle: 'تشكيلة واسعة من الفواكه الطازجة المليئة بالفيتامينات',
    cta: 'تسوق الفواكه'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=1600',
    title: 'عروض السوبر ماركت',
    subtitle: 'توفير حقيقي على كافة مستلزمات منزلك اليومية',
    cta: 'مشاهدة العروض'
  }
];

const Slider: React.FC = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative w-full h-[350px] md:h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group shadow-2xl mb-8">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <div className="absolute inset-0 bg-black/30 z-10"></div>
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            // تحسين الأداء: إعطاء أولوية قصوى لأول صورة (LCP)
            fetchpriority={index === 0 ? "high" : "low"}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-20 text-white">
            <h2 className="text-3xl md:text-6xl font-black mb-2 md:mb-4 animate-slideDown leading-tight">
              {slide.title}
            </h2>
            <p className="text-sm md:text-xl text-gray-100 mb-6 md:mb-8 max-w-xl animate-fadeIn font-bold">
              {slide.subtitle}
            </p>
            <div>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full font-black transition transform hover:scale-105 shadow-lg text-sm md:text-base">
                {slide.cta}
              </button>
            </div>
          </div>
        </div>
      ))}

      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 hover:bg-white/40 text-white transition opacity-0 group-hover:opacity-100">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 hover:bg-white/40 text-white transition opacity-0 group-hover:opacity-100">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
};

export default Slider;