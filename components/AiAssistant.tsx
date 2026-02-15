
import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { parseUserShoppingList } from '../services/geminiService';

interface AiAssistantProps {
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ products, onAddToCart, showNotification }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // وظيفة لتنظيف النص للبحث (إزالة ال التعريف والزيادات)
  const cleanForMatch = (text: string) => {
    return text.toLowerCase()
      .replace(/^(ال)/, '') // إزالة ال التعريف في البداية
      .replace(/(ى)$/, 'ي') // توحيد الياء والألف اللينة
      .replace(/(ة)$/, 'ه') // توحيد التاء المربوطة
      .trim();
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    const userText = userInput;
    setUserInput('');
    setHistory(prev => [...prev, { role: 'user', text: userText }]);
    setIsProcessing(true);

    try {
      const parsedItems = await parseUserShoppingList(userText);
      
      if (!parsedItems || parsedItems.length === 0) {
        setHistory(prev => [...prev, { 
          role: 'ai', 
          text: "لم أستطع تحديد أي أصناف من رسالتك. جرب كتابة قائمة واضحة مثل: 'واحد زيت و 2 كيلو بطاطس'." 
        }]);
      } else {
        let foundCount = 0;
        let foundItemsNames: string[] = [];
        let missingItems: string[] = [];

        for (const req of parsedItems) {
          const reqItemClean = cleanForMatch(req.item);
          
          // محرك بحث مرن: يبحث عن الكلمة داخل اسم المنتج أو العكس
          const match = products.find(p => {
            const pNameClean = cleanForMatch(p.name);
            return pNameClean.includes(reqItemClean) || reqItemClean.includes(pNameClean);
          });

          if (match) {
            onAddToCart(match, req.qty);
            foundCount++;
            foundItemsNames.push(`${req.qty} ${match.name}`);
          } else {
            missingItems.push(req.item);
          }
        }

        let aiResponse = "";
        if (foundCount > 0) {
          aiResponse = `أبشر! تمت إضافة الأصناف التالية لسلتك: \n${foundItemsNames.map(n => `✅ ${n}`).join('\n')}`;
        }

        if (missingItems.length > 0) {
          const missingMsg = `\n\nللأسف لم أجد هذه الأصناف في المتجر حالياً: \n${missingItems.map(n => `❌ ${n}`).join('\n')}`;
          aiResponse += missingMsg;
        }

        if (foundCount === 0 && missingItems.length > 0) {
          aiResponse = "فهمت طلبك، ولكن للأسف جميع الأصناف التي ذكرتها غير متوفرة في المتجر حالياً. حاول البحث عن أصناف أخرى.";
        }
        
        setHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
        if (foundCount > 0) showNotification(`تمت إضافة ${foundCount} صنف بواسطة المساعد`);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', text: "حدث خطأ غير متوقع. يرجى التأكد من اتصال الإنترنت والمحاولة مرة أخرى." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-32 left-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[320px] md:w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden animate-slideUp flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-xl animate-bounce">🤖</div>
              <div>
                <h4 className="font-black text-sm leading-none">مساعد سوق العصر</h4>
                <p className="text-[9px] text-emerald-400 font-bold uppercase mt-1">ذكي، سريع، ومن فاقوس</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">✕</button>
          </div>

          {/* Chat History */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50">
            {history.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3 opacity-20">📝</div>
                <p className="font-black text-xs text-slate-500">أهلاً بك! أنا مساعدك الذكي.</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">اكتب لي مثلاً: "عايز 2 كيلو طماطم وكرتونة بيض"</p>
              </div>
            )}
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-[1.5rem] text-xs font-bold leading-relaxed shadow-sm ${
                  msg.role === 'user' ? 'bg-white text-slate-700 border border-slate-100' : 'bg-emerald-600 text-white'
                }`}>
                  {msg.text.split('\n').map((line, j) => <p key={j} className={j > 0 ? "mt-1" : ""}>{line}</p>)}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-end">
                <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black animate-pulse flex items-center gap-2">
                  <span>جاري تحليل القائمة...</span>
                  <span className="w-1 h-1 bg-emerald-600 rounded-full animate-ping"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleProcess} className="p-4 bg-white border-t border-slate-50 flex gap-2">
            <input 
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              disabled={isProcessing}
              placeholder="اكتب طلباتك هنا..."
              className="flex-grow bg-slate-100 px-5 py-3 rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isProcessing || !userInput.trim()}
              className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-30 shadow-lg"
            >
              🚀
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center text-3xl transition-all border-4 border-white transform hover:scale-110 active:scale-90 ${isOpen ? 'bg-rose-500' : 'bg-emerald-600'}`}
      >
        {isOpen ? '✕' : '🤖'}
        {!isOpen && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[10px] text-white font-black rounded-full flex items-center justify-center animate-bounce border-2 border-white">!</span>}
      </button>
    </div>
  );
};

export default AiAssistant;
