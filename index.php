<?php
/**
 * سوق العصر - المحرك الذكي v5.2 (إصلاح الثبات)
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
    <title>سوق العصر - فاقوس</title>
    
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
        .loader-logo { width: 80px; height: 80px; background: #10b981; border-radius: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(16, 185, 129, 0.1); animation: pulse 2s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.95); } }
    </style>
</head>
<body>
    <div id="root">
        <div id="splash-screen">
            <div class="loader-logo"><img src="https://soqelasr.com/shopping-bag.png" class="w-12 h-12" alt="Logo"></div>
            <div class="mt-6 text-slate-800 font-black text-xl">سوق العصر</div>
            <div class="mt-2 text-slate-400 text-[10px] font-bold tracking-widest uppercase">جاري التشغيل...</div>
        </div>
    </div>

    <script>window.process = { env: { API_KEY: '<?php echo $gemini_key; ?>' } };</script>
    <script type="text/babel" data-type="module" src="index.tsx"></script>

    <script>
        window.addEventListener('load', () => {
            setTimeout(() => {
                const splash = document.getElementById('splash-screen');
                if (splash) { splash.style.opacity = '0'; setTimeout(() => splash.remove(), 500); }
            }, 1000);
        });
    </script>
</body>
</html>