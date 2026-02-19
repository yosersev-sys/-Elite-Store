<?php
/**
 * سوق العصر - المحرك الخارق v8.7
 * الإصلاح الجذري والأخير لمشكلة الموديولات (Module Resolution)
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

        const VERSION = 'v8.7';
        const blobCache = new Map();
        const pendingTasks = new Map();

        function resolvePath(path, parent) {
            if (!path.startsWith('.')) return path;
            const parentBase = parent.includes('/') ? parent.substring(0, parent.lastIndexOf('/')) : '';
            const dummy = new URL(path, 'http://app/' + (parentBase ? parentBase + '/' : ''));
            return dummy.pathname.substring(1).replace(/\.(tsx|ts|jsx|js)$/, '');
        }

        async function loadAndCompile(filePath, parentPath = '') {
            const cleanPath = resolvePath(filePath, parentPath);
            if (pendingTasks.has(cleanPath)) return pendingTasks.get(cleanPath);
            
            const task = (async () => {
                if (blobCache.has(cleanPath)) return blobCache.get(cleanPath);

                console.debug(`[Loader] Fetching: ${cleanPath}`);
                const res = await fetch('load.php?file=' + encodeURIComponent(cleanPath));
                if (!res.ok) throw new Error(`Missing module: ${cleanPath}`);
                const source = await res.text();
                
                // ترجمة الكود مع الحفاظ على صيغة الموديولات
                const babelResult = window.Babel.transform(source, {
                    presets: [
                        ['react', { runtime: 'classic' }], 
                        ['typescript', { isTSX: true, allExtensions: true }]
                    ],
                    filename: cleanPath + '.tsx',
                    sourceMaps: false,
                    compact: false // نترك الكود غير مضغوط لسهولة الفحص والاستبدال
                });

                let code = babelResult.code;

                // نظام استبدال المسارات الفائق
                // يمسك: from "...", import "...", export ... from "...", import("...")
                const importRegex = /(from|import|export)\s+(['"])([^'"]+)\2|import\((['"])([^'"]+)\4\)/g;
                const matches = Array.from(code.matchAll(importRegex));
                
                // سنقوم بالاستبدال من النهاية إلى البداية للحفاظ على ثبات الفهارس (Offsets)
                for (let i = matches.length - 1; i >= 0; i--) {
                    const match = matches[i];
                    const fullMatch = match[0];
                    const pathInside = match[3] || match[5];
                    const quote = match[2] || match[4];
                    
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

                    // بناء الاستبدال الجديد بدقة
                    let replacement;
                    if (fullMatch.startsWith('import(')) {
                        replacement = `import(${quote}${resolved}${quote})`;
                    } else {
                        const parts = fullMatch.split(quote);
                        replacement = parts[0] + quote + resolved + quote + (parts[2] || '');
                    }

                    code = code.substring(0, match.index) + replacement + code.substring(match.index + fullMatch.length);
                }

                const url = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
                blobCache.set(cleanPath, url);
                return url;
            })();

            pendingTasks.set(cleanPath, task);
            return task;
        }

        async function init() {
            try {
                // تصفير الكاش عند تغيير الإصدار
                if (localStorage.getItem('souq_v_v') !== VERSION) {
                    localStorage.clear();
                    localStorage.setItem('souq_v_v', VERSION);
                    location.reload();
                    return;
                }

                const appUrl = await loadAndCompile('App');
                const { default: App } = await import(appUrl);
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(App));
                console.log("[System] App mounted successfully.");
            } catch (e) {
                console.error("[Boot Error]", e);
                document.body.innerHTML = `
                <div style="padding:40px;color:#d32f2f;font-family:sans-serif;direction:rtl;text-align:center;background:#fff5f5;min-height:100vh">
                    <div style="font-size:60px">⚠️</div>
                    <h2 style="margin:20px 0">عذراً، فشل تشغيل محرك المتجر</h2>
                    <div style="display:inline-block;text-align:right;background:#fff;padding:20px;border-radius:20px;border:1px solid #ffcdd2;box-shadow:0 10px 30px rgba(0,0,0,0.05);max-width:500px">
                        <p style="font-weight:bold;margin-bottom:10px">تفاصيل الخطأ التقني:</p>
                        <code style="display:block;background:#eee;padding:10px;border-radius:10px;font-size:12px;word-break:break-all">${e.message}</code>
                        <p style="font-size:13px;color:#666;margin-top:15px">سبب محتمل: المتصفح لا يدعم ميزات حديثة أو هناك تداخل في ملفات الكاش.</p>
                    </div>
                    <div style="margin-top:30px">
                        <button onclick="localStorage.clear();location.reload()" style="padding:15px 40px;background:#10b981;color:#white;border:none;border-radius:15px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 10px 20px rgba(16,185,129,0.2)">
                            تحديث وإصلاح فوري 🚀
                        </button>
                    </div>
                </div>`;
            }
        }

        const checkBabel = setInterval(() => {
            if (window.Babel) { clearInterval(checkBabel); init(); }
        }, 50);
    </script>
</body>
</html>