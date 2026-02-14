import React, { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: any = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // استخدام BarcodeDetector API إذا كان مدعوماً (Chrome/Android)
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'code_128', 'qr_code', 'upc_a']
          });

          interval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && isScanning) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const code = barcodes[0].rawValue;
                  onScan(code);
                  setIsScanning(false); // توقف مؤقت بعد النجاح
                  if (navigator.vibrate) navigator.vibrate(200);
                  setTimeout(() => onClose(), 500);
                }
              } catch (err) {
                console.error("Detection error:", err);
              }
            }
          }, 500);
        } else {
          setError("متصفحك لا يدعم خاصية التعرف التلقائي على الباركود مباشرة. يرجى استخدام متصفح كروم على أندرويد.");
        }
      } catch (err) {
        setError("فشل الوصول للكاميرا. تأكد من إعطاء الصلاحيات اللازمة.");
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (interval) clearInterval(interval);
    };
  }, [onScan, onClose, isScanning]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 opacity-40">
        {/* تأثير خلفية متحرك */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 overflow-hidden border-4 border-white/20 rounded-[3rem] shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* مربع التركيز (Scanner Overlay) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-48 border-2 border-emerald-500 rounded-3xl relative">
            <div className="absolute inset-0 border-[40px] border-black/40 -m-[2px]"></div>
            {/* خط الليزر المتحرك */}
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scanLine"></div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-rose-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-8 px-6 text-center text-white space-y-4 max-w-sm">
        <h3 className="text-xl font-black">وجه الكاميرا نحو الباركود</h3>
        <p className="text-sm text-white/60 font-bold leading-relaxed">
          {error || "سيتم التعرف على كود المنتج تلقائياً بمجرد وضعه داخل المربع."}
        </p>
        <button 
          onClick={onClose}
          className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-transform"
        >
          إلغاء المسح
        </button>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scanLine {
          animation: scanLine 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;