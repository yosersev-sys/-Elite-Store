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
        ]
    );
} catch (PDOException $e) {
    // في حال فشل الاتصال، نعيد JSON مع رمز 200 (مؤقتاً) لضمان أن fetch يقرأ الرسالة
    // أو يمكن ترك الـ 500 إذا كانت الواجهة الأمامية مهيأة لقراءتها.
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'error',
        'type' => 'db_connection_failed',
        'message' => 'عذراً، فشل الاتصال بقاعدة البيانات. يرجى التحقق من إعدادات config.php على السيرفر.',
        'debug' => $e->getMessage()
    ]);
    exit;
}
