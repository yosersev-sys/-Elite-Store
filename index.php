
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
    
    <script>
        // تعريف بيئة العمل
        window.process = { env: { API_KEY: "" } };
        
        // معالج أخطاء لعرضها على الشاشة في حال فشل التحميل
        window.onerror = function(msg, url, line) {
            const loader = document.getElementById('initial-loader');
            if (loader) {
                loader.innerHTML = `<div style="color:red; padding:20px; text-align:center;">
                    <h2 style="margin-bottom:10px;">حدث خطأ في تحميل التطبيق</h2>
                    <p style="font-size:14px;">${msg}</p>
                    <p style="font-size:12px; color:#666;">السطر: ${line} - الرابط: ${url}</p>
                    <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer;">إعادة تحميل الصفحة</button>
                </div>`;
            }
            return false;
        };
    </script>

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
        :root { --primary: #10b981; --bg-light: #f8fafc; }
        * { font-family: 'Cairo', sans-serif; }
        body { background-color: var(--bg-light); margin: 0; }
        .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 9999; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="spinner"></div>
        <p style="margin-top: 15px; font-weight: 800; color: #10b981;">جاري تشغيل محرك فاقوس...</p>
    </div>

    <div id="root"></div>

    <script type="text/babel" data-type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import { HashRouter } from 'react-router-dom';
        import App from './App.tsx';

        try {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(
                <HashRouter>
                    <App />
                </HashRouter>
            );
            
            // إخفاء اللودر بمجرد بدء رندر React
            const loader = document.getElementById('initial-loader');
            if (loader) {
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 500);
                }, 1000);
            }
        } catch (err) {
            console.error("Mounting error:", err);
            throw err;
        }
    </script>
</body>
</html>
