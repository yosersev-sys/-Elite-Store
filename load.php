<?php
/**
 * Soq Al-Asr - Smart Loader v5.5
 * نظام تحميل ذكي يدعم المسارات النسبية والامتدادات التلقائية
 */
error_reporting(0);
ini_set('display_errors', 0);

$file = $_GET['file'] ?? '';
$baseDir = __DIR__;

// إزالة أي محاولات للخروج عن المجلد الرئيسي ولكن بالسماح للمسارات الداخلية
$file = str_replace(['\\'], '/', $file);
$file = ltrim($file, '/');

// مصفوفة الامتدادات للبحث عنها في حال لم يزودنا المحرك بها
$extensions = ['', '.tsx', '.ts', '.jsx', '.js'];
$targetPath = null;

foreach ($extensions as $ext) {
    $tryPath = $baseDir . '/' . $file . $ext;
    // التحقق من وجود الملف فعلياً والتأكد أنه داخل مجلد المشروع
    if (file_exists($tryPath) && !is_dir($tryPath)) {
        // التحقق الإضافي للأمان (Directory Traversal Protection)
        $real = realpath($tryPath);
        if ($real && strpos($real, realpath($baseDir)) === 0) {
            $targetPath = $tryPath;
            break;
        }
    }
}

if ($targetPath) {
    $ext = pathinfo($targetPath, PATHINFO_EXTENSION);
    $mime = 'text/plain';
    
    // تحديد نوع المحتوى بناءً على الامتداد
    if (in_array($ext, ['ts', 'tsx', 'js', 'jsx'])) {
        $mime = 'application/javascript';
    } elseif (in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'])) {
        $mime = 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext);
    }

    header('Access-Control-Allow-Origin: *');
    header('Content-Type: ' . $mime . '; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    
    readfile($targetPath);
    exit;
}

// في حال عدم العثور على الملف
http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
header('Access-Control-Allow-Origin: *');
echo "FILE_NOT_FOUND: " . htmlspecialchars($file);
exit;