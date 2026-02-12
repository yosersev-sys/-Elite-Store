
<?php
/**
 * فاقوس ستور - المحرك الرئيسي المحدث
 * تم حل مشكلة الـ SyntaxError والـ MIME Type
 */
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاقوس ستور - Faqous Store</title>
    
    <script>
        window.process = { env: { API_KEY: "" } };
        window.onerror = function(msg, url, line, col, error) {
            console.error("Global Error:", msg, error);
            const loaderText = document.getElementById('loader-text');
            if (loaderText) {
                loaderText.style.color = '#ef4444';
                loaderText.innerHTML = `<b>عذراً، حدث خطأ في تشغيل المتجر:</b><br><small>${msg}</small>`;
            }
            return false;
        };
    </script>

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <!-- تحميل Babel المترجم -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react-dom": "https://esm.sh/react-dom@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
        "react-router-dom": "https://esm.sh/react-router-dom@7.1.0",
        "@google/genai": "https://esm.sh/@google/genai@1.38.0"
      }
    }
    </script>
    
    <style>
        :root { --primary: #10b981; }
        * { font-family: 'Cairo', sans-serif; }
        body { background-color: #f8fafc; margin: 0; }
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 9999; transition: opacity 0.5s; }
        .spinner { width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="spinner"></div>
        <p id="loader-text" style="margin-top: 20px; font-weight: 900; color: #10b981; text-align:center; max-width: 80%;">جاري تهيئة المتجر الذكي...</p>
    </div>

    <div id="root"></div>

    <!-- 
      الحل: إضافة data-type="module" ضروري جداً للسماح بـ import 
      والاعتماد على Babel لترجمة الكود الخارجي بشكل صحيح
    -->
    <script type="text/babel" data-type="module" data-presets="react,typescript">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';

        async function initApp() {
            try {
                // تحميل ملف App.tsx كـ Text أولاً لتجاوز مشاكل الـ MIME type على السيرفر
                const response = await fetch('App.tsx');
                if (!response.ok) throw new Error('فشل تحميل ملف التطبيق الرئيسي');
                const code = await response.text();

                // ترجمة الكود وتحويله إلى صيغة يفهمها المتصفح
                const transformed = Babel.transform(code, {
                    presets: ['react', 'typescript'],
                    filename: 'App.tsx'
                }).code;

                // تحويل الكود المترجم إلى Blob لإنشاء مودول ديناميكي
                const blob = new Blob([transformed], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                
                // استيراد التطبيق كمودول
                const module = await import(url);
                const App = module.default;

                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                    <HashRouter>
                        <App />
                    </HashRouter>
                );

                // إخفاء شاشة التحميل
                const loader = document.getElementById('initial-loader');
                if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 500);
                }
                
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Initialization failed:", err);
                document.getElementById('loader-text').innerHTML = "فشل التشغيل: " + err.message;
            }
        }

        initApp();
    </script>
</body>
</html>
