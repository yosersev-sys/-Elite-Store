
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
    image: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=1600',
    title: 'عالم من الأناقة الذكية',
    subtitle: 'اكتشف أحدث صيحات التكنولوجيا بأسعار تنافسية',
    cta: 'تسوق الآن'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600',
    title: 'تشكيلة الصيف الجديدة',
    subtitle: 'أزياء عصرية تناسب جميع الأذواق والمناسبات',
    cta: 'عرض المجموعات'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1600',
    title: 'منزلك.. بلمسة عصرية',
    subtitle: 'عروض حصرية على مستلزمات المنزل والمطبخ الذكي',
    cta: 'تصفح العروض'
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
    <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden group shadow-2xl mb-8">
      {/* Slides */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Image with Overlay */}
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          
          {/* Content */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-20 text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 animate-slideDown">
              {slide.title}
            </h2>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl animate-fadeIn">
              {slide.subtitle}
            </p>
            <div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold transition transform hover:scale-105 shadow-lg">
                {slide.cta}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition opacity-0 group-hover:opacity-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition opacity-0 group-hover:opacity-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 transition-all rounded-full ${
              index === current ? 'w-8 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
