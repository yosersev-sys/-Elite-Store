
<?php
/**
 * المدخل الرئيسي لمتجر فاقوس - Faqous Store
 * نسخة محسنة للاستضافات المشتركة
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
        
        // التقاط أي خطأ في التحميل وعرضه
        window.onerror = function(msg, url, line, col, error) {
            const loaderText = document.getElementById('loader-text');
            if (loaderText) {
                loaderText.style.color = '#ef4444';
                loaderText.innerHTML = `<b>فشل تحميل التطبيق:</b><br><small>${msg}</small><br><br><button onclick="location.reload()" style="background:#10b981; color:white; padding:5px 15px; border-radius:5px; border:none; cursor:pointer;">إعادة المحاولة</button>`;
            }
            return false;
        };
    </script>

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <!-- تحميل Babel مع الإعدادات اللازمة لمعالجة المودولات -->
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
        <p id="loader-text" style="margin-top: 15px; font-weight: 800; color: #10b981; text-align:center; max-width: 80%;">جاري تهيئة محرك فاقوس الذكي...</p>
    </div>

    <div id="root"></div>

    <!-- 
       مهم جداً: data-presets="react,typescript" تخبر Babel بكيفية التعامل مع الكود 
       data-type="module" تسمح باستخدام import/export
    -->
    <script type="text/babel" data-type="module" data-presets="react,typescript">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';
        import App from './App.tsx';

        const startApp = () => {
            try {
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(
                    <HashRouter>
                        <App />
                    </HashRouter>
                );
                
                const loader = document.getElementById('initial-loader');
                if (loader) {
                    setTimeout(() => {
                        loader.style.opacity = '0';
                        setTimeout(() => loader.remove(), 500);
                    }, 500);
                }
            } catch (err) {
                console.error("Mount error:", err);
                document.getElementById('loader-text').innerHTML = "خطأ في تشغيل واجهة المستخدم: " + err.message;
            }
        };

        // التأكد من جاهزية الـ DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startApp);
        } else {
            startApp();
        }
    </script>
</body>
</html>
