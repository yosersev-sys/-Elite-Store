<?php
/**
 * API Backend for Soq Al-Asr - Stability & Transactions Edition v6.8
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
    if ($GLOBALS['pdo']->inTransaction()) {
        $GLOBALS['pdo']->rollBack();
    }
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
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    ensureSchema($pdo);

    switch ($action) {
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

        case 'save_order':
            $pdo->beginTransaction();
            $sql = "INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['id'], $input['customerName'], $input['phone'], $input['city'], $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $input['status'], $input['userId'] ?? null, time() * 1000
            ]);

            // خصم المخزن مع التحقق
            foreach ($input['items'] as $item) {
                $upd = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?");
                $upd->execute([$item['quantity'], $item['quantity'], $item['id']]);
            }
            
            $pdo->commit();
            sendRes(['status' => 'success']);
            break;

        case 'update_order':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $pdo->beginTransaction();
            
            // 1. استرجاع الكميات القديمة
            $oldOrderStmt = $pdo->prepare("SELECT items FROM orders WHERE id = ?");
            $oldOrderStmt->execute([$input['id']]);
            $oldOrder = $oldOrderStmt->fetch();
            if ($oldOrder) {
                $oldItems = json_decode($oldOrder['items'], true);
                foreach ($oldItems as $oItem) {
                    $revert = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?");
                    $revert->execute([$oItem['quantity'], $oItem['quantity'], $oItem['id']]);
                }
            }
            
            // 2. تحديث الطلب
            $sql = "UPDATE orders SET customerName=?, phone=?, city=?, address=?, subtotal=?, total=?, items=?, paymentMethod=?, status=?, userId=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['customerName'], $input['phone'], $input['city'], $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $input['status'], $input['userId'] ?? null, $input['id']
            ]);

            // 3. خصم الكميات الجديدة
            foreach ($input['items'] as $nItem) {
                $deduct = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?");
                $deduct->execute([$nItem['quantity'], $nItem['quantity'], $nItem['id']]);
            }
            
            $pdo->commit();
            sendRes(['status' => 'success']);
            break;

        case 'return_order':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $pdo->beginTransaction();
            $id = $_GET['id'] ?? $input['id'] ?? '';
            $stmt = $pdo->prepare("SELECT items, status FROM orders WHERE id = ? FOR UPDATE");
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            
            if ($order && $order['status'] !== 'cancelled') {
                $items = json_decode($order['items'], true);
                foreach ($items as $item) {
                    $upd = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?");
                    $upd->execute([$item['quantity'], $item['quantity'], $item['id']]);
                }
                $updStatus = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
                $updStatus->execute([$id]);
                $pdo->commit();
                sendRes(['status' => 'success']);
            } else sendErr('الطلب ملغي بالفعل');
            break;

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

        default: 
            sendRes(['status' => 'ok', 'message' => 'Action not found']);
    }
} catch (Exception $e) { 
    sendErr('خطأ في معالجة الطلب', 500, $e->getMessage()); 
}
