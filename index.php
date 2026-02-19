<?php
/**
 * سوق العصر - المحرك المحسن v6.0
 * تحسينات الأداء (Performance) والـ SEO
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
    <meta name="keywords" content="<?php echo htmlspecialchars($store_settings['homepage_keywords'] ?? 'سوق, العصر, فاقوس, خضروات, فاكهة'); ?>">
    
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">

    <!-- Preconnect to speed up 3rd party resource loading -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://unpkg.com">
    <link rel="preconnect" href="https://esm.sh">

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
        }
        .progress-box { width: 200px; height: 4px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-top: 20px; }
        #progress-bar { height: 100%; width: 0%; background: #10b981; transition: width 0.3s ease; }
        
        /* تجميل الـ Image Loaders لمنع الـ Layout Shift */
        .image-aspect-ratio { position: relative; width: 100%; height: 0; padding-bottom: 125%; background: #f1f5f9; border-radius: 2rem; overflow: hidden; }
        
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
            <div class="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-4 shadow-xl">
                <img src="https://soqelasr.com/shopping-bag.png" alt="Logo" width="45" height="45" fetchpriority="high">
            </div>
            <h1 class="font-black text-slate-800 text-xl">سوق العصر</h1>
            <div class="progress-box"><div id="progress-bar"></div></div>
        </div>
    </div>

    <div id="error-log"></div>

    <!-- Babel is heavy, load it with defer to not block initial render -->
    <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js" defer></script>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = { env: { API_KEY: '<?php echo $gemini_key; ?>' } };
        const blobCache = new Map();
        const bar = document.getElementById('progress-bar');

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
                if (!res.ok) throw new Error(`فشل تحميل الملف: ${cleanPath}`);
                
                let code = await res.text();
                const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
                const matches = Array.from(code.matchAll(importRegex));
                
                for (const match of matches) {
                    const originalImport = match[1];
                    const depUrl = await getTranspiledUrl(originalImport, cleanPath);
                    code = code.split(`'${originalImport}'`).join(`'${depUrl}'`);
                    code = code.split(`"${originalImport}"`).join(`"${depUrl}"`);
                }

                // Wait for Babel if not ready
                if (!window.Babel) {
                    await new Promise(r => {
                        const check = setInterval(() => { if (window.Babel) { clearInterval(check); r(); } }, 20);
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
                console.error(e);
                throw e;
            }
        }

        async function init() {
            try {
                if (bar) bar.style.width = '40%';
                const appUrl = await getTranspiledUrl('App.tsx');
                
                const { default: App } = await import(appUrl);
                const root = ReactDOM.createRoot(document.getElementById('root'));
                
                if (bar) bar.style.width = '100%';
                setTimeout(() => {
                    const splash = document.getElementById('splash-screen');
                    if (splash) {
                        splash.style.transition = 'opacity 0.3s ease';
                        splash.style.opacity = '0';
                        setTimeout(() => splash.remove(), 300);
                    }
                    root.render(React.createElement(App));
                }, 100);
            } catch (e) { 
                const el = document.getElementById('error-log');
                if (el) { el.style.display = 'block'; el.innerText = 'حدث خطأ في تشغيل التطبيق. يرجى تحديث الصفحة.'; }
            }
        }
        
        init();
    </script>
</body>
</html>