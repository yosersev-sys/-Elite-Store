
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
        setHistory(prev => [...prev, { role: 'ai', text: "عذراً، لم أستطع فهم قائمة الأصناف. حاول كتابة '2 كيلو طماطم وواحد زيت' مثلاً." }]);
      } else {
        let foundCount = 0;
        let missingItems: string[] = [];

        for (const req of parsedItems) {
          // محرك بحث بسيط: البحث عن أول منتج يحتوي اسمه على كلمة العميل
          const match = products.find(p => 
            p.name.toLowerCase().includes(req.item.toLowerCase()) || 
            req.item.toLowerCase().includes(p.name.toLowerCase())
          );

          if (match) {
            onAddToCart(match, req.qty);
            foundCount++;
          } else {
            missingItems.push(req.item);
          }
        }

        let aiResponse = `تمت إضافة ${foundCount} صنف للسلة بنجاح! ✅`;
        if (missingItems.length > 0) {
          aiResponse += `\nعذراً، لم أجد: ${missingItems.join(', ')} ❌`;
        }
        
        setHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
        showNotification(`أضاف المساعد ${foundCount} صنف لسلتك`);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', text: "حدث خطأ أثناء معالجة القائمة، يرجى المحاولة لاحقاً." }]);
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
                <h4 className="font-black text-sm leading-none">مساعدك الشخصي</h4>
                <p className="text-[9px] text-emerald-400 font-bold uppercase mt-1">مدعوم بالذكاء الاصطناعي</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">✕</button>
          </div>

          {/* Chat History */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50">
            {history.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <p className="font-black text-xs">أهلاً بك في سوق العصر!</p>
                <p className="text-[10px] font-bold mt-1">اكتب لي قائمة طلباتك وسأضيفها لك فوراً</p>
              </div>
            )}
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-[1.5rem] text-xs font-bold leading-relaxed shadow-sm ${
                  msg.role === 'user' ? 'bg-white text-slate-700 border border-slate-100' : 'bg-emerald-600 text-white'
                }`}>
                  {msg.text.split('\n').map((line, j) => <p key={j}>{line}</p>)}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-end">
                <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black animate-pulse">
                  جاري البحث والتحليل... 🔍
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleProcess} className="p-4 bg-white border-t border-slate-50 flex gap-2">
            <input 
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="اكتب طلبياتك هنا..."
              className="flex-grow bg-slate-100 px-5 py-3 rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <button 
              type="submit"
              disabled={isProcessing || !userInput.trim()}
              className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-30"
            >
              🚀
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl transition-all border-4 border-white transform hover:scale-110 active:scale-90 ${isOpen ? 'bg-rose-500' : 'bg-emerald-600'}`}
      >
        {isOpen ? '✕' : '🤖'}
        {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-ping"></span>}
      </button>
    </div>
  );
};

export default AiAssistant;
