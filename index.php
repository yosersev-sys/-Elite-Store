<?php
/**
 * سوق العصر - المحرك الذكي v5.5
 * حل نهائي لمشكلة المسارات النسبية والـ 404
 */
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 

require_once 'config.php';

$gemini_key = '';
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
    $stmt->execute();
    $gemini_key = $stmt->fetchColumn() ?: '';
} catch (Exception $e) {}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>سوق العصر - اول سوق الكتروني في فاقوس</title>
    
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">

    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
    
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react-dom": "https://esm.sh/react-dom@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
        "@google/genai": "https://esm.sh/@google/genai@1.41.0"
      }
    }
    </script>
    
    <style>
        :root { --primary: #10b981; }
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; }
        #splash-screen {
            position: fixed; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: #f8fafc; z-index: 9999;
            transition: opacity 0.5s ease-out;
        }
        .progress-box { width: 280px; height: 4px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-top: 20px; }
        #progress-bar { height: 100%; width: 0%; background: #10b981; transition: width 0.3s ease; }
        #error-log {
            position: fixed; bottom: 20px; left: 20px; right: 20px;
            background: #fff1f2; border: 1px solid #fda4af; padding: 15px;
            border-radius: 15px; color: #9f1239; font-size: 11px; display: none; z-index: 10000;
            max-height: 150px; overflow-y: auto; font-family: monospace;
        }
    </style>
</head>
<body>
    <div id="root">
        <div id="splash-screen">
            <div class="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-4 shadow-xl">
                <img src="https://soqelasr.com/shopping-bag.png" alt="Logo" width="45">
            </div>
            <h1 class="font-black text-slate-800 text-xl">سوق العصر</h1>
            <div class="progress-box"><div id="progress-bar"></div></div>
            <p id="loading-status" class="text-[10px] text-slate-400 font-bold mt-3">جاري تهيئة المتجر...</p>
        </div>
    </div>
    <div id="error-log"></div>

    <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js"></script>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = { env: { API_KEY: '<?php echo $gemini_key; ?>' } };
        const blobCache = new Map();
        const bar = document.getElementById('progress-bar');
        const statusEl = document.getElementById('loading-status');

        function showError(msg) {
            const el = document.getElementById('error-log');
            if (el) { el.style.display = 'block'; el.innerHTML = '<strong>خطأ في التحميل:</strong><br>' + msg; }
        }

        // حل المسارات باستخدام URL API (أكثر دقة من الـ Regex اليدوي)
        function resolvePath(filePath, parentPath = '') {
            if (!filePath.startsWith('.')) return filePath.replace(/^\//, '');
            const base = 'http://app/';
            const url = new URL(filePath, base + parentPath);
            return url.pathname.substring(1);
        }
        
        async function getTranspiledUrl(filePath, parentPath = '') {
            const cleanPath = resolvePath(filePath, parentPath);
            if (blobCache.has(cleanPath)) return blobCache.get(cleanPath);
            
            try {
                const res = await fetch('load.php?file=' + encodeURIComponent(cleanPath));
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text.includes('FILE_NOT_FOUND') ? `الملف غير موجود: ${cleanPath}` : `خطأ ${res.status}`);
                }
                
                let code = await res.text();
                if (code.trim().startsWith('<!DOCTYPE')) {
                    throw new Error(`خطأ: السيرفر أعاد صفحة HTML للملف ${cleanPath}.`);
                }
                
                // معالجة الـ Imports داخل الملف
                const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
                const matches = Array.from(code.matchAll(importRegex));
                
                for (const match of matches) {
                    const originalImport = match[1];
                    const depUrl = await getTranspiledUrl(originalImport, cleanPath);
                    code = code.split(`'${originalImport}'`).join(`'${depUrl}'`);
                    code = code.split(`"${originalImport}"`).join(`"${depUrl}"`);
                }

                if (!window.Babel) {
                    await new Promise(r => {
                        const check = setInterval(() => { if (window.Babel) { clearInterval(check); r(); } }, 50);
                    });
                }
                
                const transformed = window.Babel.transform(code, {
                    presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                    filename: cleanPath + '.tsx',
                }).code;

                const url = URL.createObjectURL(new Blob([transformed], { type: 'application/javascript' }));
                blobCache.set(cleanPath, url);
                return url;
            } catch (e) {
                console.error('Transpilation Error:', e);
                showError(e.message);
                throw e;
            }
        }

        async function init() {
            try {
                if (bar) bar.style.width = '30%';
                const appUrl = await getTranspiledUrl('App.tsx');
                
                if (bar) bar.style.width = '70%';
                if (statusEl) statusEl.innerText = 'جاري بناء الواجهة...';
                
                const { default: App } = await import(appUrl);
                const root = ReactDOM.createRoot(document.getElementById('root'));
                
                if (bar) bar.style.width = '100%';
                setTimeout(() => {
                    const splash = document.getElementById('splash-screen');
                    if (splash) splash.style.opacity = '0';
                    setTimeout(() => splash?.remove(), 500);
                    root.render(React.createElement(App));
                }, 200);
            } catch (e) { 
                console.error('App init failed:', e);
            }
        }
        
        window.addEventListener('load', init);
    </script>
</body>
</html>