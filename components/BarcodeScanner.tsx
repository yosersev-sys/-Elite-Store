import React, { useEffect, useRef, useState } from 'react';
import { 
  MultiFormatReader, 
  BarcodeFormat, 
  DecodeHintType, 
  HTMLCanvasElementLuminanceSource, 
  HybridBinarizer, 
  BinaryBitmap 
} from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // لحفظ المراجع محدثة دون التسبب في إعادة تشغيل الـ useEffect الخاص بالكاميرا
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const isScanningRef = useRef(isScanning);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: any = null;
    let isUnmounted = false;

    const startCamera = async () => {
      try {
        // 1. طلب الوصول للكاميرا الخلفية الأساسية بدقة عالية لضمان وضوح خطوط الباركود للآيفون
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('muted', 'true');
          await videoRef.current.play().catch(err => console.warn("Video play failed:", err));
        }

        // استخدام BarcodeDetector API إذا كان مدعوماً (Chrome/Android)
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'code_128', 'qr_code', 'upc_a']
          });

          interval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && isScanningRef.current) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const code = barcodes[0].rawValue;
                  onScanRef.current(code);
                  setIsScanning(false); // توقف مؤقت بعد النجاح
                  if (navigator.vibrate) navigator.vibrate(200);
                  setTimeout(() => onCloseRef.current(), 500);
                }
              } catch (err) {
                console.error("Detection error:", err);
              }
            }
          }, 500);
        } else {
          // البديل الموثوق للآيفون (iOS): التقاط إطارات الكاميرا ورسمها على كانفاس لفك تشفيرها يدوياً
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.CODE_128,
            BarcodeFormat.QR_CODE,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.EAN_8
          ]);
          hints.set(DecodeHintType.TRY_HARDER, true);

          const reader = new MultiFormatReader();
          reader.setHints(hints);

          const scanFrame = () => {
            if (isUnmounted || !isScanningRef.current || !videoRef.current) return;

            const video = videoRef.current;
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              const width = video.videoWidth;
              const height = video.videoHeight;
              
              if (width > 0 && height > 0) {
                canvas.width = width;
                canvas.height = height;
                
                if (ctx) {
                  // رسم الإطار الحالي للفيديو على الكانفاس
                  ctx.drawImage(video, 0, 0, width, height);
                  
                  try {
                    const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
                    const binarizer = new HybridBinarizer(luminanceSource);
                    const binaryBitmap = new BinaryBitmap(binarizer);
                    
                    const result = reader.decode(binaryBitmap);
                    if (result) {
                      const code = result.getText();
                      onScanRef.current(code);
                      setIsScanning(false);
                      if (navigator.vibrate) navigator.vibrate(200);
                      setTimeout(() => onCloseRef.current(), 500);
                      return; // التوقف عن إرسال طلبات أخرى في حال النجاح
                    }
                  } catch (e) {
                    // تجاهل أخطاء عدم العثور على باركود في الإطار الحالي
                  }
                }
              }
            }
            
            // طلب الإطار التالي طالما أن المسح نشط
            if (!isUnmounted && isScanningRef.current) {
              requestAnimationFrame(scanFrame);
            }
          };

          // بدء تشغيل حلقة المسح
          requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        setError("فشل الوصول للكاميرا. تأكد من إعطاء الصلاحيات اللازمة.");
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      isUnmounted = true;
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (interval) clearInterval(interval);
    };
  }, []);

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
          muted
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