<?php
/**
 * Shared API Initialization - Optimized for Speed
 */
session_start();
error_reporting(0); 
ini_set('display_errors', 0);
ini_set('memory_limit', '256M'); 

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config.php';

function sendRes($data) {
    // استخدام ضغط JSON وتحسين الخرج
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR | JSON_NUMERIC_CHECK);
    exit;
}

function sendErr($msg, $code = 400) {
    http_response_code($code);
    sendRes(['status' => 'error', 'message' => $msg]);
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

function ensureSchema($pdo) {
    // نظام فحص ذكي: لا يعمل إلا إذا مر ساعة على آخر فحص أو تم طلب تحديث يدوي
    $lastCheckFile = '../schema_last_check.txt';
    if (file_exists($lastCheckFile) && (time() - filemtime($lastCheckFile) < 3600)) {
        return; 
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), supplierId VARCHAR(50), images LONGTEXT, stockQuantity DECIMAL(10,2) DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', barcode VARCHAR(100), salesCount INT DEFAULT 0, seoSettings LONGTEXT, batches LONGTEXT, createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100) DEFAULT 'فاقوس', address TEXT, subtotal DECIMAL(10,2), total DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(100) DEFAULT 'نقدي (تم الدفع)', status VARCHAR(50) DEFAULT 'completed', userId VARCHAR(50), createdAt BIGINT)");

    // إضافة الفهارس (Indexes) لتسريع عمليات البحث
    try {
        $pdo->exec("CREATE INDEX idx_prod_cat ON products(categoryId)");
        $pdo->exec("CREATE INDEX idx_user_phone ON users(phone)");
        $pdo->exec("CREATE INDEX idx_order_phone ON orders(phone)");
    } catch (Exception $e) {}

    file_put_contents($lastCheckFile, time());
}

ensureSchema($pdo);
?>