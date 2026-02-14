<?php
/**
 * سوق العصر - المحرك النفاث v5.0 (Instant Load Optimized)
 */
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>سوق العصر - فاقوس</title>
    
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    <meta name="theme-color" content="#10b981">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
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
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background: #f8fafc; margin: 0; }
        
        /* Skeleton UI Styles - تظهر فوراً قبل تحميل الجافاسكريبت */
        .skeleton-header { height: 70px; background: white; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; }
        .skeleton-logo { width: 120px; height: 35px; background: #f1f5f9; border-radius: 10px; }
        .skeleton-search { flex-grow: 1; max-width: 400px; height: 40px; background: #f1f5f9; border-radius: 15px; margin: 0 20px; }
        .skeleton-card { background: white; border-radius: 25px; aspect-ratio: 4/5; border: 1px solid #f1f5f9; padding: 15px; }
        .skeleton-img { width: 100%; height: 60%; background: #f8fafc; border-radius: 20px; margin-bottom: 15px; }
        .skeleton-text { height: 15px; background: #f1f5f9; border-radius: 4px; margin-bottom: 8px; width: 80%; }
        
        @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        .animate-shimmer { animation: shimmer 1.5s infinite; }
        #root:not(:empty) + #skeleton-ui { display: none; }
    </style>
</head>
<body>
    <div id="root"></div>

    <!-- هذا الجزء يراه المستخدم فوراً عند فتح الموقع -->
    <div id="skeleton-ui" class="animate-shimmer">
        <div class="skeleton-header">
            <div class="skeleton-logo"></div>
            <div class="skeleton-search"></div>
            <div class="w-10 h-10 bg-slate-100 rounded-full"></div>
        </div>
        <div class="container mx-auto px-4 pt-24">
            <div class="w-full h-[250px] bg-slate-200 rounded-[3rem] mb-10"></div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1,2,3,4,5,6,7,8].map(i => `
                    <div class="skeleton-card">
                        <div class="skeleton-img"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text" style="width: 50%"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = { env: { API_KEY: "" } };
        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const cacheKey = 'souq_v5_cache_';

        async function fetchAndTranspile(filePath) {
            const absolutePath = new URL(filePath, BASE_URL).href;
            
            // محاولة التحميل من الكاش لتوفير وقت المعالجة
            const cached = localStorage.getItem(cacheKey + absolutePath);
            if (cached) return URL.createObjectURL(new Blob([cached], { type: 'application/javascript' }));

            const response = await fetch(absolutePath + (absolutePath.endsWith('.tsx') ? '' : '.tsx'));
            let code = await response.text();

            // معالجة الاستيرادات
            const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
            const matches = [...code.matchAll(importRegex)];
            for (const match of matches) {
                const depUrl = await fetchAndTranspile(new URL(match[1], absolutePath).href);
                code = code.split(match[0]).join(`from '${depUrl}'`);
            }

            const transformed = Babel.transform(code, {
                presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
            }).code;

            // تخزين النسخة المترجمة
            try { localStorage.setItem(cacheKey + absolutePath, transformed); } catch(e) {}
            
            return URL.createObjectURL(new Blob([transformed], { type: 'application/javascript' }));
        }

        async function init() {
            try {
                const appUrl = await fetchAndTranspile('App.tsx');
                const { default: App } = await import(appUrl);
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(App));
            } catch (err) {
                console.error(err);
                document.getElementById('skeleton-ui').innerHTML = '<div class="p-10 text-center text-red-500 font-bold">حدث خطأ أثناء تحميل المتجر، يرجى تحديث الصفحة.</div>';
            }
        }

        init();
    </script>
</body>
</html>