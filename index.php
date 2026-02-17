<?php
/**
 * سوق العصر - المحرك الذكي v5.0 (نسخة الأداء العالي)
 */
header('Content-Type: text/html; charset=utf-8');
require_once 'config.php';

$gemini_key = '';
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key' LIMIT 1");
    $stmt->execute();
    $gemini_key = $stmt->fetchColumn() ?: '';
} catch (Exception $e) {}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl" style="scroll-behavior: smooth;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>سوق العصر - سرعة فائقة</title>
    
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">
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
        "@google/genai": "https://esm.sh/@google/genai@1.41.0"
      }
    }
    </script>
    
    <style>
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; }
        #splash-screen { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; z-index: 9999; transition: opacity 0.5s; }
        .progress-box { width: 280px; height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-top: 20px; }
        #progress-bar { height: 100%; width: 0%; background: #10b981; transition: width 0.2s; }
    </style>
</head>
<body>
    <div id="root">
        <div id="splash-screen">
            <div class="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl animate-pulse">
                <img src="https://soqelasr.com/shopping-bag.png" class="w-12 h-12" alt="Logo">
            </div>
            <div class="text-slate-800 font-black text-xl">سوق العصر</div>
            <div id="status-text" class="text-slate-400 text-xs font-bold mt-2">جاري تسريع المحرك...</div>
            <div class="progress-box"><div id="progress-bar"></div></div>
        </div>
    </div>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        const CACHE_VERSION = 'v2.1'; 
        const statusText = document.getElementById('status-text');
        const progressBar = document.getElementById('progress-bar');
        window.process = { env: { API_KEY: '<?php echo $gemini_key; ?>' } };

        async function getFileWithCache(filePath) {
            const cacheKey = `source_${filePath}_${CACHE_VERSION}`;
            const cached = localStorage.getItem(cacheKey);
            
            // جلب بصمة الملف (Timestamp) من السيرفر للتأكد من عدم وجود تحديثات
            const response = await fetch(filePath);
            const content = await response.text();
            
            // إذا كان الملف المترجم مخزناً مسبقاً، استخدمه فوراً لتوفير وقت Babel
            const transpiledKey = `js_${filePath}_${CACHE_VERSION}`;
            const cachedJs = localStorage.getItem(transpiledKey);
            
            if (cachedJs && localStorage.getItem(cacheKey) === content) {
                return cachedJs;
            }

            // تحويل الكود (Transpile)
            const transpiled = Babel.transform(content, {
                presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                filename: filePath,
            }).code;

            // حفظ في التخزين المؤقت للمرة القادمة
            localStorage.setItem(cacheKey, content);
            localStorage.setItem(transpiledKey, transpiled);
            
            return transpiled;
        }

        async function loadApp() {
            try {
                progressBar.style.width = '30%';
                const appCode = await getFileWithCache('App.tsx');
                
                progressBar.style.width = '80%';
                // استبدال الـ imports اليدوية بكود ديناميكي متوافق مع المترجم
                const blob = new Blob([appCode], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                
                const module = await import(url);
                const App = module.default;
                
                progressBar.style.width = '100%';
                document.getElementById('splash-screen').style.opacity = '0';
                
                setTimeout(() => {
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(React.createElement(App));
                    document.getElementById('splash-screen').remove();
                }, 500);

            } catch (err) {
                console.error("Critical Load Error:", err);
                statusText.innerText = "فشل التحميل، يرجى تحديث الصفحة";
                statusText.className = "text-rose-500 font-bold mt-2";
            }
        }

        loadApp();
    </script>
</body>
</html>