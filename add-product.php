<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>إضافة منتج جديد | متجر النخبة</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18.2.0",
        "react-dom": "https://esm.sh/react-dom@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
        "@google/genai": "https://esm.sh/@google/genai@1.38.0"
      }
    }
    </script>
    
    <style>
        * { font-family: 'Cairo', sans-serif; }
        body { background-color: #f8fafc; margin: 0; padding: 0; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel" data-type="module">
        import React, { useState, useEffect, useRef } from 'react';
        import ReactDOM from 'react-dom/client';
        import { GoogleGenAI } from "@google/genai";

        const App = () => {
            const [categories, setCategories] = useState([]);
            const [isLoading, setIsLoading] = useState(true);
            const [isSaving, setIsSaving] = useState(false);
            const [isLoadingAi, setIsLoadingAi] = useState(false);
            const fileInputRef = useRef(null);

            const [formData, setFormData] = useState({
                name: '',
                description: '',
                price: '',
                categoryId: '',
                stockQuantity: '10',
                images: []
            });

            useEffect(() => {
                fetch('api.php?action=get_categories')
                    .then(r => r.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            setCategories(data);
                            if (data.length > 0) setFormData(prev => ({ ...prev, categoryId: data[0].id }));
                        }
                        setIsLoading(false);
                    })
                    .catch(() => setIsLoading(false));
            }, []);

            const generateDescription = async () => {
                if (!formData.name) return alert('يرجى إدخال اسم المنتج أولاً');
                setIsLoadingAi(true);
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const catName = categories.find(c => c.id === formData.categoryId)?.name || 'عام';
                    const response = await ai.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: `قم بكتابة وصف تسويقي جذاب ومختصر باللغة العربية لمنتج يسمى "${formData.name}" في قسم "${catName}".`
                    });
                    setFormData(prev => ({ ...prev, description: response.text || "" }));
                } catch (e) { alert('خطأ في الاتصال بالذكاء الاصطناعي'); }
                setIsLoadingAi(false);
            };

            const handleFileChange = (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
                    };
                    reader.readAsDataURL(file);
                });
            };

            const handleSubmit = async (e) => {
                e.preventDefault();
                if (formData.images.length === 0) return alert('يرجى إضافة صورة واحدة على الأقل');
                setIsSaving(true);
                
                const res = await fetch('api.php?action=add_product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        id: 'p_' + Date.now(),
                        price: parseFloat(formData.price),
                        stockQuantity: parseInt(formData.stockQuantity),
                        createdAt: Date.now()
                    })
                }).then(r => r.json());

                if (res.status === 'success') {
                    window.location.href = 'index.php?v=admin';
                } else {
                    alert('خطأ أثناء الحفظ');
                }
                setIsSaving(false);
            };

            if (isLoading) return <div className="p-20 text-center font-bold">جاري التحميل...</div>;

            return (
                <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn">
                    <h1 className="text-3xl font-black mb-8">إضافة منتج جديد</h1>
                    <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2rem] shadow-xl space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none border focus:border-indigo-500" placeholder="اسم المنتج" />
                            <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none border">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none border" placeholder="السعر" />
                            <input required type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="p-4 bg-slate-50 rounded-xl outline-none border" placeholder="الكمية" />
                        </div>
                        <div className="relative">
                            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none border min-h-[150px]" placeholder="الوصف..." />
                            <button type="button" onClick={generateDescription} className="absolute left-4 bottom-4 bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg">✨ وصف ذكي</button>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {formData.images.map((img, i) => <img key={i} src={img} className="w-20 h-20 object-cover rounded-xl border" />)}
                            <button type="button" onClick={() => fileInputRef.current.click()} className="w-20 h-20 border-2 border-dashed rounded-xl flex items-center justify-center text-slate-300">+</button>
                            <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileChange} />
                        </div>
                        <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition">
                            {isSaving ? 'جاري الحفظ...' : 'نشر المنتج'}
                        </button>
                    </form>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>