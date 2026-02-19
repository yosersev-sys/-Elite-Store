<?php
/**
 * Soq Al-Asr - Smart Loader v5.4
 * يضمن تحميل الملفات البرمجية بدون تحويلات (Redirects)
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

$file = $_GET['file'] ?? '';
$baseDir = __DIR__;

// تنظيف المسار
$file = str_replace(['../', '..\\'], '', $file);
$file = ltrim($file, '/');

// محاولة العثور على الملف بالامتدادات الممكنة
$targetPath = null;
$extensions = ['', '.tsx', '.ts', '.jsx', '.js'];

foreach ($extensions as $ext) {
    $tryPath = $baseDir . '/' . $file . $ext;
    if (file_exists($tryPath) && !is_dir($tryPath)) {
        $targetPath = $tryPath;
        break;
    }
}

if ($targetPath) {
    $ext = pathinfo($targetPath, PATHINFO_EXTENSION);
    $mime = 'text/plain';
    
    if (in_array($ext, ['ts', 'tsx', 'js', 'jsx'])) {
        $mime = 'application/javascript';
    } elseif (in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'])) {
        $mime = 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext);
    }

    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET');
    header('Content-Type: ' . $mime . '; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    
    readfile($targetPath);
    exit;
}

// إذا لم يتم العثور على الملف، نرسل خطأ 404 واضح (نصي وليس HTML)
http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
header('Access-Control-Allow-Origin: *');
echo "FILE_NOT_FOUND: " . htmlspecialchars($file);
exit;