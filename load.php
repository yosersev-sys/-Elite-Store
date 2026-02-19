
<?php
/**
 * محمل الملفات - Faqous Store
 */
$file = $_GET['file'] ?? '';
$path = realpath(__DIR__ . '/' . $file);

if ($path && strpos($path, __DIR__) === 0 && file_exists($path)) {
    $ext = pathinfo($path, PATHINFO_EXTENSION);
    $mime = 'text/plain';
    
    if (in_array($ext, ['ts', 'tsx', 'js', 'jsx'])) {
        $mime = 'application/javascript';
    }
    
    header('Content-Type: ' . $mime . '; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    readfile($path);
    exit;
}

http_response_code(404);
echo "File Not Found";
