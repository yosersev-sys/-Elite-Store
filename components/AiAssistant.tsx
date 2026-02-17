import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types.ts';
import { parseUserShoppingList } from '../services/geminiService.ts';

interface AiAssistantProps {
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ products, onAddToCart, showNotification }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<{role: 'user' | 'ai', text: string, type?: 'error' | 'info'}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [history]);

  const cleanForMatch = (text: string) => text.toLowerCase().replace(/^(ال)/, '').replace(/(ى)$/, 'ي').replace(/(ة)$/, 'ه').trim();

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
        setHistory(prev => [...prev, { role: 'ai', text: "لم أستطع تحديد أي أصناف من رسالتك." }]);
      } else {
        let foundCount = 0;
        let foundItemsNames: string[] = [];
        let missingItems: string[] = [];
        for (const req of parsedItems) {
          const reqItemClean = cleanForMatch(req.item);
          const match = products.find(p => cleanForMatch(p.name).includes(reqItemClean));
          if (match) { onAddToCart(match, req.qty); foundCount++; foundItemsNames.push(`${req.qty} ${match.name}`); }
          else missingItems.push(req.item);
        }
        let aiResponse = foundCount > 0 ? `تمت إضافة: \n${foundItemsNames.map(n => `✅ ${n}`).join('\n')}` : "";
        if (missingItems.length > 0) aiResponse += `\nلم أجد: \n${missingItems.map(n => `❌ ${n}`).join('\n')}`;
        setHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
        if (foundCount > 0) showNotification(`تمت إضافة ${foundCount} صنف`);
      }
    } catch (err: any) {
      setHistory(prev => [...prev, { role: 'ai', text: "حدث خطأ في معالجة الطلب.", type: 'error' }]);
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="fixed bottom-32 left-8 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[320px] md:w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden flex flex-col max-h-[500px]">
          <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
            <h4 className="font-black text-sm">مساعد السوق 🤖</h4>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-[1.5rem] text-xs font-bold ${msg.role === 'user' ? 'bg-white' : 'bg-emerald-600 text-white'}`}>{msg.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleProcess} className="p-4 bg-white border-t flex gap-2">
            <input value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="اكتب طلباتك..." className="flex-grow bg-slate-100 px-4 py-2 rounded-xl" />
            <button type="submit" className="bg-slate-900 text-white px-4 rounded-xl">🚀</button>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl bg-emerald-600 border-4 border-white">🤖</button>
    </div>
  );
};

export default AiAssistant;