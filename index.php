
<?php
/**
 * المدخل الرئيسي لمتجر فاقوس - Faqous Store
 * تم دمج محرك تشغيل React مع PHP لضمان التوافق مع Hostinger
 */
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاقوس ستور - Faqous Store | التميز في التسوق</title>
    
    <!-- تعريف بيئة البروسيس لمنع أخطاء المكتبات في المتصفح -->
    <script>
        window.process = { env: { API_KEY: "" } };
    </script>

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- محرك Babel للترجمة الفورية لملفات TSX -->
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
        :root {
            --primary: #10b981;
            --primary-dark: #059669;
            --secondary: #1e293b;
            --bg-light: #f8fafc;
        }
        * { font-family: 'Cairo', sans-serif; }
        body { background-color: var(--bg-light); color: var(--secondary); margin: 0; overflow-x: hidden; }
        
        /* التنسيقات الزجاجية Glassmorphism */
        .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
        .card-shadow { box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 4px 12px -3px rgba(0, 0, 0, 0.02); }
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.15); }

        #initial-loader {
            position: fixed; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: white;
            z-index: 9999; transition: opacity 0.5s ease;
        }
        .spinner {
            width: 40px; height: 40px; border: 4px solid #f3f3f3;
            border-top: 4px solid var(--primary); border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--primary); }
    </style>
</head>
<body>
    <!-- لودر البداية -->
    <div id="initial-loader">
        <div class="spinner"></div>
        <p style="margin-top: 15px; font-weight: 800; color: #10b981;">فاقوس ستور - جاري التحميل</p>
    </div>

    <div id="root"></div>

    <!-- تشغيل التطبيق عبر محرك Babel -->
    <script type="text/babel" data-type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';
        import App from './App.tsx';

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
            <HashRouter>
                <App />
            </HashRouter>
        );

        // إخفاء اللودر عند جاهزية التطبيق
        window.addEventListener('load', () => {
            const loader = document.getElementById('initial-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 500);
            }
        });
    </script>
</body>
</html>
