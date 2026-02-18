
import React, { useState, useEffect, useCallback } from 'react';

const SLIDES = [
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
  }
];

const Slider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const nextSlide = useCallback(() => setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1)), []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative w-full h-[300px] md:h-[500px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group shadow-2xl mb-8 bg-slate-200">
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="absolute inset-0 bg-black/30 z-10"></div>
          <img
            src={slide.image}
            alt={slide.title}
            width="1600"
            height="500"
            // تحسين الـ LCP للصورة الأولى
            {...(index === 0 ? { fetchpriority: "high" } : { loading: "lazy" })}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-20 text-white">
            <h2 className="text-2xl md:text-6xl font-black mb-2 md:mb-4">{slide.title}</h2>
            <p className="text-xs md:text-xl text-gray-100 mb-4 md:mb-8 max-w-xl font-bold">{slide.subtitle}</p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`الانتقال للشريحة رقم ${index + 1}`}
            className={`h-2 transition-all rounded-full ${index === current ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
