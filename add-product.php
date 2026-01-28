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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@^19.2.4",
        "react/": "https://esm.sh/react@^19.2.4/",
        "react-dom/": "https://esm.sh/react-dom@^19.2.4/",
        "@google/genai": "https://esm.sh/@google/genai@^1.38.0"
      }
    }
    </script>
    <style>
        * { font-family: 'Cairo', sans-serif; }
        body { background-color: #f8fafc; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="bg-slate-50">
    <div id="root"></div>

    <script type="module">
        import React, { useState, useEffect, useRef } from 'react';
        import ReactDOM from 'react-dom/client';
        import { GoogleGenAI, Type } from "@google/genai";

        // محاكاة الخدمات الموجودة في التطبيق الأصلي
        const ai = new GoogleGenAI({ apiKey: "<?php echo getenv('API_KEY') ?: ''; ?>" || "YOUR_KEY_HERE" }); // سيتم حقن المفتاح تلقائياً في البيئة المناسبة

        const App = () => {
            const [categories, setCategories] = useState([]);
            const [isLoading, setIsLoading] = useState(true);
            const [isSaving, setIsSaving] = useState(false);
            const [isLoadingAi, setIsLoadingAi] = useState(false);
            const fileInputRef = useRef(null);

            const [formData, setFormData] = useState({
                id: 'p_' + Date.now(),
                name: '',
                description: '',
                price: '',
                categoryId: '',
                stockQuantity: '10',
                images: [],
                seoSettings: { metaTitle: '', metaDescription: '', metaKeywords: '', slug: '' }
            });

            useEffect(() => {
                fetch('api.php?action=get_categories')
                    .then(r => r.json())
                    .then(data => {
                        setCategories(data);
                        if (data.length > 0) setFormData(prev => ({ ...prev, categoryId: data[0].id }));
                        setIsLoading(false);
                    });
            }, []);

            const generateDescription = async () => {
                if (!formData.name) return alert('يرجى إدخال اسم المنتج');
                setIsLoadingAi(true);
                try {
                    const model = new GoogleGenAI({ apiKey: "<?php echo getenv('API_KEY') ?: ''; ?>" });
                    const response = await model.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: `اكتب وصفاً تسويقياً باللغة العربية لمنتج "${formData.name}".`
                    });
                    setFormData(prev => ({ ...prev, description: response.text }));
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
                
                try {
                    const res = await fetch('api.php?action=add_product', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...formData,
                            price: parseFloat(formData.price),
                            stockQuantity: parseInt(formData.stockQuantity),
                            createdAt: Date.now()
                        })
                    }).then(r => r.json());

                    if (res.status === 'success') {
                        window.location.href = 'index.php?v=admin';
                    } else { alert('حدث خطأ أثناء الحفظ'); }
                } catch (e) { alert('خطأ في الاتصال بالسيرفر'); }
                setIsSaving(false);
            };

            if (isLoading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">جاري التحميل...</div>;

            return (
                <div className="max-w-4xl mx-auto py-12 px-6 animate-fadeIn">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">إضافة منتج جديد</h1>
                            <p className="text-slate-500 mt-2">سيتم نشر المنتج مباشرة في المتجر بعد الحفظ</p>
                        </div>
                        <a href="index.php?v=admin" className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition">إلغاء</a>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 mr-2">اسم المنتج</label>
                                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 mr-2">التصنيف</label>
                                <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition">
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 mr-2">السعر (ر.س)</label>
                                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 mr-2">الكمية بالمخزون</label>
                                <input required type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-bold text-slate-400 mr-2">الوصف</label>
                            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-6 bg-slate-50 rounded-2xl outline-none min-h-[150px] focus:ring-2 focus:ring-indigo-500 transition" />
                            <button type="button" onClick={generateDescription} disabled={isLoadingAi} className="absolute left-4 bottom-4 bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded-lg hover:bg-slate-900 transition disabled:opacity-50">
                                {isLoadingAi ? 'جاري التوليد...' : '✨ وصف ذكي'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-400 mr-2">صور المنتج</label>
                            <div className="flex flex-wrap gap-4">
                                {formData.images.map((img, i) => (
                                    <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden relative group border shadow-sm">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 transition">✕</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => fileInputRef.current.click()} className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition">
                                    <span className="text-2xl">+</span>
                                    <span className="text-[10px] font-bold">رفع</span>
                                </button>
                                <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileChange} accept="image/*" />
                            </div>
                        </div>

                        <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-600 transition disabled:opacity-50 active:scale-95 transform">
                            {isSaving ? 'جاري الحفظ...' : 'نشر المنتج الآن 🚀'}
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
