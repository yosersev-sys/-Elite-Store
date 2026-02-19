<?php
/**
 * سوق العصر - المحرك الخارق v7.0
 * نظام الكاش المستمر للأداء الأقصى
 */
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 

require_once 'config.php';

$gemini_key = '';
$store_settings = [];
try {
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('gemini_api_key', 'homepage_description', 'homepage_keywords', 'homepage_title')");
    $stmt->execute();
    while($row = $stmt->fetch()) {
        if($row['setting_key'] === 'gemini_api_key') $gemini_key = $row['setting_value'];
        else $store_settings[$row['setting_key']] = $row['setting_value'];
    }
} catch (Exception $e) {}

$meta_title = $store_settings['homepage_title'] ?? 'سوق العصر - اول سوق الكتروني في فاقوس';
$meta_desc = $store_settings['homepage_description'] ?? 'تسوق الخضروات، الفواكه، ومنتجات السوبر ماركت في فاقوس أونلاين بكل سهولة.';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title><?php echo htmlspecialchars($meta_title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($meta_desc); ?>">
    
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">

    <!-- Preload Critical Scripts -->
    <link rel="modulepreload" href="https://esm.sh/react@19.0.0">
    <link rel="modulepreload" href="https://esm.sh/react-dom@19.0.0/client">

    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    
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
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; font-display: swap; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; min-height: 100vh; }
        
        #splash-screen {
            position: fixed; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: #f8fafc; z-index: 9999;
            transition: opacity 0.4s ease;
        }
        .progress-box { width: 160px; height: 3px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-top: 24px; }
        #progress-bar { height: 100%; width: 0%; background: #10b981; transition: width 0.2s ease; }
        
        /* Inline SVG Logo Styling */
        .logo-svg { width: 50px; height: 50px; fill: white; filter: drop-shadow(0 10px 15px rgba(16,185,129,0.3)); }
        
        #error-log {
            position: fixed; bottom: 20px; left: 20px; right: 20px;
            background: #fff1f2; border: 1px solid #fda4af; padding: 15px;
            border-radius: 15px; color: #9f1239; font-size: 11px; display: none; z-index: 10000;
        }
    </style>
</head>
<body>
    <div id="root">
        <div id="splash-screen">
            <div class="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-4 shadow-2xl animate-pulse">
                <!-- Inline SVG for zero-latency icon display -->
                <svg viewBox="0 0 24 24" class="logo-svg">
                    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9-1a2 2 0 0 1 4 0v1h-4V6zm9 14H5V9h14v11z"/>
                </svg>
            </div>
            <h1 class="font-black text-slate-800 text-2xl tracking-tighter">سوق العصر</h1>
            <div class="progress-box"><div id="progress-bar"></div></div>
            <p id="perf-hint" class="text-[9px] text-slate-400 font-bold mt-4 uppercase tracking-widest">تحسين الأداء الذكي...</p>
        </div>
    </div>
    <div id="error-log"></div>

    <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js" defer></script>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = { env: { API_KEY: '<?php echo $gemini_key; ?>' } };
        const bar = document.getElementById('progress-bar');
        const blobCache = new Map();
        
        // نظام كاش localStorage للملفات المحولة لسرعة البرق في المرة الثانية
        const CODE_CACHE_KEY = 'souq_code_cache_v7';
        let codeCache = {};
        try { codeCache = JSON.parse(localStorage.getItem(CODE_CACHE_KEY) || '{}'); } catch(e) {}

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
                // محاولة جلب الكود من الكاش أولاً
                let code;
                if (codeCache[cleanPath]) {
                    code = codeCache[cleanPath];
                } else {
                    const res = await fetch('load.php?file=' + encodeURIComponent(cleanPath));
                    if (!res.ok) throw new Error(`404: ${cleanPath}`);
                    code = await res.text();
                }
                
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
                        const check = setInterval(() => { if (window.Babel) { clearInterval(check); r(); } }, 10);
                    });
                }
                
                const transformed = window.Babel.transform(code, {
                    presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                    filename: cleanPath + '.tsx',
                    compact: true,
                    minified: true
                }).code;

                // تحديث الكاش بالنسخة المحولة
                codeCache[cleanPath] = code; 
                localStorage.setItem(CODE_CACHE_KEY, JSON.stringify(codeCache));

                const url = URL.createObjectURL(new Blob([transformed], { type: 'application/javascript' }));
                blobCache.set(cleanPath, url);
                return url;
            } catch (e) {
                console.error(e);
                throw e;
            }
        }

        async function init() {
            try {
                if (bar) bar.style.width = '30%';
                // تحميل App.tsx والاعتماديات في نفس الوقت بقدر الإمكان
                const appUrl = await getTranspiledUrl('App.tsx');
                
                if (bar) bar.style.width = '80%';
                const { default: App } = await import(appUrl);
                const root = ReactDOM.createRoot(document.getElementById('root'));
                
                if (bar) bar.style.width = '100%';
                requestAnimationFrame(() => {
                    const splash = document.getElementById('splash-screen');
                    if (splash) {
                        splash.style.opacity = '0';
                        setTimeout(() => splash.remove(), 400);
                    }
                    root.render(React.createElement(App));
                });
            } catch (e) { 
                document.getElementById('error-log').style.display = 'block';
                document.getElementById('error-log').innerText = e.message;
            }
        }
        
        init();
    </script>
</body>
</html>