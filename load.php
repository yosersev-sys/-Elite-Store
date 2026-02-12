
<?php
/**
 * محمل ملفات التايب سكريبت لمتجر فاقوس
 */
$file = $_GET['file'] ?? '';
$path = realpath(__DIR__ . '/' . $file);

// التحقق من أن الملف موجود ومن أنه داخل مجلد المشروع للأمان
if ($path && strpos($path, __DIR__) === 0 && file_exists($path)) {
    $ext = pathinfo($path, PATHINFO_EXTENSION);
    if (in_array($ext, ['ts', 'tsx', 'js', 'jsx'])) {
        header('Content-Type: application/javascript; charset=utf-8');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        readfile($path);
        exit;
    }
}

http_response_code(404);
echo "console.error('File not found: " . addslashes($file) . "');";
