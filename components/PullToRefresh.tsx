import React, { useState, useEffect, useRef } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const threshold = 80; // المسافة المطلوبة لبدء التحديث
  const maxPull = 150; // أقصى مسافة للسحب

  const handleTouchStart = (e: TouchEvent) => {
    // نبدأ السحب فقط إذا كان المستخدم في أعلى الصفحة تماماً
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // إبطاء حركة السحب لتعطي شعوراً بالمقاومة (Rubber band effect)
      const easedDiff = Math.min(diff * 0.4, maxPull);
      setPullDistance(easedDiff);
      
      // منع المتصفح من التمرير الافتراضي أثناء السحب لأسفل
      if (diff > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // تثبيت المؤشر عند نقطة التحميل
      
      try {
        if (navigator.vibrate) navigator.vibrate(10); // اهتزاز خفيف عند بدء التحديث
        await onRefresh();
      } catch (err) {
        console.error("Refresh failed", err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  useEffect(() => {
    const options = { passive: false };
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, isPulling]);

  // حساب الشفافية والدوران بناءً على مسافة السحب
  const rotation = (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div className="relative">
      {/* مؤشر التحميل العائم */}
      <div 
        className="fixed left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-transform duration-200"
        style={{ 
          top: `${pullDistance - 50}px`, 
          opacity: opacity,
          transform: `translateX(-50%) rotate(${rotation}deg)` 
        }}
      >
        <div className="bg-white p-3 rounded-full shadow-xl border border-slate-100 flex items-center justify-center">
          <svg 
            className={`w-6 h-6 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isRefreshing ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            )}
          </svg>
        </div>
      </div>

      {/* محتوى التطبيق مع تأثير الإزاحة عند السحب */}
      <div 
        className="transition-transform duration-200"
        style={{ transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'none' }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;