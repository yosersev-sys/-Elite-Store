
<?php
/**
 * API Backend for Souq Al-Asr - Full Feature Version v5.2
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
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', createdAt BIGINT)");
    // إضافة جدول سجل السدادات
    $pdo->exec("CREATE TABLE IF NOT EXISTS supplier_payments (id VARCHAR(50) PRIMARY KEY, supplierId VARCHAR(50), amount DECIMAL(10,2), createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), supplierId VARCHAR(50), images LONGTEXT, stockQuantity DECIMAL(10,3) DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', barcode VARCHAR(100), salesCount DECIMAL(10,3) DEFAULT 0, seoSettings LONGTEXT, batches LONGTEXT, createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100) DEFAULT 'فاقوس', address TEXT, subtotal DECIMAL(10,2), total DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(100) DEFAULT 'نقدي (تم الدفع)', status VARCHAR(50) DEFAULT 'completed', userId VARCHAR(50), createdAt BIGINT)");

    // Self-Healing
    $pdo->exec("ALTER TABLE products MODIFY stockQuantity DECIMAL(10,3) DEFAULT 0");
    $pdo->exec("ALTER TABLE products MODIFY salesCount DECIMAL(10,3) DEFAULT 0");
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    ensureSchema($pdo);

    switch ($action) {
        // --- AUTH ---
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

        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;
        case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;

        // --- SUPPLIERS & PAYMENTS ---
        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $sups = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC")->fetchAll();
            foreach ($sups as &$s) { $s['balance'] = (float)$s['balance']; }
            sendRes($sups);
            break;

        case 'add_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, phone, companyName, address, notes, type, balance, rating, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], $input['balance'], $input['rating'], $input['status'], time() * 1000]);
            sendRes(['status' => 'success']);
            break;

        case 'update_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE suppliers SET name = ?, phone = ?, companyName = ?, address = ?, notes = ?, type = ?, balance = ?, rating = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], $input['balance'], $input['rating'], $input['status'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_supplier_payments':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $sid = $_GET['supplierId'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM supplier_payments WHERE supplierId = ? ORDER BY createdAt DESC");
            $stmt->execute([$sid]);
            sendRes($stmt->fetchAll());
            break;

        case 'add_supplier_payment':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $pdo->beginTransaction();
            try {
                // 1. إضافة سجل الدفع
                $stmt = $pdo->prepare("INSERT INTO supplier_payments (id, supplierId, amount, createdAt) VALUES (?, ?, ?, ?)");
                $stmt->execute([$input['id'], $input['supplierId'], $input['amount'], time() * 1000]);
                // 2. تحديث رصيد المورد (خصم المبلغ المدفوع من المديونية)
                $stmt = $pdo->prepare("UPDATE suppliers SET balance = balance - ? WHERE id = ?");
                $stmt->execute([$input['amount'], $input['supplierId']]);
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        // --- PRODUCTS ---
        case 'get_products':
            $prods = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC")->fetchAll();
            foreach ($prods as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (float)$p['stockQuantity'];
            }
            sendRes($prods);
            break;

        case 'add_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, seoSettings, batches, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['description'], $input['price'], $input['wholesalePrice'], $input['categoryId'], $input['supplierId'], json_encode($input['images']), $input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches']), time() * 1000]);
            sendRes(['status' => 'success']);
            break;

        case 'update_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, wholesalePrice = ?, categoryId = ?, supplierId = ?, images = ?, stockQuantity = ?, unit = ?, barcode = ?, seoSettings = ?, batches = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'], $input['price'], $input['wholesalePrice'], $input['categoryId'], $input['supplierId'], json_encode($input['images']), $input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches']), $input['id']]);
            sendRes(['status' => 'success']);
            break;

        // --- OTHER ACTIONS ---
        case 'get_categories': sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC")->fetchAll()); break;
        case 'get_store_settings':
            $rows = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
            $res = [];
            foreach ($rows as $r) $res[$r['setting_key']] = $r['setting_value'];
            sendRes($res);
            break;
        case 'get_orders':
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
            $orders = $stmt->fetchAll();
            foreach ($orders as &$o) { $o['items'] = json_decode($o['items'], true) ?: []; }
            sendRes($orders);
            break;

        default: sendRes(['status' => 'ok']);
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
