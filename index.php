
<?php
/**
 * المدخل الرئيسي لمتجر فاقوس - Faqous Store
 * تم تحسينه ليعمل على Hostinger و cPanel
 */
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاقوس ستور - Faqous Store</title>
    
    <script>
        // تهيئة البيئة الأساسية
        window.process = { env: { API_KEY: "" } };
        
        // التقاط أخطاء التحميل (Critical for Debugging)
        window.addEventListener('error', function(e) {
            console.error('Global Error:', e);
            const loader = document.getElementById('loader-text');
            if (loader) {
                loader.style.color = '#ef4444';
                loader.innerHTML = 'حدث خطأ في تحميل الملفات البرمجية.<br><small style="font-weight:normal; font-size:10px;">انظر إلى Console المتصفح (F12) للمزيد من التفاصيل</small>';
            }
        }, true);
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
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 9999; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="spinner"></div>
        <p id="loader-text" style="margin-top: 15px; font-weight: 800; color: #10b981; text-align:center;">جاري تشغيل محرك فاقوس...</p>
    </div>

    <div id="root"></div>

    <!-- استخدام Babel لترجمة التطبيق -->
    <script type="text/babel" data-type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';
        import App from './App.tsx';

        const renderApp = () => {
            try {
                const rootElement = document.getElementById('root');
                const root = ReactDOM.createRoot(rootElement);
                root.render(
                    <HashRouter>
                        <App />
                    </HashRouter>
                );
                
                // إخفاء شاشة التحميل
                const loader = document.getElementById('initial-loader');
                if (loader) {
                    setTimeout(() => {
                        loader.style.opacity = '0';
                        setTimeout(() => loader.remove(), 500);
                    }, 800);
                }
            } catch (err) {
                console.error("React Mounting Error:", err);
                document.getElementById('loader-text').innerHTML = "فشل تشغيل الواجهة: " + err.message;
            }
        };

        // التأكد من تحميل الصفحة بالكامل قبل البدء
        if (document.readyState === 'complete') {
            renderApp();
        } else {
            window.addEventListener('load', renderApp);
        }
    </script>
</body>
</html>
