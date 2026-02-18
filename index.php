
<?php
/**
 * سوق العصر - المحرك الذكي v4.5 Optimized
 */
header('Content-Type: text/html; charset=utf-8');
require_once 'config.php';

$gemini_key = '';
$settings = [];
try {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
    while($row = $stmt->fetch()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    $gemini_key = $settings['gemini_api_key'] ?? '';
} catch (Exception $e) {}

$page_title = $settings['homepage_title'] ?? 'سوق العصر - أول سوق إلكتروني في فاقوس';
$page_desc = $settings['homepage_description'] ?? 'تسوق أفضل الخضروات، الفواكه، ومنتجات السوبر ماركت في فاقوس أونلاين بضغطة زر.';
$page_keywords = $settings['homepage_keywords'] ?? 'سوق العصر, فاقوس, سوبر ماركت, خضروات, توصيل';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl" style="scroll-behavior: smooth;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    
    <!-- SEO Meta Tags -->
    <title><?php echo $page_title; ?></title>
    <meta name="description" content="<?php echo $page_desc; ?>">
    <meta name="keywords" content="<?php echo $page_keywords; ?>">
    <meta name="author" content="سوق العصر">
    <link rel="canonical" href="https://soqelasr.com/">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://soqelasr.com/">
    <meta property="og:title" content="<?php echo $page_title; ?>">
    <meta property="og:description" content="<?php echo $page_desc; ?>">
    <meta property="og:image" content="https://soqelasr.com/shopping-bag512.png">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    
    <!-- PWA -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">
    <meta name="mobile-web-app-capable" content="yes">

    <script src="https://cdn.tailwindcss.com"></script>
    <!-- تحسين تحميل الخطوط -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap&display=swap" rel="stylesheet">
    
    <!-- تحميل المكتبات بشكل غير متزامن -->
    <script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js" defer></script>
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
        * { font-family: 'Cairo', sans-serif; font-display: swap; -webkit-tap-highlight-color: transparent; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; min-height: 100vh; }
        
        /* تقليل الـ CLS عبر حجز مساحة الهيدر والسلايدر */
        header { min-height: 70px; }
        
        @keyframes pulse-soft { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.95); opacity: 0.8; } }
        
        #splash-screen {
            position: fixed; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; background: #f8fafc; z-index: 9999;
        }
        .splash-container { display: flex; flex-direction: column; align-items: center; width: 280px; text-align: center; }
        .splash-logo {
            width: 100px; height: 100px; background: #10b981; border-radius: 32px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
            animation: pulse-soft 2s infinite ease-in-out; margin-bottom: 24px;
        }
        .splash-logo img { width: 60px; height: 60px; object-fit: contain; }
        .splash-text { color: #1e293b; font-weight: 900; font-size: 1.6rem; }
        .progress-box { width: 100%; height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-top: 20px; }
        #progress-bar { height: 100%; width: 0%; background: #10b981; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div id="root">
        <div id="splash-screen">
            <div class="splash-container">
                <div class="splash-logo">
                    <img src="https://soqelasr.com/shopping-bag.png" alt="سوق العصر" width="60" height="60">
                </div>
                <div class="splash-text">سوق العصر</div>
                <div class="progress-box"><div id="progress-bar"></div></div>
            </div>
        </div>
    </div>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        window.process = { env: { API_KEY: '<?php echo $gemini_key; ?>' } };

        const progressBar = document.getElementById('progress-bar');
        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const blobCache = new Map();

        async function getTranspiledUrl(filePath) {
            const absolutePath = new URL(filePath, BASE_URL).href;
            if (blobCache.has(absolutePath)) return blobCache.get(absolutePath);
            const res = await fetch(absolutePath);
            let code = await res.text();
            
            const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
            const matches = [...code.matchAll(importRegex)];
            for (const match of matches) {
                const depUrl = await getTranspiledUrl(new URL(match[1], absolutePath).href);
                code = code.split(match[1]).join(depUrl);
            }

            const transformed = Babel.transform(code, {
                presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                filename: absolutePath,
            }).code;

            const blobUrl = URL.createObjectURL(new Blob([transformed], { type: 'application/javascript' }));
            blobCache.set(absolutePath, blobUrl);
            return blobUrl;
        }

        async function startApp() {
            try {
                if(progressBar) progressBar.style.width = '30%';
                const appBlobUrl = await getTranspiledUrl('App.tsx');
                if(progressBar) progressBar.style.width = '100%';
                const module = await import(appBlobUrl);
                ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(module.default));
            } catch (err) {
                console.error(err);
            }
        }
        startApp();
    </script>
</body>
</html>
