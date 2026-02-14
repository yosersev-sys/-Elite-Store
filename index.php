<?php
/**
 * سوق العصر - المحرك الذكي v5.0 (Speed Optimized)
 */
header('Content-Type: text/html; charset=utf-8');
// نسخة التطبيق للتحكم في الكاش - قم بتغيير الرقم عند تحديث الكود لفرض تحديث لدى المستخدمين
$APP_VERSION = "1.0.5"; 
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl" style="scroll-behavior: smooth;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>سوق العصر - فاقوس</title>
    
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">
    
    <!-- Preconnect to external speed up -->
    <link rel="preconnect" href="https://esm.sh">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react-dom": "https://esm.sh/react-dom@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
        "react-router-dom": "https://esm.sh/react-router-dom@7.1.0?external=react,react-dom",
        "@google/genai": "https://esm.sh/@google/genai@1.38.0"
      }
    }
    </script>
    
    <style>
        :root { --primary: #10b981; }
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; }
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 99999; transition: opacity 0.4s ease-out; }
        
        /* تحسين شكل اللودر ليكون أكثر احترافية */
        .loader-logo { width: 80px; height: 80px; margin-bottom: 20px; animation: pulse 2s infinite; }
        .progress-bar { width: 200px; height: 4px; background: #f1f5f9; border-radius: 10px; overflow: hidden; position: relative; }
        .progress-fill { position: absolute; top: 0; left: 0; height: 100%; background: var(--primary); width: 0%; transition: width 0.3s; }
        
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        #error-display { display: none; padding: 20px; color: #e11d48; text-align: center; font-weight: bold; background: #fff1f2; border: 2px solid #fda4af; border-radius: 20px; margin: 20px; max-width: 400px; }
    </style>
</head>
<body>
    <div id="initial-loader">
        <img src="https://soqelasr.com/shopping-bag.png" class="loader-logo" alt="سوق العصر">
        <div class="progress-bar">
            <div id="progress-fill" class="progress-fill"></div>
        </div>
        <p id="loader-text" style="margin-top:15px; font-size:12px; font-weight:900; color:#64748b; text-align:center; letter-spacing: 1px;">جاري تحسين الأداء...</p>
        <div id="error-display"></div>
    </div>
    <div id="root"></div>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = window.process || { env: {} };
        const VERSION = "<?php echo $APP_VERSION; ?>";
        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const blobCache = new Map();
        
        // تحديث شريط التقدم
        const updateProgress = (percent) => {
            const fill = document.getElementById('progress-fill');
            if (fill) fill.style.width = percent + '%';
        };

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
            throw new Error(`الملف غير موجود: ${url}`);
        }

        async function getTranspiledUrl(filePath) {
            const absolutePath = new URL(filePath, BASE_URL).href;
            if (blobCache.has(absolutePath)) return blobCache.get(absolutePath);

            // نظام الكاش المطور في LocalStorage
            const cacheKey = `transpiled_${absolutePath}_${VERSION}`;
            const cachedCode = localStorage.getItem(cacheKey);
            
            if (cachedCode) {
                const blob = new Blob([cachedCode], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                blobCache.set(absolutePath, blobUrl);
                return blobUrl;
            }

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

                // تخزين الكود المعالج للزيارات القادمة
                try {
                    localStorage.setItem(cacheKey, transformed);
                } catch(e) {
                    // في حال امتلاء مساحة التخزين، نقوم بتنظيف الكاش القديم
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('transpiled_') && !key.endsWith(VERSION)) {
                            localStorage.removeItem(key);
                        }
                    });
                }

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
                updateProgress(20);
                const appBlobUrl = await getTranspiledUrl('App.tsx');
                updateProgress(80);
                
                const module = await import(appBlobUrl);
                const App = module.default;

                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(App));

                updateProgress(100);
                setTimeout(() => {
                    document.getElementById('initial-loader').style.opacity = '0';
                    setTimeout(() => document.getElementById('initial-loader').remove(), 400);
                }, 200);
            } catch (err) {
                console.error("Critical Load Error:", err);
                const errorDisplay = document.getElementById('error-display');
                if (errorDisplay) {
                    errorDisplay.style.display = 'block';
                    errorDisplay.innerHTML = `حدث خطأ في تحميل المتجر: <br/> <span style="font-size:10px; opacity:0.7">${err.message}</span><br/><button onclick="localStorage.clear(); location.reload();" style="margin-top:10px; padding:8px 16px; background:#10b981; color:white; border-radius:10px; font-size:12px;">إصلاح وتحديث</button>`;
                    document.getElementById('loader-text').style.display = 'none';
                    document.querySelector('.progress-bar').style.display = 'none';
                }
            }
        }

        startApp();
    </script>
</body>
</html>