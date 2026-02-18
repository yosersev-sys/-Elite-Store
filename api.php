
<?php
/**
 * API Backend for Soq Al-Asr - Optimized Performance Version v5.3
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

require_once 'config.php';

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

function ensureSchema($pdo) {
    $cacheFile = sys_get_temp_dir() . '/souq_schema_check_' . md5(DB_NAME);
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 3600)) return;

    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), supplierId VARCHAR(50), images LONGTEXT, stockQuantity DECIMAL(10,2) DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', barcode VARCHAR(100), salesCount INT DEFAULT 0, seoSettings LONGTEXT, batches LONGTEXT, createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100) DEFAULT 'فاقوس', address TEXT, subtotal DECIMAL(10,2), total DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(100) DEFAULT 'نقدي (تم الدفع)', status VARCHAR(50) DEFAULT 'completed', userId VARCHAR(50), createdAt BIGINT)");

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
    touch($cacheFile);
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    ensureSchema($pdo);

    switch ($action) {
        case 'get_admin_summary':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            
            $summary = [];
            // إجمالي المبيعات (طلبات غير ملغاة)
            $summary['total_revenue'] = (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled'")->fetchColumn();
            // مديونيات العملاء
            $summary['total_customer_debt'] = (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled' AND paymentMethod LIKE '%آجل%'")->fetchColumn();
            // ديون الموردين
            $summary['total_supplier_debt'] = (float)$pdo->query("SELECT SUM(balance) FROM suppliers")->fetchColumn();
            // عدد المنتجات التي أوشكت على النفاذ
            $summary['low_stock_count'] = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stockQuantity < 5")->fetchColumn();
            // عدد الطلبات الجديدة (آخر 24 ساعة كمثال)
            $last24h = (time() - 86400) * 1000;
            $summary['new_orders_count'] = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE createdAt > $last24h")->fetchColumn();
            
            sendRes($summary);
            break;

        case 'login':
            $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ?");
            $stmt->execute([$input['phone']]);
            $user = $stmt->fetch();
            if ($user && password_verify($input['password'], $user['password'])) {
                $userData = ['id' => $user['id'], 'name' => $user['name'], 'phone' => $user['phone'], 'role' => $user['role']];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } else sendErr('بيانات الدخول غير صحيحة');
            break;

        case 'register':
            $id = 'u_' . time();
            $pass = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, 'user', ?)");
            try {
                $stmt->execute([$id, $input['name'], $input['phone'], $pass, time() * 1000]);
                $userData = ['id' => $id, 'name' => $input['name'], 'phone' => $input['phone'], 'role' => 'user'];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } catch (Exception $e) { sendErr('رقم الهاتف مسجل مسبقاً'); }
            break;

        case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;
        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;

        case 'get_users':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            sendRes($pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC LIMIT 1000")->fetchAll());
            break;

        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $sups = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC")->fetchAll();
            foreach ($sups as &$s) { $s['balance'] = (float)$s['balance']; $s['rating'] = (int)$s['rating']; }
            sendRes($sups);
            break;

        case 'get_products':
            $prods = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC")->fetchAll();
            foreach ($prods as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}', true) ?: null;
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (float)$p['stockQuantity'];
            }
            sendRes($prods);
            break;

        case 'get_categories':
            sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC")->fetchAll());
            break;

        case 'get_orders':
            if (isAdmin()) {
                // تقليل البيانات المرسلة لسرعة العرض الأولية
                $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC LIMIT 500");
            } else if (isset($_SESSION['user'])) {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC LIMIT 100");
                $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]);
            } else sendRes([]);
            $orders = $stmt->fetchAll();
            foreach ($orders as &$o) { $o['items'] = json_decode($o['items'], true) ?: []; $o['total'] = (float)$o['total']; }
            sendRes($orders);
            break;

        case 'save_order':
            $pdo->beginTransaction();
            try {
                foreach ($input['items'] as $item) {
                    $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")
                        ->execute([(float)$item['quantity'], (int)$item['quantity'], $item['id']]);
                }
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$input['id'], $input['customerName'], $input['phone'], $input['city'], $input['address'], $input['subtotal'], $input['total'], json_encode($input['items']), $input['paymentMethod'], $input['status'], $input['userId'], time() * 1000]);
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        case 'get_store_settings':
            $rows = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
            $res = [];
            foreach ($rows as $r) $res[$r['setting_key']] = $r['setting_value'];
            sendRes($res);
            break;

        default: sendRes(['status' => 'ok']);
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
