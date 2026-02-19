<?php
/**
 * سوق العصر - المحرك الخارق v8.0
 * حل نهائي لمشاكل الاستيراد وأداء فائق السرعة
 */
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 

require_once 'config.php';

$gemini_key = '';
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key'");
    $stmt->execute();
    $gemini_key = $stmt->fetchColumn() ?: '';
} catch (Exception $e) {}

$meta_title = 'سوق العصر - فاقوس';
$meta_desc = 'تسوق أونلاين بكل سهولة من هاتفك.';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title><?php echo $meta_title; ?></title>
    
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">

    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
    
    <style>
        :root { --primary: #10b981; }
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; font-display: swap; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; }
        #splash-screen {
            position: fixed; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: #f8fafc; z-index: 9999;
            transition: opacity 0.4s ease;
        }
        .logo-box { width: 80px; height: 80px; background: #10b981; border-radius: 24px; display: flex; align-items: center; justify-content: center; shadow: 0 20px 40px rgba(16,185,129,0.2); animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.95); } }
        .p-bar { width: 140px; height: 4px; background: #e2e8f0; border-radius: 10px; margin-top: 20px; overflow: hidden; }
        #p-fill { height: 100%; width: 0%; background: #10b981; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div id="root">
        <div id="splash-screen">
            <div class="logo-box">
                <svg viewBox="0 0 24 24" width="45" height="45" fill="white">
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9-1a2 2 0 0 1 4 0v1h-4V6zm9 14H5V9h14v11z"/>
                </svg>
            </div>
            <h1 class="font-black text-slate-800 text-xl mt-4">سوق العصر</h1>
            <div class="p-bar"><div id="p-fill"></div></div>
        </div>
    </div>

    <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js"></script>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = { env: { API_KEY: '<?php echo $gemini_key; ?>' } };
        const fill = document.getElementById('p-fill');
        
        // خريطة المكتبات لتعويض الـ Bare Specifiers يدوياً لضمان العمل داخل الـ Blobs
        const LIB_MAP = {
            'react': 'https://esm.sh/react@19.0.0',
            'react-dom': 'https://esm.sh/react-dom@19.0.0',
            'react-dom/client': 'https://esm.sh/react-dom@19.0.0/client',
            '@google/genai': 'https://esm.sh/@google/genai@1.41.0'
        };

        const CACHE_KEY = 'souq_compiled_v8';
        const compiledCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const blobCache = new Map();

        function resolvePath(path, parent) {
            if (!path.startsWith('.')) return path;
            const parts = (parent || '').split('/');
            parts.pop();
            const base = parts.join('/');
            const url = new URL(path, 'http://app/' + (base ? base + '/' : ''));
            return url.pathname.substring(1);
        }

        async function loadAndCompile(filePath, parentPath = '') {
            const cleanPath = resolvePath(filePath, parentPath);
            if (blobCache.has(cleanPath)) return blobCache.get(cleanPath);

            // التحقق من الكاش (Compiled JS)
            if (compiledCache[cleanPath]) {
                const url = URL.createObjectURL(new Blob([compiledCache[cleanPath]], { type: 'application/javascript' }));
                blobCache.set(cleanPath, url);
                return url;
            }

            try {
                const res = await fetch('load.php?file=' + encodeURIComponent(cleanPath));
                if (!res.ok) throw new Error(`Missing: ${cleanPath}`);
                let code = await res.text();

                // معالجة الاستيرادات قبل التحويل
                const importRegex = /from\s+['"]([^'"]+)['"]/g;
                const matches = Array.from(code.matchAll(importRegex));

                for (const match of matches) {
                    const original = match[1];
                    let resolved;
                    
                    if (LIB_MAP[original]) {
                        resolved = LIB_MAP[original]; // ربط مباشر للمكتبات
                    } else if (original.startsWith('.')) {
                        resolved = await loadAndCompile(original, cleanPath);
                    } else {
                        resolved = `https://esm.sh/${original}`;
                    }
                    
                    code = code.split(`'${original}'`).join(`'${resolved}'`);
                    code = code.split(`"${original}"`).join(`"${resolved}"`);
                }

                const compiled = window.Babel.transform(code, {
                    presets: [['react', { runtime: 'classic' }], ['typescript', { isTSX: true, allExtensions: true }]],
                    filename: cleanPath + '.tsx',
                    compact: true, minified: true
                }).code;

                // حفظ في الكاش الدائم
                compiledCache[cleanPath] = compiled;
                localStorage.setItem(CACHE_KEY, JSON.stringify(compiledCache));

                const url = URL.createObjectURL(new Blob([compiled], { type: 'application/javascript' }));
                blobCache.set(cleanPath, url);
                return url;
            } catch (e) { console.error(e); throw e; }
        }

        async function init() {
            try {
                if (fill) fill.style.width = '40%';
                const appUrl = await loadAndCompile('App.tsx');
                
                if (fill) fill.style.width = '90%';
                const { default: App } = await import(appUrl);
                const root = ReactDOM.createRoot(document.getElementById('root'));
                
                if (fill) fill.style.width = '100%';
                setTimeout(() => {
                    const splash = document.getElementById('splash-screen');
                    if (splash) splash.style.opacity = '0';
                    setTimeout(() => splash?.remove(), 400);
                    root.render(React.createElement(App));
                }, 100);
            } catch (e) {
                console.error("Boot Error:", e);
                document.body.innerHTML = `<div style="padding:40px;color:red;font-family:sans-serif">
                    <h2>خطأ في التشغيل</h2>
                    <p>${e.message}</p>
                    <button onclick="localStorage.clear();location.reload()">إصلاح وتحديث</button>
                </div>`;
            }
        }

        // الانتظار حتى جهوزية بابل
        const checkBabel = setInterval(() => {
            if (window.Babel) { clearInterval(checkBabel); init(); }
        }, 50);
    </script>
</body>
</html>