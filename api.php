<?php
/**
 * API Backend for Souq Al-Asr - Self-Healing Version v4.9
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

/**
 * وظيفة تأمين الهيكل وإضافة الأعمدة المفقودة تلقائياً
 */
function ensureSchema($pdo) {
    // 1. إنشاء الجداول الأساسية إذا لم تكن موجودة
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', createdAt BIGINT)");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10,2), 
        categoryId VARCHAR(50), 
        images LONGTEXT, 
        stockQuantity DECIMAL(10,2) DEFAULT 0,
        createdAt BIGINT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY, 
        customerName VARCHAR(255), 
        phone VARCHAR(20), 
        total DECIMAL(10,2), 
        items LONGTEXT, 
        createdAt BIGINT
    )");

    // 2. فحص وإضافة الأعمدة المفقودة (Self-Healing)
    $columnsToAdd = [
        'products' => [
            'wholesalePrice' => "DECIMAL(10,2) DEFAULT 0",
            'unit' => "VARCHAR(20) DEFAULT 'piece'",
            'barcode' => "VARCHAR(100)",
            'salesCount' => "INT DEFAULT 0",
            'seoSettings' => "LONGTEXT",
            'batches' => "LONGTEXT",
            'supplierId' => "VARCHAR(50)"
        ],
        'orders' => [
            'city' => "VARCHAR(100) DEFAULT 'فاقوس'",
            'address' => "TEXT",
            'subtotal' => "DECIMAL(10,2)",
            'paymentMethod' => "VARCHAR(100) DEFAULT 'نقدي (تم الدفع)'",
            'status' => "VARCHAR(50) DEFAULT 'completed'",
            'userId' => "VARCHAR(50)"
        ],
        'categories' => [
            'isActive' => "TINYINT(1) DEFAULT 1",
            'sortOrder' => "INT DEFAULT 0"
        ]
    ];

    foreach ($columnsToAdd as $table => $cols) {
        foreach ($cols as $colName => $colDef) {
            try {
                $check = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$colName'");
                if ($check->rowCount() == 0) {
                    $pdo->exec("ALTER TABLE `$table` ADD `$colName` $colDef");
                }
            } catch (Exception $e) {}
        }
    }
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    ensureSchema($pdo);

    switch ($action) {
        case 'get_admin_phone':
            $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'whatsapp_number' LIMIT 1");
            $stmt->execute();
            $phone = $stmt->fetchColumn() ?: '201026034170';
            sendRes(['phone' => $phone]);
            break;

        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
            $products = $stmt->fetchAll() ?: [];
            foreach ($products as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
                $p['price'] = (float)($p['price'] ?? 0);
                $p['wholesalePrice'] = (float)($p['wholesalePrice'] ?? 0);
                $p['stockQuantity'] = (float)($p['stockQuantity'] ?? 0);
            }
            sendRes($products);
            break;

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC");
            $cats = $stmt->fetchAll() ?: [];
            foreach ($cats as &$c) {
                $c['isActive'] = (bool)($c['isActive'] ?? true);
            }
            sendRes($cats);
            break;

        case 'get_users':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'delete_user':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $id = $_GET['id'] ?? '';
            if ($id === 'admin_root') sendErr('لا يمكن حذف الحساب الرئيسي للنظام');
            if ($id === $_SESSION['user']['id']) sendErr('لا يمكنك حذف حسابك الشخصي أثناء تسجيل الدخول');
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            sendRes(['status' => 'success']);
            break;

        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC");
            $sups = $stmt->fetchAll() ?: [];
            foreach ($sups as &$s) {
                $s['balance'] = (float)($s['balance'] ?? 0);
                $s['rating'] = (int)($s['rating'] ?? 5);
            }
            sendRes($sups);
            break;

        case 'update_order_payment':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $id = $input['id'];
            $method = $input['paymentMethod'];
            $finalMethod = (strpos($method, 'آجل') !== false) ? 'آجل (مديونية)' : 'نقدي (تم الدفع)';
            $stmt = $pdo->prepare("UPDATE orders SET paymentMethod = ? WHERE id = ?");
            $stmt->execute([$finalMethod, $id]);
            sendRes(['status' => 'success', 'paymentMethod' => $finalMethod]);
            break;

        case 'return_order':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $id = $input['id'];
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("SELECT items, status FROM orders WHERE id = ?");
                $stmt->execute([$id]);
                $order = $stmt->fetch();
                if ($order && $order['status'] !== 'cancelled') {
                    $items = json_decode($order['items'], true) ?: [];
                    foreach ($items as $item) {
                        $up = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?");
                        $up->execute([(float)$item['quantity'], (int)$item['quantity'], $item['id']]);
                    }
                    $updateOrder = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
                    $updateOrder->execute([$id]);
                }
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        case 'login':
            $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ?");
            $stmt->execute([$input['phone']]);
            $user = $stmt->fetch();
            if ($user && password_verify($input['password'], $user['password'])) {
                $userData = ['id' => $user['id'], 'name' => $user['name'], 'phone' => $user['phone'], 'role' => $user['role']];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } else { sendErr('بيانات الدخول غير صحيحة'); }
            break;

        case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;
        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;

        case 'get_orders':
            if (isAdmin()) { $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC"); } 
            else if (isset($_SESSION['user']['phone'])) { 
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC"); 
                $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]); 
            } else { sendRes([]); }
            $orders = $stmt->fetchAll() ?: [];
            foreach ($orders as &$o) { 
                $o['items'] = json_decode($o['items'] ?? '[]', true) ?: []; 
                $o['total'] = (float)($o['total'] ?? 0); 
                $o['paymentMethod'] = $o['paymentMethod'] ?: 'نقدي (تم الدفع)';
            }
            sendRes($orders);
            break;

        case 'save_order':
            $pdo->beginTransaction();
            try {
                $processedItems = [];
                $customerName = $input['customerName'] ?? ($input['fullName'] ?? 'عميل مجهول');
                foreach ($input['items'] as $cartItem) {
                    $stmt = $pdo->prepare("SELECT stockQuantity FROM products WHERE id = ?");
                    $stmt->execute([$cartItem['id']]);
                    $product = $stmt->fetch();
                    if (!$product) continue;
                    $newStock = max(0, (float)$product['stockQuantity'] - (float)$cartItem['quantity']);
                    $updateStmt = $pdo->prepare("UPDATE products SET stockQuantity = ?, salesCount = salesCount + ? WHERE id = ?");
                    $updateStmt->execute([$newStock, (int)$cartItem['quantity'], $cartItem['id']]);
                    $processedItems[] = $cartItem;
                }
                $orderId = $input['id'] ?: 'ORD-' . time();
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$orderId, $customerName, $input['phone'] ?? '0', $input['city'] ?? 'فاقوس', $input['address'] ?? '', (float)($input['subtotal'] ?? $input['total']), (float)$input['total'], json_encode($processedItems), $input['paymentMethod'] ?? 'نقدي (تم الدفع)', 'completed', $input['createdAt'] ?? (time()*1000), $input['userId'] ?? null]);
                $pdo->commit();
                sendRes(['status' => 'success', 'id' => $orderId]);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        case 'get_store_settings':
            $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
            $settings = [];
            while ($row = $stmt->fetch()) { $settings[$row['setting_key']] = $row['setting_value']; }
            sendRes($settings);
            break;

        case 'update_store_settings':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            foreach ($input as $key => $value) {
                $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
                $stmt->execute([$key, $value, $value]);
            }
            sendRes(['status' => 'success']);
            break;

        default: sendRes(['status' => 'ok']);
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
