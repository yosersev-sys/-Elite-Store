<?php
/**
 * سوق العصر - المحرك الذكي v4.1 (Mobile APK Optimized)
 */
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl" style="scroll-behavior: smooth;">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>سوق العصر - اول سوق الكتروني في فاقوس</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    
    <!-- PWA & Android Meta Tags -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="https://soqelasr.com/shopping-bag512.png">

    <script>window.process = { env: { API_KEY: "" } };</script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    
    <!-- External Libraries -->
    <script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react-dom": "https://esm.sh/react-dom@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
        "react-router-dom": "https://esm.sh/react-router-dom@7.1.0?external=react,react-dom",
        "@google/genai": "https://esm.sh/@google/genai@1.38.0"
      }
    }
    </script>
    
    <style>
        :root { --primary: #10b981; }
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; user-select: none; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; }
        #initial-loader { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; z-index: 99999; transition: opacity 0.5s; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        #error-display { display: none; padding: 20px; color: #e11d48; text-align: center; font-weight: bold; background: #fff1f2; border: 2px solid #fda4af; border-radius: 20px; margin: 20px; }
    </style>
</head>
<body>
    <div id="initial-loader">
        <div class="spinner"></div>
        <p id="loader-text" style="margin-top:20px; font-weight:900; color:#10b981; text-align:center;">سوق العصر - جاري التحميل...</p>
        <div id="error-display"></div>
    </div>
    <div id="root"></div>

    <script type="module">
        import React from 'react';
        import ReactDOM from 'react-dom/client';

        const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const blobCache = new Map();

        async function fetchWithFallback(url) {
            const extensions = ['', '.tsx', '.ts', '.jsx', '.js'];
            for (let ext of extensions) {
                try {
                    const fullUrl = url + (url.match(/\.(tsx?|jsx?)$/) ? '' : ext);
                    const response = await fetch(fullUrl);
                    if (response.ok) {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('text/html')) continue;
                        return { code: await response.text(), finalUrl: fullUrl };
                    }
                } catch (e) {}
            }
            throw new Error(`تعذر العثور على الملف: ${url}`);
        }

        async function getTranspiledUrl(filePath) {
            const absolutePath = new URL(filePath, BASE_URL).href;
            if (blobCache.has(absolutePath)) return blobCache.get(absolutePath);

            try {
                const { code: rawCode, finalUrl } = await fetchWithFallback(absolutePath);
                let code = rawCode;

                const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
                const matches = [...code.matchAll(importRegex)];
                
                for (const match of matches) {
                    const relativePath = match[1];
                    const fullImportPath = new URL(relativePath, finalUrl).href;
                    const depBlobUrl = await getTranspiledUrl(fullImportPath);
                    code = code.split(`'${relativePath}'`).join(`'${depBlobUrl}'`);
                    code = code.split(`"${relativePath}"`).join(`"${depBlobUrl}"`);
                }

                const transformed = Babel.transform(code, {
                    presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
                    filename: finalUrl,
                }).code;

                const blob = new Blob([transformed], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                blobCache.set(absolutePath, blobUrl);
                return blobUrl;
            } catch (err) {
                throw err;
            }
        }

        async function startApp() {
            try {
                const appBlobUrl = await getTranspiledUrl('App.tsx');
                const module = await import(appBlobUrl);
                const App = module.default;

                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(React.createElement(App));

                document.getElementById('initial-loader').style.opacity = '0';
                setTimeout(() => document.getElementById('initial-loader').remove(), 500);
            } catch (err) {
                console.error("Critical Load Error:", err);
                const errorDisplay = document.getElementById('error-display');
                const loaderText = document.getElementById('loader-text');
                if (errorDisplay) {
                    errorDisplay.style.display = 'block';
                    errorDisplay.innerHTML = `حدث خطأ تقني: <br/> ${err.message}`;
                    if (loaderText) loaderText.style.display = 'none';
                }
            }
        }

        startApp();
    </script>
</body>
</html>