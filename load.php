<?php
/**
 * محمل الملفات الذكي - Faqous Store
 * يدعم البحث التلقائي عن الامتدادات المفقودة
 */
$file = $_GET['file'] ?? '';
$baseDir = __DIR__;

// تنظيف المسار ومنع الثغرات
$file = str_replace(['../', '..\\'], '', $file);
$path = realpath($baseDir . '/' . $file);

// إذا لم يتم العثور على الملف، نحاول إضافة امتدادات برمجية
if (!$path || !file_exists($path) || is_dir($path)) {
    foreach (['.tsx', '.ts', '.jsx', '.js'] as $ext) {
        $tryPath = realpath($baseDir . '/' . $file . $ext);
        if ($tryPath && strpos($tryPath, $baseDir) === 0 && file_exists($tryPath)) {
            $path = $tryPath;
            break;
        }
    }
}

if ($path && strpos($path, $baseDir) === 0 && file_exists($path)) {
    $ext = pathinfo($path, PATHINFO_EXTENSION);
    $mime = 'text/plain';
    
    if (in_array($ext, ['ts', 'tsx', 'js', 'jsx'])) {
        $mime = 'application/javascript';
    } elseif (in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'])) {
        $mime = 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext);
    }
    
    header('Content-Type: ' . $mime . '; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Cache-Control: public, max-age=3600');
    readfile($path);
    exit;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "File Not Found: " . htmlspecialchars($file);
exit;