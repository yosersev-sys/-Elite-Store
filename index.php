<?php
/**
 * سوق العصر - المحرك الخارق v8.6
 * الإصلاح النهائي والأكيد لمشاكل مسارات الموديولات والـ Refresh
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

        const VERSION = 'v8.6';
        const CACHE_KEY = 'souq_babel_' + VERSION;
        const compiledCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const blobCache = new Map();
        const pendingTasks = new Map();

        function resolvePath(path, parent) {
            if (!path.startsWith('.')) return path;
            const parts = (parent || '').split('/');
            parts.pop(); 
            const base = parts.join('/');
            const url = new URL(path, 'http://app/' + (base ? base + '/' : ''));
            // توحيد المسار وإزالة الامتدادات للطلب الداخلي
            return url.pathname.substring(1).replace(/\.(tsx|ts|jsx|js)$/, '');
        }

        async function loadAndCompile(filePath, parentPath = '') {
            const cleanPath = resolvePath(filePath, parentPath);
            
            // 1. إذا كان الملف قيد المعالجة حالياً، انتظر نتيجته بدلاً من بدئه من جديد
            if (pendingTasks.has(cleanPath)) return pendingTasks.get(cleanPath);
            
            const task = (async () => {
                if (blobCache.has(cleanPath)) return blobCache.get(cleanPath);

                let babelCode = compiledCache[cleanPath];

                if (!babelCode) {
                    try {
                        const res = await fetch('load.php?file=' + encodeURIComponent(cleanPath));
                        if (!res.ok) throw new Error(`Could not load: ${cleanPath}`);
                        const source = await res.text();
                        
                        babelCode = window.Babel.transform(source, {
                            presets: [
                                ['react', { runtime: 'classic' }], 
                                ['typescript', { isTSX: true, allExtensions: true }]
                            ],
                            filename: cleanPath + '.tsx',
                            compact: true, 
                            minified: true
                        }).code;

                        compiledCache[cleanPath] = babelCode;
                        localStorage.setItem(CACHE_KEY, JSON.stringify(compiledCache));
                    } catch (e) { 
                        console.error("Fetch/Compile Error:", cleanPath, e);
                        throw e; 
                    }
                }

                // 2. التحويل الذكي والشامل لكل مسارات الاستيراد
                // هذا الـ Regex يمسك: import '...', import {x} from '...', export {x} from '...', import('...')
                const importRegex = /(import|from|export)\s+(['"])([^'"]+)\2|import\((['"])([^'"]+)\4\)/g;
                let linkedCode = babelCode;
                const matches = Array.from(babelCode.matchAll(importRegex));

                for (const match of matches) {
                    const originalFullMatch = match[0];
                    const pathInside = match[3] || match[5]; // يغطي الاستيراد العادي والديناميكي
                    const quote = match[2] || match[4];
                    const prefix = match[1] || 'import(';

                    let resolved;
                    if (LIB_MAP[pathInside]) {
                        resolved = LIB_MAP[pathInside];
                    } else if (pathInside.startsWith('.')) {
                        resolved = await loadAndCompile(pathInside, cleanPath);
                    } else if (pathInside.startsWith('http')) {
                        resolved = pathInside;
                    } else {
                        resolved = `https://esm.sh/${pathInside}`;
                    }

                    // استبدال دقيق لكل حالة
                    if (originalFullMatch.includes('import(')) {
                        linkedCode = linkedCode.split(originalFullMatch).join(`import(${quote}${resolved}${quote})`);
                    } else {
                        linkedCode = linkedCode.split(originalFullMatch).join(`${prefix} ${quote}${resolved}${quote}`);
                    }
                }

                const url = URL.createObjectURL(new Blob([linkedCode], { type: 'application/javascript' }));
                blobCache.set(cleanPath, url);
                return url;
            })();

            pendingTasks.set(cleanPath, task);
            return task;
        }

        async function init() {
            try {
                // تصفير آلي للإصدارات القديمة لضمان نظافة الكاش
                if (localStorage.getItem('souq_v_check') !== VERSION) {
                    localStorage.clear();
                    localStorage.setItem('souq_v_check', VERSION);
                    location.reload();
                    return;
                }

                const appUrl = await loadAndCompile('App');
                const { default: App } = await import(appUrl);
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(App));
            } catch (e) {
                console.error("Boot Error:", e);
                document.body.innerHTML = `<div style="padding:40px;color:red;font-family:sans-serif;direction:rtl;line-height:1.6">
                    <h2 style="margin-bottom:10px">خطأ في تشغيل محرك المتجر</h2>
                    <div style="background:#fff2f2;padding:20px;border:2px solid #ffcccc;border-radius:15px;margin-bottom:20px">
                        <code style="display:block;margin-bottom:10px;color:#d32f2f;font-weight:bold">${e.message}</code>
                        <p style="font-size:14px;color:#666">حدث هذا الخطأ غالباً بسبب تعارض في ملفات الكاش أو فقدان ملف أساسي.</p>
                    </div>
                    <button onclick="localStorage.clear();location.reload()" style="padding:15px 30px;background:#10b981;color:white;border:none;border-radius:15px;font-weight:900;cursor:pointer;box-shadow:0 10px 20px rgba(16,185,129,0.2)">
                        تحديث وإصلاح الكاش الآن 🚀
                    </button>
                </div>`;
            }
        }

        const checkBabel = setInterval(() => {
            if (window.Babel) { clearInterval(checkBabel); init(); }
        }, 50);
    </script>
</body>
</html>