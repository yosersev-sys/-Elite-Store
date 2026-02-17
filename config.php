<?php
/**
 * إعدادات قاعدة البيانات - سوق العصر
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'u588213546_store');
define('DB_USER', 'u588213546_store');
define('DB_PASS', 'sK0KAGUm|');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5, // تقليل وقت الانتظار عند الفشل
        ]
    );
} catch (PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    // إرجاع كائن خطأ بدلاً من 500 في حالة DB لكي لا تظهر رسالة Network Error غامضة
    echo json_encode([
        'status' => 'error',
        'type' => 'db_error',
        'message' => 'تعذر الاتصال بقاعدة البيانات. تأكد من صحة بيانات ملف config.php',
        'debug' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}