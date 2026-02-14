<?php
/**
 * سوق العصر - محرك التشغيل فائق السرعة v5.0 (Turbo Load)
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
    
    <style>
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; }
        
        /* واجهة الهيكل الفورية (Skeleton UI) - تظهر قبل تحميل الجافاسكريبت */
        .skeleton-header { height: 70px; background: white; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .skeleton-logo { width: 100px; height: 30px; background: #f1f5f9; border-radius: 8px; }
        .skeleton-search { flex-grow: 1; max-width: 500px; height: 40px; background: #f1f5f9; border-radius: 12px; margin: 0 15px; }
        .skeleton-circle { width: 35px; height: 35px; background: #f1f5f9; border-radius: 50%; }
        
        .skeleton-banner { width: 100%; height: 250px; background: #e2e8f0; border-radius: 30px; margin-bottom: 30px; }
        .skeleton-card { background: white; border-radius: 20px; aspect-ratio: 4/5; padding: 12px; border: 1px solid #f1f5f9; }
        .skeleton-img { width: 100%; height: 60%; background: #f8fafc; border-radius: 15px; margin-bottom: 10px; }
        .skeleton-line { height: 12px; background: #f1f5f9; border-radius: 4px; margin-bottom: 8px; width: 80%; }
        
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        .animate-pulse-fast { animation: pulse 1.5s infinite ease-in-out; }
        
        #root:not(:empty) + #instant-skeleton { display: none; }
    </style>

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
</head>
<body>
    <div id="root"></div>

    <!-- تظهر هذه الواجهة فوراً عند فتح المتصفح -->
    <div id="instant-skeleton" class="animate-pulse-fast">
        <div class="skeleton-header">
            <div class="skeleton-logo"></div>
            <div class="skeleton-search"></div>
            <div class="skeleton-circle"></div>
        </div>
        <div class="container mx-auto px-4 pt-24">
            <div class="skeleton-banner"></div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line"></div><div class="skeleton-line" style="width:50%"></div></div>
                <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line"></div><div class="skeleton-line" style="width:50%"></div></div>
                <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line"></div><div class="skeleton-line" style="width:50%"></div></div>
                <div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-line"></div><div class="skeleton-line" style="width:50%"></div></div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = { env: { API_KEY: "" } };
        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const CACHE_PREFIX = 'souq_cache_v5_';

        async function loadModule(path) {
            const fullPath = new URL(path, BASE_URL).href;
            const cacheKey = CACHE_PREFIX + fullPath;
            
            // محاولة جلب الكود المترجم من الكاش لتوفير وقت المعالجة
            const cachedCode = localStorage.getItem(cacheKey);
            if (cachedCode) {
                const blob = new Blob([cachedCode], { type: 'application/javascript' });
                return import(URL.createObjectURL(blob));
            }

            const response = await fetch(fullPath + (fullPath.endsWith('.tsx') ? '' : '.tsx'));
            let code = await response.text();

            // معالجة الاستيرادات يدوياً لتسريع الربط
            const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
            const matches = [...code.matchAll(importRegex)];
            for (const match of matches) {
                const depPath = match[1];
                // تحميل التبعيات بشكل متوازي
                const depUrl = await getModuleUrl(new URL(depPath, fullPath).href);
                code = code.split(`'${depPath}'`).join(`'${depUrl}'`);
                code = code.split(`"${depPath}"`).join(`"${depUrl}"`);
            }

            const transformed = Babel.transform(code, {
                presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                compact: true,
                comments: false
            }).code;

            try { localStorage.setItem(cacheKey, transformed); } catch(e) {}
            
            const blob = new Blob([transformed], { type: 'application/javascript' });
            return import(URL.createObjectURL(blob));
        }

        async function getModuleUrl(fullPath) {
            const cacheKey = CACHE_PREFIX + fullPath;
            const cached = localStorage.getItem(cacheKey);
            if (cached) return URL.createObjectURL(new Blob([cached], { type: 'application/javascript' }));
            
            const response = await fetch(fullPath + (fullPath.endsWith('.tsx') ? '' : '.tsx'));
            let code = await response.text();
            const transformed = Babel.transform(code, {
                presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                compact: true
            }).code;
            localStorage.setItem(cacheKey, transformed);
            return URL.createObjectURL(new Blob([transformed], { type: 'application/javascript' }));
        }

        async function init() {
            try {
                const { default: App } = await loadModule('App.tsx');
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(App));
            } catch (err) {
                console.error("Critical Load Error:", err);
                document.body.innerHTML = `<div style="padding:50px; text-align:center; color:red; font-weight:bold;">حدث خطأ في تحميل الموقع، يرجى إعادة المحاولة.</div>`;
            }
        }

        init();
    </script>
</body>
</html>