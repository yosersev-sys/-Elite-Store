<?php
/**
 * سوق العصر - محرك التشغيل فائق السرعة v5.1 (Fixed & Cached)
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
        
        /* واجهة الهيكل الفورية (Skeleton UI) */
        .skeleton-header { height: 70px; background: white; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; position: fixed; top: 0; left: 0; right: 0; z-index: 100; }
        .skeleton-logo { width: 100px; height: 30px; background: #f1f5f9; border-radius: 8px; }
        .skeleton-search { flex-grow: 1; max-width: 500px; height: 40px; background: #f1f5f9; border-radius: 12px; margin: 0 15px; }
        .skeleton-banner { width: 100%; height: 200px; background: #e2e8f0; border-radius: 30px; margin-bottom: 30px; }
        .skeleton-card { background: white; border-radius: 20px; aspect-ratio: 4/5; padding: 12px; border: 1px solid #f1f5f9; }
        
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

    <div id="instant-skeleton" class="animate-pulse-fast">
        <div class="skeleton-header">
            <div class="skeleton-logo"></div>
            <div class="skeleton-search"></div>
            <div class="w-8 h-8 bg-slate-100 rounded-full"></div>
        </div>
        <div class="container mx-auto px-4 pt-24">
            <div class="skeleton-banner"></div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="skeleton-card"></div><div class="skeleton-card"></div>
                <div class="skeleton-card"></div><div class="skeleton-card"></div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = { env: { API_KEY: "" } };
        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const CACHE_PREFIX = 'souq_v5.1_';

        const blobCache = new Map();

        async function getFileContent(url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error(`Expected JS/TS but got HTML from ${url}. Check if file exists.`);
            }
            return await response.text();
        }

        async function transpileAndCache(path) {
            const fullPath = new URL(path, BASE_URL).href;
            const targetUrl = fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') ? fullPath : fullPath + '.tsx';
            
            if (blobCache.has(targetUrl)) return blobCache.get(targetUrl);

            const cacheKey = CACHE_PREFIX + targetUrl;
            const cached = localStorage.getItem(cacheKey);
            
            let code;
            if (cached) {
                code = cached;
            } else {
                const rawCode = await getFileContent(targetUrl);
                
                // معالجة الاستيرادات
                let processedCode = rawCode;
                const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
                const matches = [...rawCode.matchAll(importRegex)];
                
                for (const match of matches) {
                    const relativePath = match[1];
                    const absoluteImportPath = new URL(relativePath, targetUrl).href;
                    const depBlobUrl = await transpileAndCache(absoluteImportPath);
                    processedCode = processedCode.split(`'${relativePath}'`).join(`'${depBlobUrl}'`);
                    processedCode = processedCode.split(`"${relativePath}"`).join(`"${depBlobUrl}"`);
                }

                code = Babel.transform(processedCode, {
                    presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                    compact: true,
                    comments: false
                }).code;

                try { localStorage.setItem(cacheKey, code); } catch(e) { console.warn("Cache storage failed", e); }
            }

            const blobUrl = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
            blobCache.set(targetUrl, blobUrl);
            return blobUrl;
        }

        async function start() {
            try {
                const appBlobUrl = await transpileAndCache('App.tsx');
                const module = await import(appBlobUrl);
                const App = module.default;
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(App));
            } catch (err) {
                console.error("Critical Load Error:", err);
                // محاولة مسح الكاش في حال وجود خطأ برمجي محفوظ
                if (err.name === 'SyntaxError') {
                    localStorage.clear();
                    // window.location.reload();
                }
                document.getElementById('instant-skeleton').innerHTML = `
                    <div class="p-10 text-center">
                        <p class="text-rose-500 font-bold mb-4">خطأ في تحميل المتجر</p>
                        <code class="text-xs bg-slate-100 p-2 rounded block mb-4">${err.message}</code>
                        <button onclick="localStorage.clear(); location.reload();" class="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">تحديث الصفحة 🔄</button>
                    </div>
                `;
            }
        }

        start();
    </script>
</body>
</html>