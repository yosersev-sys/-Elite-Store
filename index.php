
<?php
/**
 * سوق العصر - المحرك الذكي v4.2
 */
header('Content-Type: text/html; charset=utf-8');
require_once 'config.php';

// جلب مفتاح API من إعدادات النظام في قاعدة البيانات
$gemini_key = '';
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
    $stmt->execute();
    $gemini_key = $stmt->fetchColumn() ?: '';
} catch (Exception $e) {
    // في حال عدم وجود الجدول بعد
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl" style="scroll-behavior: smooth;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>سوق العصر - اول سوق الكتروني في فاقوس</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    
    <!-- PWA & Android Meta Tags -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="https://soqelasr.com/shopping-bag512.png">

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <!-- External Libraries -->
    <script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react-dom": "https://esm.sh/react-dom@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
        "react-router-dom": "https://esm.sh/react-router-dom@7.1.0?external=react,react-dom",
        "@google/genai": "https://esm.sh/@google/genai@1.41.0"
      }
    }
    </script>
    
    <style>
        :root { --primary: #10b981; }
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; user-select: none; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-soft { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.98); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* واجهة التشغيل الفورية مع النسبة المئوية */
        #splash-screen {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            z-index: 9999;
        }
        .splash-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 280px;
            width: 100%;
        }
        .splash-logo {
            width: 100px;
            height: 100px;
            background: #10b981;
            border-radius: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
            animation: pulse-soft 2s infinite ease-in-out;
            margin-bottom: 24px;
        }
        .splash-logo img { width: 60px; height: 60px; object-fit: contain; }
        .splash-text { color: #1e293b; font-weight: 900; font-size: 1.5rem; margin-bottom: 8px; }
        .splash-status { color: #94a3b8; font-size: 0.75rem; font-weight: 700; margin-bottom: 20px; }
        
        /* شريط التقدم */
        .progress-box {
            width: 100%;
            height: 6px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }
        #progress-bar {
            position: absolute;
            top: 0;
            right: 0;
            height: 100%;
            width: 0%;
            background: #10b981;
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 10px;
        }
        #progress-text {
            margin-top: 12px;
            font-weight: 900;
            color: #10b981;
            font-size: 1rem;
        }
    </style>
</head>
<body>
    <div id="root">
        <!-- واجهة تشغيل فورية بنسبة مئوية -->
        <div id="splash-screen">
            <div class="splash-container">
                <div class="splash-logo">
                    <img src="https://soqelasr.com/shopping-bag.png" alt="Logo">
                </div>
                <div class="splash-text">سوق العصر</div>
                <div id="splash-status-text" class="splash-status">جاري تهيئة المتجر...</div>
                <div class="progress-box">
                    <div id="progress-bar"></div>
                </div>
                <div id="progress-text">0%</div>
            </div>
        </div>
    </div>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const statusText = document.getElementById('splash-status-text');

        function updateProgress(percent, status) {
            if (progressBar) progressBar.style.width = percent + '%';
            if (progressText) progressText.innerText = percent + '%';
            if (statusText && status) statusText.innerText = status;
        }

        // تهيئة كائن process وحقن مفتاح API المجلوب من PHP
        window.process = window.process || { env: {} };
        window.process.env.API_KEY = '<?php echo $gemini_key; ?>';

        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const blobCache = new Map();

        async function fetchWithFallback(url) {
            const extensions = ['', '.tsx', '.ts', '.jsx', '.js'];
            for (let ext of extensions) {
                try {
                    const fullUrl = url + (url.match(/\.(tsx?|jsx?)$/) ? '' : ext);
                    const response = await fetch(fullUrl);
                    if (response.ok) {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('text/html')) continue;
                        return { code: await response.text(), finalUrl: fullUrl };
                    }
                } catch (e) {}
            }
            throw new Error(`تعذر العثور على الملف: ${url}`);
        }

        async function getTranspiledUrl(filePath) {
            const absolutePath = new URL(filePath, BASE_URL).href;
            if (blobCache.has(absolutePath)) return blobCache.get(absolutePath);

            try {
                const { code: rawCode, finalUrl } = await fetchWithFallback(absolutePath);
                let code = rawCode;

                const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
                const matches = [...code.matchAll(importRegex)];
                
                for (const match of matches) {
                    const relativePath = match[1];
                    const fullImportPath = new URL(relativePath, finalUrl).href;
                    const depBlobUrl = await getTranspiledUrl(fullImportPath);
                    code = code.split(`'${relativePath}'`).join(`'${depBlobUrl}'`);
                    code = code.split(`"${relativePath}"`).join(`"${depBlobUrl}"`);
                }

                const transformed = Babel.transform(code, {
                    presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                    filename: finalUrl,
                }).code;

                const blob = new Blob([transformed], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                blobCache.set(absolutePath, blobUrl);
                return blobUrl;
            } catch (err) {
                throw err;
            }
        }

        async function startApp() {
            try {
                // المرحلة الأولى: جلب ملفات النظام (20%)
                updateProgress(20, "جاري تحميل ملفات النظام...");
                
                // المرحلة الثانية: معالجة المكونات (50%)
                const appBlobUrl = await getTranspiledUrl('App.tsx');
                updateProgress(60, "جاري معالجة مكونات الواجهة...");

                // المرحلة الثالثة: تهيئة React (80%)
                updateProgress(85, "جاري تشغيل المتجر...");
                
                const module = await import(appBlobUrl);
                const App = module.default;

                const root = ReactDOM.createRoot(document.getElementById('root'));
                
                // المرحلة النهائية: العرض (100%)
                updateProgress(100, "جاهز للعمل!");
                
                // انتظار بسيط ليشعر المستخدم بالنسب المكتملة
                setTimeout(() => {
                    root.render(React.createElement(App));
                }, 200);

            } catch (err) {
                console.error("Critical Load Error:", err);
                const root = document.getElementById('root');
                if (root) {
                    root.innerHTML = `<div style="padding:40px; text-align:center; color:#e11d48; font-weight:900;">حدث خطأ تقني في التحميل: <br/> ${err.message}</div>`;
                }
            }
        }

        // تشغيل العملية
        updateProgress(5, "جاري الاتصال بالسيرفر...");
        startApp();
    </script>
</body>
</html>
