
<?php
/**
 * API Backend for Soq Al-Asr - Full Version v6.6
 */
session_start();
error_reporting(E_ALL); 
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

function sendErr($msg, $code = 400, $debug = null) {
    http_response_code($code);
    $res = ['status' => 'error', 'message' => $msg];
    if ($debug) $res['debug'] = $debug;
    sendRes($res);
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

function ensureSchema($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive TINYINT(1) DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', paymentHistory LONGTEXT, createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), supplierId VARCHAR(50), images LONGTEXT, stockQuantity DECIMAL(10,2) DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', barcode VARCHAR(100), salesCount INT DEFAULT 0, seoSettings LONGTEXT, batches LONGTEXT, createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100) DEFAULT 'فاقوس', address TEXT, subtotal DECIMAL(10,2), total DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(100) DEFAULT 'نقدي (تم الدفع)', status VARCHAR(50) DEFAULT 'completed', userId VARCHAR(50), createdAt BIGINT)");

    try {
        $check = $pdo->query("SHOW COLUMNS FROM suppliers LIKE 'paymentHistory'");
        if (!$check->fetch()) {
            $pdo->exec("ALTER TABLE suppliers ADD COLUMN paymentHistory LONGTEXT AFTER status");
        }
    } catch (Exception $e) {}
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    ensureSchema($pdo);

    switch ($action) {
        // --- الأساسيات والأمان ---
        case 'get_current_user':
            sendRes($_SESSION['user'] ?? null);
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
            $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, 'user', ?)");
            try {
                $stmt->execute([$id, $input['name'], $input['phone'], password_hash($input['password'], PASSWORD_DEFAULT), time() * 1000]);
                $userData = ['id' => $id, 'name' => $input['name'], 'phone' => $input['phone'], 'role' => 'user'];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } catch (Exception $e) { sendErr('رقم الهاتف مسجل مسبقاً'); }
            break;

        case 'logout':
            session_destroy();
            sendRes(['status' => 'success']);
            break;

        // --- إدارة الأعضاء (Admin) ---
        case 'get_users':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            sendRes($pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC")->fetchAll());
            break;

        case 'admin_add_user':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $id = 'u_' . time();
            $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
            if ($stmt->execute([$id, $input['name'], $input['phone'], password_hash($input['password'], PASSWORD_DEFAULT), $input['role'], time() * 1000])) {
                sendRes(['status' => 'success']);
            } else sendErr('فشل إضافة العضو');
            break;

        case 'admin_update_user':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $sql = "UPDATE users SET name = ?, phone = ?, role = ? " . (isset($input['password']) ? ", password = ?" : "") . " WHERE id = ?";
            $params = [$input['name'], $input['phone'], $input['role']];
            if (isset($input['password'])) $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
            $params[] = $input['id'];
            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) sendRes(['status' => 'success']);
            else sendErr('فشل التحديث');
            break;

        case 'delete_user':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $id = $_GET['id'] ?? '';
            if ($id === 'admin_root') sendErr('لا يمكن حذف الحساب الرئيسي');
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            if ($stmt->execute([$id])) sendRes(['status' => 'success']);
            else sendErr('فشل الحذف');
            break;

        case 'update_profile':
            if (!isset($_SESSION['user'])) sendErr('سجل دخولك أولاً');
            $sql = "UPDATE users SET name = ?, phone = ? " . (!empty($input['password']) ? ", password = ?" : "") . " WHERE id = ?";
            $params = [$input['name'], $input['phone']];
            if (!empty($input['password'])) $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
            $params[] = $_SESSION['user']['id'];
            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) {
                session_destroy(); 
                sendRes(['status' => 'success']);
            } else sendErr('فشل تحديث الملف الشخصي');
            break;

        // --- إحصائيات وإعدادات ---
        case 'get_admin_summary':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $summary = [];
            $summary['total_revenue'] = (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled'")->fetchColumn();
            $summary['total_customer_debt'] = (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled' AND paymentMethod LIKE '%آجل%'")->fetchColumn();
            $summary['total_supplier_debt'] = (float)$pdo->query("SELECT SUM(balance) FROM suppliers")->fetchColumn();
            $summary['low_stock_count'] = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stockQuantity < 5")->fetchColumn();
            $last24h = (time() - 86400) * 1000;
            $summary['new_orders_count'] = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE createdAt > $last24h")->fetchColumn();
            sendRes($summary);
            break;

        case 'get_store_settings':
            $settings = $pdo->query("SELECT * FROM settings")->fetchAll();
            $res = [];
            foreach ($settings as $s) $res[$s['setting_key']] = $s['setting_value'];
            sendRes($res);
            break;

        case 'update_store_settings':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            foreach ($input as $key => $val) {
                $stmt->execute([$key, $val, $val]);
            }
            sendRes(['status' => 'success']);
            break;

        // --- الموردين ---
        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $sups = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC")->fetchAll();
            foreach ($sups as &$s) { 
                $s['balance'] = (float)$s['balance']; 
                $s['rating'] = (int)$s['rating']; 
                $s['paymentHistory'] = json_decode($s['paymentHistory'] ?? '[]', true) ?: [];
            }
            sendRes($sups);
            break;

        case 'add_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, phone, companyName, address, notes, type, balance, rating, status, paymentHistory, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'], $input['name'], $input['phone'], $input['companyName'] ?? null,
                $input['address'] ?? null, $input['notes'] ?? null, $input['type'] ?? 'wholesale',
                $input['balance'] ?? 0, $input['rating'] ?? 5, $input['status'] ?? 'active',
                json_encode($input['paymentHistory'] ?? []),
                $input['createdAt'] ?? time() * 1000
            ]);
            sendRes(['status' => 'success']);
            break;

        case 'update_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE suppliers SET name = ?, phone = ?, companyName = ?, address = ?, notes = ?, type = ?, balance = ?, rating = ?, status = ?, paymentHistory = ? WHERE id = ?");
            if ($stmt->execute([
                $input['name'], $input['phone'], $input['companyName'] ?? null,
                $input['address'] ?? null, $input['notes'] ?? null, $input['type'] ?? 'wholesale',
                $input['balance'] ?? 0, $input['rating'] ?? 5, $input['status'] ?? 'active',
                json_encode($input['paymentHistory'] ?? [], JSON_UNESCAPED_UNICODE),
                $input['id']
            ])) sendRes(['status' => 'success']);
            else sendErr('فشل تحديث المورد');
            break;

        // --- الأصناف والطلبات ---
        case 'get_products':
            $prods = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC")->fetchAll();
            foreach ($prods as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}', true) ?: null;
                $p['price'] = (float)$p['price'];
                $p['wholesalePrice'] = (float)$p['wholesalePrice'];
                $p['stockQuantity'] = (float)$p['stockQuantity'];
            }
            sendRes($prods);
            break;

        // إضافة حالة جلب كافة الصور للمكتبة
        case 'get_all_images':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $prods = $pdo->query("SELECT name, images FROM products")->fetchAll();
            $allImages = [];
            foreach ($prods as $p) {
                $imgs = json_decode($p['images'] ?? '[]', true) ?: [];
                foreach ($imgs as $url) {
                    $allImages[] = ['url' => $url, 'productName' => $p['name']];
                }
            }
            sendRes($allImages);
            break;

        case 'add_product':
        case 'update_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $sql = $action === 'add_product' 
                ? "INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, createdAt, salesCount, seoSettings, batches) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
                : "UPDATE products SET name=?, description=?, price=?, wholesalePrice=?, categoryId=?, supplierId=?, images=?, stockQuantity=?, unit=?, barcode=?, salesCount=?, seoSettings=?, batches=? WHERE id=?";
            
            $params = $action === 'add_product' ? [
                $input['id'], $input['name'], $input['description'], $input['price'], $input['wholesalePrice'],
                $input['categoryId'], $input['supplierId'] ?? null, json_encode($input['images']),
                $input['stockQuantity'], $input['unit'], $input['barcode'] ?? null,
                $input['createdAt'] ?? time()*1000, $input['salesCount'] ?? 0,
                json_encode($input['seoSettings'] ?? '{}'), json_encode($input['batches'] ?? '[]')
            ] : [
                $input['name'], $input['description'], $input['price'], $input['wholesalePrice'],
                $input['categoryId'], $input['supplierId'] ?? null, json_encode($input['images']),
                $input['stockQuantity'], $input['unit'], $input['barcode'] ?? null,
                $input['salesCount'] ?? 0, json_encode($input['seoSettings'] ?? '{}'),
                json_encode($input['batches'] ?? '[]'), $input['id']
            ];
            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) sendRes(['status' => 'success']);
            else sendErr('فشل حفظ المنتج');
            break;

        case 'delete_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            if ($stmt->execute([$_GET['id']])) sendRes(['status' => 'success']);
            else sendErr('فشل الحذف');
            break;

        case 'get_categories':
            sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC")->fetchAll());
            break;

        case 'add_category':
        case 'update_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $sql = $action === 'add_category'
                ? "INSERT INTO categories (id, name, image, isActive, sortOrder) VALUES (?,?,?,?,?)"
                : "UPDATE categories SET name=?, image=?, isActive=?, sortOrder=? WHERE id=?";
            $params = $action === 'add_category'
                ? [$input['id'], $input['name'], $input['image'] ?? null, $input['isActive'] ? 1 : 0, $input['sortOrder'] ?? 0]
                : [$input['name'], $input['image'] ?? null, $input['isActive'] ? 1 : 0, $input['sortOrder'] ?? 0, $input['id']];
            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) sendRes(['status' => 'success']);
            else sendErr('فشل حفظ القسم');
            break;

        case 'save_order':
        case 'update_order':
            $sql = $action === 'save_order'
                ? "INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
                : "UPDATE orders SET customerName=?, phone=?, city=?, address=?, subtotal=?, total=?, items=?, paymentMethod=?, status=?, userId=? WHERE id=?";
            $params = $action === 'save_order' ? [
                $input['id'], $input['customerName'], $input['phone'], $input['city'], $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $input['status'], $input['userId'] ?? null, time() * 1000
            ] : [
                $input['customerName'], $input['phone'], $input['city'], $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $input['status'], $input['userId'] ?? null, $input['id']
            ];
            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) sendRes(['status' => 'success']);
            else sendErr('فشل حفظ الطلب');
            break;

        case 'get_orders':
            if (isAdmin()) $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC LIMIT 500");
            else if (isset($_SESSION['user'])) {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC LIMIT 100");
                $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]);
            } else sendRes([]);
            $orders = $stmt->fetchAll();
            foreach ($orders as &$o) { 
                $o['items'] = json_decode($o['items'], true) ?: []; 
                $o['total'] = (float)$o['total']; 
                $o['subtotal'] = (float)$o['subtotal'];
            }
            sendRes($orders);
            break;

        default: 
            sendRes(['status' => 'ok', 'message' => 'Action not found']);
    }
} catch (Exception $e) { 
    sendErr('خطأ في معالجة الطلب', 500, $e->getMessage()); 
}
