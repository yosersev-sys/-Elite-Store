<?php
/**
 * Entry point for Elite Store
 * This file bootstraps the React application
 */
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>متجر النخبة | منصة التسوق الذكية</title>
    
    <!-- Meta tags for SEO are managed by the application dynamically -->
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- External Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ['Cairo', 'sans-serif'],
            },
            animation: {
              'fadeIn': 'fadeIn 0.5s ease-out forwards',
              'slideDown': 'slideDown 0.5s ease-out forwards',
            },
            keyframes: {
              fadeIn: { 'from': { opacity: '0', transform: 'translateY(10px)' }, 'to': { opacity: '1', transform: 'translateY(0)' } },
              slideDown: { 'from': { opacity: '0', transform: 'translateY(-20px)' }, 'to': { opacity: '1', transform: 'translateY(0)' } },
            }
          },
        },
      }
    </script>
    
    <style>
      * { font-family: 'Cairo', sans-serif; }
      body { -webkit-font-smoothing: antialiased; background-color: #f9fafb; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #f1f1f1; }
      ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: #818cf8; }
      .no-export { display: none !important; }
    </style>

    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@^19.2.4",
        "react/": "https://esm.sh/react@^19.2.4/",
        "react-dom/": "https://esm.sh/react-dom@^19.2.4/",
        "@google/genai": "https://esm.sh/@google/genai@^1.38.0"
      }
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <!-- Load the main React entry point -->
    <script type="module" src="index.tsx"></script>
  </body>
</html>