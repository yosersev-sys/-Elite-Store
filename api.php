<?php
/**
 * API Backend for Soq Al-Asr - Isolated & Robust Edition v7.0
 * تم تحديث هذا الملف لضمان عزل العمليات ومنع تداخل الأخطاء بين الأقسام.
 */
session_start();
error_reporting(0); // منع ظهور أخطاء PHP مباشرة للمستخدم لضمان استقرار الـ JSON
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once 'config.php';

// --- دوال المساعدة المعزولة ---

function sendRes($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

function sendErr($msg, $code = 400, $debug = null) {
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo']->inTransaction()) {
        $GLOBALS['pdo']->rollBack();
    }
    http_response_code($code);
    sendRes(['status' => 'error', 'message' => $msg, 'debug' => $debug]);
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

/**
 * تهيئة قاعدة البيانات بشكل آمن ومستقل
 * تم عزل كل استعلام لضمان أن فشل جدول واحد لا يعطل النظام بالكامل
 */
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
        try { $pdo->exec($sql); } catch (Exception $e) { /* تجاهل أخطاء الجداول الموجودة */ }
    }
}

// --- معالجة الطلب الرئيسي ---

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    ensureDatabaseSchema($pdo);

    switch ($action) {
        
        // --- قسم الحسابات والأعضاء (معزول) ---
        
        case 'get_current_user':
            sendRes($_SESSION['user'] ?? null);
            break;

        case 'login':
            if (empty($input['phone'])) sendErr('رقم الهاتف مطلوب');
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
            $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, createdAt) VALUES (?,?,?,?,?)");
            $id = 'u_'.time();
            $pass = password_hash($input['password'], PASSWORD_DEFAULT);
            if ($stmt->execute([$id, $input['name'], $input['phone'], $pass, time()*1000])) {
                $userData = ['id' => $id, 'name' => $input['name'], 'phone' => $input['phone'], 'role' => 'user'];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } else sendErr('رقم الهاتف مسجل مسبقاً');
            break;

        case 'logout':
            session_destroy();
            sendRes(['status' => 'success']);
            break;

        // --- قسم المخزن والمنتجات (معزول) ---

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
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['id'], $input['name'], $input['description'], $input['price'], $input['wholesalePrice'] ?? 0,
                $input['categoryId'], $input['supplierId'] ?? null, json_encode($input['images']),
                $input['stockQuantity'], $input['unit'], $input['barcode'] ?? null, time()*1000
            ]);
            sendRes(['status' => 'success']);
            break;

        // --- قسم المبيعات والمخزن الذكي (مع نظام Transactions لضمان الثبات) ---

        case 'save_order':
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
                $stmt->execute([
                    $input['id'], $input['customerName'], $input['phone'], $input['city'] ?? 'سوق العصر', $input['address'],
                    $input['subtotal'], $input['total'], json_encode($input['items']),
                    $input['paymentMethod'], $input['status'], $input['userId'] ?? null, time() * 1000
                ]);

                // تحديث المخزن اللحظي
                foreach ($input['items'] as $item) {
                    $upd = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?");
                    $upd->execute([$item['quantity'], $item['quantity'], $item['id']]);
                }
                
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) {
                $pdo->rollBack();
                sendErr('فشل في حفظ الطلب والمخزن', 500, $e->getMessage());
            }
            break;

        case 'return_order':
            if (!isAdmin()) sendErr('غير مصرح');
            $pdo->beginTransaction();
            try {
                $id = $input['id'] ?? $_GET['id'] ?? '';
                $stmt = $pdo->prepare("SELECT items, status FROM orders WHERE id = ? FOR UPDATE");
                $stmt->execute([$id]);
                $order = $stmt->fetch();
                
                if ($order && $order['status'] !== 'cancelled') {
                    $items = json_decode($order['items'], true);
                    foreach ($items as $item) {
                        $upd = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?");
                        $upd->execute([$item['quantity'], $item['quantity'], $item['id']]);
                    }
                    $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$id]);
                    $pdo->commit();
                    sendRes(['status' => 'success']);
                } else sendErr('الطلب ملغي مسبقاً');
            } catch (Exception $e) {
                $pdo->rollBack();
                sendErr('فشل الاسترجاع');
            }
            break;

        // --- قسم الموردين (معزول) ---

        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح');
            $sups = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC")->fetchAll();
            foreach ($sups as &$s) {
                $s['paymentHistory'] = json_decode($s['paymentHistory'] ?? '[]', true) ?: [];
                $s['balance'] = (float)$s['balance'];
            }
            sendRes($sups);
            break;

        case 'update_supplier':
            if (!isAdmin()) sendErr('غير مصرح');
            $stmt = $pdo->prepare("UPDATE suppliers SET name=?, phone=?, companyName=?, address=?, notes=?, type=?, balance=?, rating=?, status=?, paymentHistory=? WHERE id=?");
            $stmt->execute([
                $input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'],
                $input['type'], $input['balance'], $input['rating'], $input['status'], 
                json_encode($input['paymentHistory']), $input['id']
            ]);
            sendRes(['status' => 'success']);
            break;

        // --- قسم الإعدادات العامة ---

        case 'get_store_settings':
            $res = [];
            $settings = $pdo->query("SELECT * FROM settings")->fetchAll();
            foreach ($settings as $s) $res[$s['setting_key']] = $s['setting_value'];
            sendRes($res);
            break;

        default:
            sendRes(['status' => 'ok', 'message' => 'Action handled elsewhere']);
            break;
    }

} catch (Exception $e) {
    sendErr('خطأ في معالجة طلب السيرفر الرئيسي', 500, $e->getMessage());
}
