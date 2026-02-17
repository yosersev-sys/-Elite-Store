<?php
/**
 * API Backend for Souq Al-Asr - Unified Entry Point v5.6
 */
session_start();
error_reporting(0); 
ini_set('display_errors', 0);
ini_set('memory_limit', '256M'); 

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once 'config.php';

/**
 * إرسال رد JSON موحد مع خيارات ترميز قوية
 */
function sendRes($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR | JSON_NUMERIC_CHECK);
    exit;
}

function sendErr($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['status' => 'error', 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

/**
 * التحقق من وجود الجداول وتحديث الهيكل تلقائياً
 */
function ensureSchema($pdo) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', createdAt BIGINT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), supplierId VARCHAR(50), images LONGTEXT, stockQuantity DECIMAL(10,2) DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', barcode VARCHAR(100), salesCount INT DEFAULT 0, seoSettings LONGTEXT, batches LONGTEXT, createdAt BIGINT)");
        $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100) DEFAULT 'فاقوس', address TEXT, subtotal DECIMAL(10,2), total DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(100) DEFAULT 'نقدي (تم الدفع)', status VARCHAR(50) DEFAULT 'completed', userId VARCHAR(50), createdAt BIGINT)");

        // تحديث الأعمدة المفقودة تلقائياً (Self-Healing)
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
    } catch (Exception $e) {}
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

        case 'update_profile':
            if (!isset($_SESSION['user'])) sendErr('غير مسجل', 401);
            $uid = $_SESSION['user']['id'];
            if (!empty($input['password'])) {
                $pass = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?");
                $stmt->execute([$input['name'], $input['phone'], $pass, $uid]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
                $stmt->execute([$input['name'], $input['phone'], $uid]);
            }
            session_destroy();
            sendRes(['status' => 'success']);
            break;

        case 'admin_update_user':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            if (!empty($input['password'])) {
                $pass = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?");
                $stmt->execute([$input['name'], $input['phone'], $pass, $input['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
                $stmt->execute([$input['name'], $input['phone'], $input['id']]);
            }
            sendRes(['status' => 'success']);
            break;

        case 'delete_user':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $id = $_GET['id'] ?? '';
            if ($id === 'admin_root' || $id === $_SESSION['user']['id']) sendErr('لا يمكن حذف هذا الحساب');
            $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
            sendRes(['status' => 'success']);
            break;

        case 'get_users':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            sendRes($pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC")->fetchAll());
            break;

        // --- SUPPLIERS ---
        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $sups = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC")->fetchAll();
            foreach ($sups as &$s) { $s['balance'] = (float)$s['balance']; $s['rating'] = (int)$s['rating']; }
            sendRes($sups);
            break;

        case 'add_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, phone, companyName, address, notes, type, balance, rating, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], (float)$input['balance'], (int)$input['rating'], $input['status'], time() * 1000]);
            sendRes(['status' => 'success']);
            break;

        case 'update_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE suppliers SET name = ?, phone = ?, companyName = ?, address = ?, notes = ?, type = ?, balance = ?, rating = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], (float)$input['balance'], (int)$input['rating'], $input['status'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $pdo->prepare("DELETE FROM suppliers WHERE id = ?")->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        // --- PRODUCTS ---
        case 'get_products':
            $prods = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC")->fetchAll();
            foreach ($prods as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}', true) ?: null;
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (float)$p['stockQuantity'];
                $p['wholesalePrice'] = (float)($p['wholesalePrice'] ?? 0);
            }
            sendRes($prods);
            break;

        case 'add_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, seoSettings, batches, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], $input['categoryId'], $input['supplierId'], json_encode($input['images']), (float)$input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches']), time() * 1000]);
            sendRes(['status' => 'success']);
            break;

        case 'update_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, wholesalePrice = ?, categoryId = ?, supplierId = ?, images = ?, stockQuantity = ?, unit = ?, barcode = ?, seoSettings = ?, batches = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], $input['categoryId'], $input['supplierId'], json_encode($input['images']), (float)$input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches']), $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_all_images':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $res = [];
            $prods = $pdo->query("SELECT name, images FROM products")->fetchAll();
            foreach ($prods as $p) {
                $imgs = json_decode($p['images'], true) ?: [];
                foreach ($imgs as $url) $res[] = ['url' => $url, 'productName' => $p['name']];
            }
            sendRes($res);
            break;

        // --- CATEGORIES ---
        case 'get_categories':
            sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC")->fetchAll());
            break;

        case 'add_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO categories (id, name, image, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['image'], $input['isActive'] ? 1 : 0, $input['sortOrder'] ?? 0]);
            sendRes(['status' => 'success']);
            break;

        case 'update_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE categories SET name = ?, image = ?, isActive = ?, sortOrder = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['image'], $input['isActive'] ? 1 : 0, (int)$input['sortOrder'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        // --- ORDERS ---
        case 'get_orders':
            if (isAdmin()) $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
            else if (isset($_SESSION['user'])) {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC");
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
                $stmt->execute([$input['id'], $input['customerName'], $input['phone'], $input['city'] ?? 'فاقوس', $input['address'], (float)$input['subtotal'], (float)$input['total'], json_encode($input['items']), $input['paymentMethod'], $input['status'] ?? 'completed', $input['userId'], time() * 1000]);
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        case 'update_order_payment':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $pdo->prepare("UPDATE orders SET paymentMethod = ? WHERE id = ?")->execute([$input['paymentMethod'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'return_order':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $id = $input['id'];
            $order = $pdo->prepare("SELECT items, status FROM orders WHERE id = ?");
            $order->execute([$id]);
            $o = $order->fetch();
            if ($o && $o['status'] !== 'cancelled') {
                $items = json_decode($o['items'], true) ?: [];
                foreach ($items as $item) {
                    $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?")
                        ->execute([(float)$item['quantity'], (int)$item['quantity'], $item['id']]);
                }
                $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$id]);
            }
            sendRes(['status' => 'success']);
            break;

        // --- SETTINGS ---
        case 'get_store_settings':
            $rows = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
            $res = [];
            foreach ($rows as $r) $res[$r['setting_key']] = $r['setting_value'];
            sendRes($res);
            break;

        case 'update_store_settings':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            foreach ($input as $k => $v) {
                $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?")->execute([$k, $v, $v]);
            }
            sendRes(['status' => 'success']);
            break;

        case 'generate_sitemap':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $prods = $pdo->query("SELECT id FROM products")->fetchAll();
            $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            $baseUrl = "https://" . $_SERVER['HTTP_HOST'];
            $xml .= "<url><loc>$baseUrl/</loc><priority>1.0</priority></url>";
            foreach ($prods as $p) $xml .= "<url><loc>$baseUrl/#product-details?id={$p['id']}</loc><priority>0.8</priority></url>";
            $xml .= '</urlset>';
            file_put_contents('sitemap.xml', $xml);
            sendRes(['status' => 'success']);
            break;

        default: sendRes(['status' => 'ok']);
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
