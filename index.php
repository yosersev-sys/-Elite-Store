
<?php
/**
 * فاقوس ستور - المحرك الذكي v3.2 (النسخة النهائية)
 * حل مشكلة الترجمة المتسلسلة للمودولات والـ TypeScript interface
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
    
    <!-- Babel Standalone -->
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
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 9999; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="spinner"></div>
        <p id="loader-text" style="margin-top:20px; font-weight:900; color:#10b981; text-align:center;">جاري تهيئة البيئة البرمجية...</p>
    </div>
    <div id="root"></div>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';

        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const blobCache = new Map();

        /**
         * دالة جلب وترجمة الملفات بشكل متسلسل
         */
        async function getTranspiledUrl(filePath) {
            // إضافة الامتداد الافتراضي إذا لم يوجد
            if (!filePath.match(/\.(tsx?|jsx?)$/)) {
                filePath += '.tsx';
            }
            
            const absolutePath = new URL(filePath, BASE_URL).href;
            if (blobCache.has(absolutePath)) return blobCache.get(absolutePath);

            console.log(`[Loader] Loading: ${filePath}`);
            
            try {
                const response = await fetch(absolutePath);
                if (!response.ok) throw new Error(`فشل تحميل: ${filePath}`);
                let code = await response.text();

                // 1. استخراج كافة الاستيرادات المحلية وترجمتها أولاً
                const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
                const imports = [...code.matchAll(importRegex)];
                
                for (const match of imports) {
                    const relativePath = match[1];
                    const depBlobUrl = await getTranspiledUrl(new URL(relativePath, absolutePath).href);
                    // استبدال المسار النسبي برابط الـ Blob المترجم
                    code = code.replace(`"${relativePath}"`, `"${depBlobUrl}"`)
                               .replace(`'${relativePath}'`, `'${depBlobUrl}'`);
                }

                // 2. ترجمة الكود الحالي بعد إصلاح استيراداته
                const transformed = Babel.transform(code, {
                    presets: [
                        'react',
                        ['typescript', { isTSX: true, allExtensions: true }]
                    ],
                    filename: filePath,
                    sourceMaps: 'inline'
                }).code;

                // 3. إنشاء Blob وتخزينه
                const blob = new Blob([transformed], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                blobCache.set(absolutePath, blobUrl);
                
                return blobUrl;
            } catch (err) {
                console.error(`[Loader Error] ${filePath}:`, err);
                throw err;
            }
        }

        async function startApp() {
            try {
                const loaderText = document.getElementById('loader-text');
                if (loaderText) loaderText.innerText = "جاري ترجمة المكونات...";

                // ترجمة نقطة البداية App.tsx
                const appBlobUrl = await getTranspiledUrl('App.tsx');
                
                // استيراد الموديول النهائي
                const module = await import(appBlobUrl);
                const App = module.default;

                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                    React.createElement(HashRouter, null, 
                        React.createElement(App, null)
                    )
                );

                document.getElementById('initial-loader').remove();
            } catch (err) {
                const loaderText = document.getElementById('loader-text');
                if (loaderText) {
                    loaderText.style.color = 'red';
                    loaderText.innerHTML = `خطأ في التشغيل:<br><small style="direction:ltr; display:block;">${err.message}</small>`;
                }
            }
        }

        startApp();
    </script>
</body>
</html>
