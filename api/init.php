<?php
/**
 * Shared API Initialization - Stability Fix v5.6
 */

// منع ظهور أي تحذيرات قد تظهر في وسط الـ JSON وتفسده
error_reporting(0);
ini_set('display_errors', 0);

// ترويسات الاستجابة و CORS يجب أن تكون في البداية تماماً
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// بدء الجلسة بأمان بعد إرسال الترويسات
if (session_status() === PHP_SESSION_NONE) {
    if (!headers_sent()) {
        @session_start();
    }
}

require_once __DIR__ . '/../config.php';

function sendRes($data) {
    if (!headers_sent()) {
        http_response_code(200);
    }
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR | JSON_NUMERIC_CHECK);
    if ($json === false) {
        echo json_encode(['status' => 'error', 'message' => 'JSON encoding failed']);
    } else {
        echo $json;
    }
    exit;
}

function sendErr($msg, $code = 400) {
    if (!headers_sent()) {
        http_response_code($code);
    }
    echo json_encode(['status' => 'error', 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

function ensureSchema($pdo) {
    // تشغيل الصيانة بشكل دوري لتقليل ضغط السيرفر
    $cacheFile = sys_get_temp_dir() . '/souq_db_schema_' . md5(DB_NAME) . '.lock';
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 3600)) return;

    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', createdAt BIGINT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), supplierId VARCHAR(50), images LONGTEXT, stockQuantity DECIMAL(10,2) DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', barcode VARCHAR(100), salesCount INT DEFAULT 0, seoSettings LONGTEXT, batches LONGTEXT, createdAt BIGINT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100) DEFAULT 'فاقوس', address TEXT, subtotal DECIMAL(10,2), total DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(100) DEFAULT 'نقدي (تم الدفع)', status VARCHAR(50) DEFAULT 'completed', userId VARCHAR(50), createdAt BIGINT)");

        @file_put_contents($cacheFile, time());
    } catch (Exception $e) { }
}

if (isset($pdo)) {
    ensureSchema($pdo);
}
?>