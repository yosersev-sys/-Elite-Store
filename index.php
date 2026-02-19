<?php
/**
 * سوق العصر - المحرك الخارق v8.4
 * إصلاح نهائي لمشكلة الـ Refresh و الـ Dynamic Import Blobs
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
        .skeleton { background: #edf2f7; background-image: linear-gradient(90deg, #edf2f7 0px, #f7fafc 40px, #edf2f7 80px); background-size: 600px; animation: shine-lines 1.6s infinite linear; }
        @keyframes shine-lines { 0% { background-position: -100px; } 40%, 100% { background-position: 140px; } }
    </style>
</head>
<body>
    <div id="root">
        <div id="initial-skeleton" style="padding: 10px;">
            <div class="skeleton" style="height: 60px; border-radius: 20px; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 200px; border-radius: 30px; margin-bottom: 20px;"></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="skeleton" style="height: 250px; border-radius: 20px;"></div>
                <div class="skeleton" style="height: 250px; border-radius: 20px;"></div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js"></script>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        window.process = { env: { API_KEY: '<?php echo $gemini_key; ?>' } };
        
        const LIB_MAP = {
            'react': 'https://esm.sh/react@19.0.0',
            'react-dom': 'https://esm.sh/react-dom@19.0.0',
            'react-dom/client': 'https://esm.sh/react-dom@19.0.0/client',
            '@google/genai': 'https://esm.sh/@google/genai@1.41.0'
        };

        const CACHE_KEY = 'souq_babel_v8.4';
        const compiledCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const blobCache = new Map();

        function resolvePath(path, parent) {
            if (!path.startsWith('.')) return path;
            const parts = (parent || '').split('/');
            parts.pop();
            const base = parts.join('/');
            const url = new URL(path, 'http://app/' + (base ? base + '/' : ''));
            return url.pathname.substring(1).replace(/\.(tsx|ts|jsx|js)$/, '');
        }

        async function loadAndCompile(filePath, parentPath = '') {
            const cleanPath = resolvePath(filePath, parentPath);
            if (blobCache.has(cleanPath)) return blobCache.get(cleanPath);

            let babelCode = compiledCache[cleanPath];

            // 1. إذا لم يكن موجوداً في الكاش، نقوم بتحميله وترجمته وحفظه "خام"
            if (!babelCode) {
                try {
                    const res = await fetch('load.php?file=' + encodeURIComponent(cleanPath));
                    if (!res.ok) throw new Error(`Missing: ${cleanPath}`);
                    const source = await res.text();
                    
                    babelCode = window.Babel.transform(source, {
                        presets: [['react', { runtime: 'classic' }], ['typescript', { isTSX: true, allExtensions: true }]],
                        filename: cleanPath + '.tsx',
                        compact: true, minified: true
                    }).code;

                    compiledCache[cleanPath] = babelCode;
                    localStorage.setItem(CACHE_KEY, JSON.stringify(compiledCache));
                } catch (e) { console.error(e); throw e; }
            }

            // 2. مرحلة الربط (Linking): نقوم باستبدال المسارات بـ Blob URLs جديدة لهذه الجلسة فقط
            let linkedCode = babelCode;
            const importRegex = /from\s+['"]([^'"]+)['"]/g;
            const matches = Array.from(babelCode.matchAll(importRegex));

            for (const match of matches) {
                const original = match[1];
                let resolved;
                
                if (LIB_MAP[original]) {
                    resolved = LIB_MAP[original];
                } else if (original.startsWith('.')) {
                    // استدعاء تكراري للحصول على رابط Blob جديد للملف التابع
                    resolved = await loadAndCompile(original, cleanPath);
                } else {
                    resolved = `https://esm.sh/${original}`;
                }
                
                // استبدال دقيق للمسار
                linkedCode = linkedCode.split(`'${original}'`).join(`'${resolved}'`);
                linkedCode = linkedCode.split(`"${original}"`).join(`"${resolved}"`);
            }

            const url = URL.createObjectURL(new Blob([linkedCode], { type: 'application/javascript' }));
            blobCache.set(cleanPath, url);
            return url;
        }

        async function init() {
            try {
                // إجبار الكاش القديم المكسور على التلاشي إذا كان من إصدار أقدم
                if (!localStorage.getItem('souq_v8.4_check')) {
                    localStorage.clear();
                    localStorage.setItem('souq_v8.4_check', 'ok');
                    location.reload();
                    return;
                }

                const appUrl = await loadAndCompile('App');
                const { default: App } = await import(appUrl);
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(App));
            } catch (e) {
                console.error("Boot Error:", e);
                document.body.innerHTML = `<div style="padding:40px;color:red;font-family:sans-serif;direction:rtl">
                    <h2>خطأ في تشغيل المتجر</h2>
                    <p>${e.message}</p>
                    <button onclick="localStorage.clear();location.reload()" style="padding:10px 20px;background:#10b981;color:white;border:none;border-radius:10px;font-weight:bold">تحديث وإصلاح الكاش</button>
                </div>`;
            }
        }

        const checkBabel = setInterval(() => {
            if (window.Babel) { clearInterval(checkBabel); init(); }
        }, 50);
    </script>
</body>
</html>