
<?php
/**
 * فاقوس ستور - المحرك الذكي v3.3
 * حل مشكلة الامتدادات والـ 404 Unexpected Token
 */
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاقوس ستور - Faqous Store</title>
    
    <script>window.process = { env: { API_KEY: "" } };</script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
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
        body { background: #f8fafc; margin: 0; }
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 9999; transition: opacity 0.5s; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="spinner"></div>
        <p id="loader-text" style="margin-top:20px; font-weight:900; color:#10b981; text-align:center;">جاري تشغيل محرك فاقوس الذكي...</p>
    </div>
    <div id="root"></div>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';

        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const blobCache = new Map();

        /**
         * دالة ذكية لجلب الملف مع تجربة امتدادات مختلفة
         */
        async function fetchWithFallback(url) {
            const extensions = ['', '.tsx', '.ts', '.jsx', '.js'];
            for (let ext of extensions) {
                try {
                    const fullUrl = url + (url.match(/\.(tsx?|jsx?)$/) ? '' : ext);
                    const response = await fetch(fullUrl);
                    if (response.ok) {
                        const contentType = response.headers.get('content-type');
                        // التأكد أننا لا نحمل صفحة HTML (خطأ 404 من السيرفر)
                        if (contentType && contentType.includes('text/html')) continue;
                        return { code: await response.text(), finalUrl: fullUrl };
                    }
                } catch (e) {}
            }
            throw new Error(`تعذر العثور على الملف أو الملف غير صالح: ${url}`);
        }

        /**
         * دالة الترجمة المتسلسلة
         */
        async function getTranspiledUrl(filePath) {
            const absolutePath = new URL(filePath, BASE_URL).href;
            if (blobCache.has(absolutePath)) return blobCache.get(absolutePath);

            console.log(`[Loader] Processing: ${filePath}`);
            
            try {
                const { code: rawCode, finalUrl } = await fetchWithFallback(absolutePath);
                let code = rawCode;

                // 1. معالجة الاستيرادات
                const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
                const matches = [...code.matchAll(importRegex)];
                
                for (const match of matches) {
                    const relativePath = match[1];
                    const fullImportPath = new URL(relativePath, finalUrl).href;
                    const depBlobUrl = await getTranspiledUrl(fullImportPath);
                    
                    // استبدال دقيق للمسار
                    code = code.split(`'${relativePath}'`).join(`'${depBlobUrl}'`);
                    code = code.split(`"${relativePath}"`).join(`"${depBlobUrl}"`);
                }

                // 2. الترجمة عبر Babel
                const transformed = Babel.transform(code, {
                    presets: [
                        'react',
                        ['typescript', { isTSX: true, allExtensions: true }]
                    ],
                    filename: finalUrl,
                    sourceMaps: 'inline'
                }).code;

                // 3. إنشاء رابط Blob
                const blob = new Blob([transformed], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                blobCache.set(absolutePath, blobUrl);
                
                return blobUrl;
            } catch (err) {
                console.error(`[Loader Error] In ${filePath}:`, err);
                throw err;
            }
        }

        async function init() {
            const loaderText = document.getElementById('loader-text');
            try {
                loaderText.innerText = "جاري فحص المكونات...";
                const appBlobUrl = await getTranspiledUrl('App.tsx');
                
                loaderText.innerText = "جاري تشغيل واجهة المتجر...";
                const module = await import(appBlobUrl);
                const App = module.default;

                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                    React.createElement(HashRouter, null, 
                        React.createElement(App, null)
                    )
                );

                document.getElementById('initial-loader').style.opacity = '0';
                setTimeout(() => document.getElementById('initial-loader').remove(), 500);
            } catch (err) {
                console.error("Init Error:", err);
                if (loaderText) {
                    loaderText.style.color = 'red';
                    loaderText.innerHTML = `خطأ في تشغيل المحرك:<br><small style="direction:ltr; display:block; margin-top:10px; background:#fff1f1; padding:10px; border-radius:10px; font-family:monospace;">${err.message}</small>`;
                }
            }
        }

        init();
    </script>
</body>
</html>
