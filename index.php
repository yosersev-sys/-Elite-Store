
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاقوس ستور - المتجر الإلكتروني الحديث</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react-dom": "https://esm.sh/react-dom@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
        "react-router-dom": "https://esm.sh/react-router-dom@7.1.0",
        "@google/genai": "https://esm.sh/@google/genai@1.38.0"
      }
    }
    </script>
    <style>
        * { font-family: 'Cairo', sans-serif; }
        body { background-color: #f8faf7; margin: 0; padding: 0; min-height: 100vh; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .glass-header { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="index.tsx"></script>
</body>
</html>
