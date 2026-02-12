
<?php
/**
 * فاقوس ستور - المحرك الذكي المطور v3.1
 * حل مشكلة SyntaxError والمسارات في الاستضافات المشتركة
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
        body { background: #f8fafc; margin: 0; }
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 9999; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="spinner"></div>
        <p id="loader-text" style="margin-top:20px; font-weight:900; color:#10b981; text-align:center;">جاري تشغيل المتجر...</p>
    </div>
    <div id="root"></div>

    <!-- استخدام type="module" ضروري جداً هنا -->
    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';

        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const modulesCache = new Map();

        /**
         * دالة ذكية تقوم بجلب ملف TSX، ترجمته، وإصلاح مسارات الاستيراد بداخله
         */
        async function smartImport(filePath) {
            const absolutePath = new URL(filePath, BASE_URL).href;
            if (modulesCache.has(absolutePath)) return modulesCache.get(absolutePath);

            try {
                const response = await fetch(absolutePath);
                if (!response.ok) throw new Error(`فشل تحميل الملف: ${filePath}`);
                let code = await response.text();

                // 1. إصلاح مسارات الاستيراد (مثلاً من './Header' إلى 'https://site.com/components/Header.tsx')
                code = code.replace(/from\s+['"](\.\.?\/[^'"]+)['"]/g, (match, path) => {
                    // إضافة الامتداد إذا لم يكن موجوداً
                    let finalPath = path;
                    if (!finalPath.endsWith('.tsx') && !finalPath.endsWith('.ts') && !finalPath.endsWith('.js')) {
                        finalPath += '.tsx';
                    }
                    const resolved = new URL(finalPath, absolutePath).href;
                    return `from "${resolved}"`;
                });

                // 2. ترجمة الكود باستخدام Babel
                const transformed = Babel.transform(code, {
                    presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                    filename: filePath,
                    sourceMaps: 'inline'
                }).code;

                // 3. إنشاء رابط Blob لتنفيذ الكود كموديول
                const blob = new Blob([transformed], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                
                const module = await import(blobUrl);
                modulesCache.set(absolutePath, module);
                return module;
            } catch (err) {
                console.error("SmartImport Error:", err);
                throw err;
            }
        }

        async function init() {
            try {
                // نقطة البداية
                const module = await smartImport('App.tsx');
                const App = module.default;

                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                    React.createElement(HashRouter, null, 
                        React.createElement(App, null)
                    )
                );

                const loader = document.getElementById('initial-loader');
                if (loader) loader.remove();
            } catch (err) {
                console.error("Initialization Error:", err);
                const loaderText = document.getElementById('loader-text');
                if (loaderText) {
                    loaderText.style.color = 'red';
                    loaderText.innerHTML = `خطأ في تشغيل المحرك:<br><small>${err.message}</small>`;
                }
            }
        }

        // بدء التشغيل
        init();
    </script>
</body>
</html>
