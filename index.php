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
    
<?php
    $cssFiles = glob(__DIR__ . '/dist/assets/*.css');
    if ($cssFiles && count($cssFiles) > 0) {
        foreach ($cssFiles as $css) {
            $cssUrl = 'dist/assets/' . basename($css);
            echo '<link rel="stylesheet" crossorigin href="' . $cssUrl . '?v=' . filemtime($css) . '">';
        }
    }
    ?>

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

    <script>
        window.process = { env: { API_KEY: '<?php echo addslashes($gemini_key); ?>' } };
    </script>

    <?php
    $jsFiles = glob(__DIR__ . '/dist/assets/*.js');
    if ($jsFiles && count($jsFiles) > 0) {
        foreach ($jsFiles as $js) {
            $jsUrl = 'dist/assets/' . basename($js);
            echo '<script type="module" crossorigin src="' . $jsUrl . '?v=' . filemtime($js) . '"></script>';
        }
    } else {
        echo '<div style="padding:40px;color:#d32f2f;font-family:sans-serif;direction:rtl;text-align:center;">
                <div style="font-size:60px">⚠️</div>
                <h2 style="margin:20px 0">واجهة المستخدم قيد المعالجة</h2>
                <p>يرجى تشغيل أمر بناء المشروع <b>npm run build</b> في مجلد الخادم لتوليد ملفات العرض الجاهزة.</p>
              </div>';
    }
    ?>
</body>
</html>