<?php
/**
 * API Backend for Soq Al-Asr - Full Feature Edition v7.5
 */
session_start();
error_reporting(0);
ini_set('display_errors', 0);

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

function sendErr($msg, $code = 400, $debug = null) {
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo']->inTransaction()) $GLOBALS['pdo']->rollBack();
    http_response_code($code);
    sendRes(['status' => 'error', 'message' => $msg, 'debug' => $debug]);
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

function ensureDatabaseSchema($pdo) {
    $tables = [
        "categories" => "CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)",
        "users" => "CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)",
        "settings" => "CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)",
        "suppliers" => "CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', paymentHistory LONGTEXT, createdAt BIGINT)",
        "products" => "CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), supplierId VARCHAR(50), images LONGTEXT, stockQuantity DECIMAL(10,2) DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', barcode VARCHAR(100), salesCount INT DEFAULT 0, seoSettings LONGTEXT, batches LONGTEXT, createdAt BIGINT)",
        "orders" => "CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100) DEFAULT 'سوق العصر', address TEXT, subtotal DECIMAL(10,2), total DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(100) DEFAULT 'نقدي', status VARCHAR(50) DEFAULT 'completed', userId VARCHAR(50), createdAt BIGINT)"
    ];
    foreach ($tables as $name => $sql) {
        try { $pdo->exec($sql); } catch (Exception $e) {}
    }
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    ensureDatabaseSchema($pdo);

    switch ($action) {
        case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;
        
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

        // --- الأعضاء ---
        case 'get_users':
            if (!isAdmin()) sendErr('غير مصرح');
            sendRes($pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC")->fetchAll());
            break;

        case 'admin_add_user':
            if (!isAdmin()) sendErr('غير مصرح');
            $id = 'u_'.time();
            $pass = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?,?,?,?,?,?)");
            if ($stmt->execute([$id, $input['name'], $input['phone'], $pass, $input['role'], time()*1000])) sendRes(['status' => 'success']);
            else sendErr('الرقم مسجل مسبقاً');
            break;

        case 'delete_user':
            if (!isAdmin()) sendErr('غير مصرح');
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND id != 'admin_root'");
            if ($stmt->execute([$_GET['id']])) sendRes(['status' => 'success']);
            break;

        // --- الموردين ---
        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح');
            $sups = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC")->fetchAll();
            foreach ($sups as &$s) {
                $s['paymentHistory'] = json_decode($s['paymentHistory'] ?? '[]', true) ?: [];
                $s['balance'] = (float)$s['balance'];
            }
            sendRes($sups);
            break;

        case 'add_supplier':
            if (!isAdmin()) sendErr('غير مصرح');
            $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, phone, companyName, address, notes, type, balance, rating, status, paymentHistory, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['id'], $input['name'], $input['phone'], $input['companyName'], $input['address'],
                $input['notes'], $input['type'], $input['balance'], $input['rating'], $input['status'], '[]', time()*1000
            ]);
            sendRes(['status' => 'success']);
            break;

        case 'update_supplier':
            if (!isAdmin()) sendErr('غير مصرح');
            $stmt = $pdo->prepare("UPDATE suppliers SET name=?, phone=?, companyName=?, address=?, notes=?, type=?, balance=?, rating=?, status=?, paymentHistory=? WHERE id=?");
            $stmt->execute([
                $input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'],
                $input['type'], $input['balance'], $input['rating'], $input['status'], json_encode($input['paymentHistory']), $input['id']
            ]);
            sendRes(['status' => 'success']);
            break;

        // --- المنتجات ---
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
            if (!isAdmin()) sendErr('غير مصرح');
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, batches, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['id'], $input['name'], $input['description'], $input['price'], $input['wholesalePrice'] ?? 0,
                $input['categoryId'], $input['supplierId'] ?? null, json_encode($input['images']),
                $input['stockQuantity'], $input['unit'], $input['barcode'] ?? null, '[]', time()*1000
            ]);
            sendRes(['status' => 'success']);
            break;

        case 'update_product':
            if (!isAdmin()) sendErr('غير مصرح');
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, wholesalePrice=?, categoryId=?, supplierId=?, images=?, stockQuantity=?, unit=?, barcode=?, batches=? WHERE id=?");
            $stmt->execute([
                $input['name'], $input['description'], $input['price'], $input['wholesalePrice'],
                $input['categoryId'], $input['supplierId'], json_encode($input['images']),
                $input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['batches'] ?? []), $input['id']
            ]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_product':
            if (!isAdmin()) sendErr('غير مصرح');
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            if ($stmt->execute([$_GET['id']])) sendRes(['status' => 'success']);
            break;

        // --- الطلبات ---
        case 'get_orders':
            if (isAdmin()) $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC LIMIT 500");
            else if (isset($_SESSION['user'])) {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC LIMIT 50");
                $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]);
            } else sendRes([]);
            $orders = $stmt->fetchAll();
            foreach ($orders as &$o) {
                $o['items'] = json_decode($o['items'], true) ?: [];
                $o['total'] = (float)$o['total'];
            }
            sendRes($orders);
            break;

        case 'save_order':
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['id'], $input['customerName'], $input['phone'], $input['city'] ?? 'سوق العصر', $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $input['status'], $input['userId'] ?? null, time() * 1000
            ]);
            foreach ($input['items'] as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")->execute([$item['quantity'], $item['quantity'], $item['id']]);
            }
            $pdo->commit();
            sendRes(['status' => 'success']);
            break;

        case 'get_admin_summary':
            if (!isAdmin()) sendErr('غير مصرح');
            $res = [];
            $res['total_revenue'] = (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled'")->fetchColumn();
            $res['total_customer_debt'] = (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled' AND paymentMethod LIKE '%آجل%'")->fetchColumn();
            $res['total_supplier_debt'] = (float)$pdo->query("SELECT SUM(balance) FROM suppliers")->fetchColumn();
            $res['low_stock_count'] = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stockQuantity < 5")->fetchColumn();
            $res['new_orders_count'] = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE createdAt > " . ((time()-86400)*1000))->fetchColumn();
            sendRes($res);
            break;

        case 'get_categories': sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC")->fetchAll()); break;
        
        case 'add_category':
            if (!isAdmin()) sendErr('غير مصرح');
            $stmt = $pdo->prepare("INSERT INTO categories (id, name, image, sortOrder) VALUES (?,?,?,?)");
            $stmt->execute([$input['id'], $input['name'], $input['image'] ?? '', $input['sortOrder'] ?? 0]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_category':
            if (!isAdmin()) sendErr('غير مصرح');
            $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_store_settings':
            $settings = [];
            foreach ($pdo->query("SELECT * FROM settings")->fetchAll() as $s) $settings[$s['setting_key']] = $s['setting_value'];
            sendRes($settings);
            break;

        case 'get_all_images':
            $prods = $pdo->query("SELECT name, images FROM products")->fetchAll();
            $res = [];
            foreach ($prods as $p) {
                $imgs = json_decode($p['images'], true);
                if ($imgs && count($imgs) > 0) $res[] = ['url' => $imgs[0], 'productName' => $p['name']];
            }
            sendRes($res);
            break;

        default: sendRes(['status' => 'ok']); break;
    }
} catch (Exception $e) { sendErr('خطأ في السيرفر', 500, $e->getMessage()); }
