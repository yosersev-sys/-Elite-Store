<?php
/**
 * إعدادات قاعدة البيانات - متجر النخبة
 */

// بيانات الاتصال (قم بتعديلها إذا تغيرت بيانات الاستضافة)
define('DB_HOST', 'localhost');
define('DB_NAME', 'u588213546_store');
define('DB_USER', 'u588213546_store');
define('DB_PASS', 'sK0KAGUm|');

try {
    // إنشاء اتصال PDO مع دعم اللغة العربية (utf8mb4)
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    // في حال فشل الاتصال، يتم إرجاع خطأ JSON واضح للمتصفح
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    echo json_encode([
        'status' => 'error',
        'type' => 'db_connection_failed',
        'message' => 'فشل الاتصال بقاعدة البيانات. تأكد من صحة البيانات في ملف config.php',
        'debug' => $e->getMessage()
    ]);
    exit;
}