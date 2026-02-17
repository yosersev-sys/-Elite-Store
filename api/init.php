<?php
/**
 * Shared API Initialization - Souq Al-Asr
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
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

function sendErr($msg, $code = 400) {
    http_response_code($code);
    sendRes(['status' => 'error', 'message' => $msg]);
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

/**
 * وظيفة تأمين الهيكل وإضافة الأعمدة المفقودة تلقائياً
 */
function ensureSchema($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), supplierId VARCHAR(50), images LONGTEXT, stockQuantity DECIMAL(10,2) DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', barcode VARCHAR(100), salesCount INT DEFAULT 0, seoSettings LONGTEXT, batches LONGTEXT, createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100) DEFAULT 'فاقوس', address TEXT, subtotal DECIMAL(10,2), total DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(100) DEFAULT 'نقدي (تم الدفع)', status VARCHAR(50) DEFAULT 'completed', userId VARCHAR(50), createdAt BIGINT)");

    // Self-Healing Columns
    $cols = [
        'products' => ['wholesalePrice' => "DECIMAL(10,2) DEFAULT 0", 'unit' => "VARCHAR(20) DEFAULT 'piece'", 'barcode' => "VARCHAR(100)", 'salesCount' => "INT DEFAULT 0", 'seoSettings' => "LONGTEXT", 'batches' => "LONGTEXT", 'supplierId' => "VARCHAR(50)"],
        'orders' => ['city' => "VARCHAR(100) DEFAULT 'فاقوس'", 'address' => "TEXT", 'subtotal' => "DECIMAL(10,2)", 'paymentMethod' => "VARCHAR(100) DEFAULT 'نقدي (تم الدفع)'", 'status' => "VARCHAR(50) DEFAULT 'completed'", 'userId' => "VARCHAR(50)"],
        'categories' => ['isActive' => "TINYINT(1) DEFAULT 1", 'sortOrder' => "INT DEFAULT 0"]
    ];
    foreach ($cols as $table => $cList) {
        foreach ($cList as $cName => $cDef) {
            try {
                $check = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$cName'");
                if ($check->rowCount() == 0) $pdo->exec("ALTER TABLE `$table` ADD `$cName` $cDef");
            } catch (Exception $e) {}
        }
    }
}

// تنفيذ فحص الهيكل عند كل استدعاء لضمان استقرار النظام
ensureSchema($pdo);
?>