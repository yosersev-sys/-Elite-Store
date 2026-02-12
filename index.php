
<?php
/**
 * متجر فاقوس الذكي - النسخة المستقرة للاستضافات المشتركة
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
        // معالج الأخطاء الذكي
        window.onerror = function(msg, url, line, col, error) {
            console.error(error);
            const loader = document.getElementById('loader-text');
            if (loader) {
                loader.style.color = '#ef4444';
                loader.innerHTML = `<b>خطأ في التشغيل:</b><br><small>${msg}</small>`;
            }
            return false;
        };
    </script>

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
        body { background-color: #f8fafc; margin: 0; }
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 9999; transition: opacity 0.5s; }
        .spinner { width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="spinner"></div>
        <p id="loader-text" style="margin-top: 20px; font-weight: 900; color: #10b981; text-align:center;">جاري تشغيل المتجر...</p>
    </div>

    <div id="root"></div>

    <!-- تحميل الكود وتحويله برمجياً لتجنب مشاكل الاستيراد المباشر -->
    <script type="text/babel" data-presets="react,typescript">
        import React, { useState, useEffect } from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';

        // دالة لتحميل الملفات كنص ثم ترجمتها، وهذا يحل مشكلة الـ MIME Type و SyntaxError نهائياً
        async function loadAndRun() {
            try {
                const response = await fetch('App.tsx');
                if (!response.ok) throw new Error('فشل تحميل ملف App.tsx الرئيسي');
                const tsxCode = await response.text();
                
                // ترجمة الكود من TypeScript إلى JavaScript في المتصفح
                const jsCode = Babel.transform(tsxCode, {
                    presets: ['react', 'typescript'],
                    filename: 'App.tsx'
                }).code;

                // تنفيذ الكود المترجم
                const module = { exports: {} };
                const func = new Function('React', 'ReactDOM', 'HashRouter', 'exports', jsCode);
                func(React, ReactDOM, HashRouter, module.exports);
                
                const App = module.exports.default;
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                    <HashRouter>
                        <App />
                    </HashRouter>
                );

                // إخفاء الشاشة بعد التحميل
                const loader = document.getElementById('initial-loader');
                if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 500);
                }
            } catch (err) {
                console.error("Critical Load Error:", err);
                document.getElementById('loader-text').innerHTML = "فشل في تشغيل المحرك: " + err.message;
            }
        }

        loadAndRun();
    </script>
</body>
</html>
