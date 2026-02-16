
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
        @keyframes pulse-soft { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.95); opacity: 0.8; } }
        
        #splash-screen {
            position: fixed; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: #f8fafc; z-index: 9999;
        }
        .splash-container { display: flex; flex-direction: column; align-items: center; width: 280px; }
        .splash-logo {
            width: 100px; height: 100px; background: #10b981; border-radius: 32px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
            animation: pulse-soft 2s infinite ease-in-out; margin-bottom: 24px;
        }
        .splash-logo img { width: 60px; height: 60px; object-fit: contain; }
        .splash-text { color: #1e293b; font-weight: 900; font-size: 1.5rem; margin-bottom: 4px; }
        .splash-status { color: #94a3b8; font-size: 0.7rem; font-weight: 700; margin-bottom: 20px; height: 1rem; }
        
        .progress-box { width: 100%; height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; position: relative; }
        #progress-bar {
            position: absolute; top: 0; right: 0; height: 100%; width: 0%;
            background: linear-gradient(90deg, #10b981, #34d399);
            transition: width 0.3s cubic-bezier(0.1, 0.5, 0.5, 1);
            border-radius: 10px;
        }
        #progress-text { margin-top: 12px; font-weight: 900; color: #10b981; font-size: 1.1rem; }
    </style>
</head>
<body>
    <div id="root">
        <div id="splash-screen">
            <div class="splash-container">
                <div class="splash-logo">
                    <img src="https://soqelasr.com/shopping-bag.png" alt="Logo">
                </div>
                <div class="splash-text">سوق العصر</div>
                <div id="splash-status-text" class="splash-status">جاري الاتصال...</div>
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

        let visualProgress = 0;
        let targetProgress = 0;

        // دالة لتحديث النسبة المئوية بشكل انسيابي
        function smoothUpdate() {
            if (visualProgress < targetProgress) {
                visualProgress += (targetProgress - visualProgress) * 0.1;
                if (targetProgress - visualProgress < 0.5) visualProgress = targetProgress;
                
                const displayVal = Math.floor(visualProgress);
                if (progressBar) progressBar.style.width = displayVal + '%';
                if (progressText) progressText.innerText = displayVal + '%';
            }
            if (visualProgress < 100) requestAnimationFrame(smoothUpdate);
        }
        smoothUpdate();

        function setProgress(percent, status) {
            targetProgress = percent;
            if (statusText && status) statusText.innerText = status;
        }

        window.process = window.process || { env: { API_KEY: '<?php echo $gemini_key; ?>' } };

        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const blobCache = new Map();
        let filesProcessed = 0;
        const estimatedTotalFiles = 25; // تقدير لعدد ملفات المشروع لزيادة الدقة

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
            throw new Error(`الملف مفقود: ${url}`);
        }

        async function getTranspiledUrl(filePath) {
            const absolutePath = new URL(filePath, BASE_URL).href;
            if (blobCache.has(absolutePath)) return blobCache.get(absolutePath);

            try {
                const { code: rawCode, finalUrl } = await fetchWithFallback(absolutePath);
                let code = rawCode;
                
                filesProcessed++;
                // زيادة النسبة بناءً على تقدم معالجة الملفات (من 10% إلى 85%)
                const calcPercent = 10 + Math.min(filesProcessed / estimatedTotalFiles * 75, 75);
                const fileName = filePath.split('/').pop();
                setProgress(calcPercent, `معالجة ${fileName}...`);

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
            } catch (err) { throw err; }
        }

        async function startApp() {
            try {
                setProgress(5, "جاري تحضير المحرك...");
                const appBlobUrl = await getTranspiledUrl('App.tsx');
                
                setProgress(90, "تشغيل واجهة المستخدم...");
                const module = await import(appBlobUrl);
                const App = module.default;

                const root = ReactDOM.createRoot(document.getElementById('root'));
                setProgress(100, "اكتمل التحميل!");
                
                // تأخير طفيف جداً لضمان رؤية الـ 100%
                setTimeout(() => {
                    root.render(React.createElement(App));
                }, 300);

            } catch (err) {
                console.error(err);
                document.getElementById('root').innerHTML = `<div style="padding:40px; text-align:center; color:#e11d48; font-weight:900;">خطأ في التحميل: ${err.message}</div>`;
            }
        }

        startApp();
    </script>
</body>
</html>
