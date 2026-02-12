
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
    <div className="relative w-full h-[400px] md:h-[550px] rounded-[3.5rem] overflow-hidden group shadow-2xl mb-8 border border-orange-50">
      {/* Slides */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Image with Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[5s]"
          />
          
          {/* Content */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-20 text-white">
            <h2 className="text-4xl md:text-7xl font-black mb-4 animate-slideUp tracking-tighter">
              {slide.title}
            </h2>
            <p className="text-lg md:text-2xl text-orange-50 mb-8 max-w-xl animate-fadeIn font-bold opacity-90">
              {slide.subtitle}
            </p>
            <div className="animate-slideUp" style={{ animationDelay: '200ms' }}>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-black transition transform hover:scale-105 shadow-xl shadow-orange-900/20 text-lg">
                {slide.cta}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-white/10 hover:bg-white/30 backdrop-blur-md text-white transition opacity-0 group-hover:opacity-100"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-white/10 hover:bg-white/30 backdrop-blur-md text-white transition opacity-0 group-hover:opacity-100"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2.5 transition-all rounded-full ${
              index === current ? 'w-12 bg-orange-500 shadow-lg' : 'w-2.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
