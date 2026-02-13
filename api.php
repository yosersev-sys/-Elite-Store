<?php
/**
 * API Backend for Souq Al-Asr
 * نظام الإدارة المطور v6.5 - ميزة استرداد الفواتير وإدارة المرتجعات
 */
session_start();
error_reporting(E_ALL); 
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once 'config.php';

function sendRes($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sendErr($msg, $code = 400) {
    http_response_code($code);
    sendRes(['status' => 'error', 'message' => $msg]);
}

function initDatabase($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive BOOLEAN DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), images LONGTEXT, sizes TEXT, colors TEXT, stockQuantity INT DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', createdAt BIGINT, salesCount INT DEFAULT 0, seoSettings TEXT, barcode VARCHAR(100))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100), address TEXT, total DECIMAL(10,2), subtotal DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(50), status VARCHAR(20), createdAt BIGINT, userId VARCHAR(50))");
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    initDatabase($pdo);

    switch ($action) {
        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
            $products = $stmt->fetchAll() ?: [];
            foreach ($products as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]') ?: [];
                $p['sizes'] = json_decode($p['sizes'] ?? '[]') ?: [];
                $p['colors'] = json_decode($p['colors'] ?? '[]') ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}') ?: null;
                $p['price'] = (float)$p['price'];
                $p['wholesalePrice'] = (float)($p['wholesalePrice'] ?? 0);
                $p['stockQuantity'] = (int)$p['stockQuantity'];
            }
            sendRes($products);
            break;

        case 'save_order':
            $pdo->beginTransaction();
            try {
                $customerName = $input['customerName'] ?? ($input['fullName'] ?? 'عميل مجهول');
                $phone = $input['phone'] ?? '00000000000';
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$input['id'], $customerName, $phone, $input['city'] ?? 'فاقوس', $input['address'] ?? '', (float)($input['subtotal'] ?? $input['total']), (float)$input['total'], json_encode($input['items']), $input['paymentMethod'], 'completed', $input['createdAt'], $input['userId'] ?? null]);
                $updateStock = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?");
                foreach ($input['items'] as $item) { 
                    $updateStock->execute([$item['quantity'], $item['quantity'], $item['id']]); 
                }
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        case 'return_order':
            if (($_SESSION['user']['role'] ?? '') !== 'admin') sendErr('غير مصرح لك', 403);
            $orderId = $input['id'] ?? '';
            if (!$orderId) sendErr('رقم الطلب مطلوب');
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("SELECT items, status FROM orders WHERE id = ?");
                $stmt->execute([$orderId]);
                $order = $stmt->fetch();
                if (!$order) throw new Exception('الطلب غير موجود');
                if ($order['status'] === 'cancelled') throw new Exception('هذا الطلب مسترد بالفعل');
                $items = json_decode($order['items'], true);
                $updateProduct = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?");
                foreach ($items as $item) {
                    $updateProduct->execute([$item['quantity'], $item['quantity'], $item['id']]);
                }
                $updateOrder = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
                $updateOrder->execute([$orderId]);
                $pdo->commit();
                sendRes(['status' => 'success', 'message' => 'تم استرداد الفاتورة بنجاح']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        case 'get_orders':
            $isAdmin = ($_SESSION['user']['role'] ?? '') === 'admin';
            if ($isAdmin) { $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC"); } 
            else if (isset($_SESSION['user']['phone'])) { $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC"); $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]); }
            else { sendRes([]); }
            $orders = $stmt->fetchAll() ?: [];
            foreach ($orders as &$o) { 
                $o['items'] = json_decode($o['items'] ?? '[]', true) ?: []; 
                $o['total'] = (float)$o['total']; 
                $o['subtotal'] = (float)($o['subtotal'] ?? $o['total']);
            }
            sendRes($orders);
            break;

        case 'login':
            if (!isset($input['phone'], $input['password'])) sendErr('بيانات ناقصة');
            $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ?");
            $stmt->execute([$input['phone']]);
            $user = $stmt->fetch();
            if ($user && password_verify($input['password'], $user['password'])) {
                $userData = ['id' => $user['id'], 'name' => $user['name'], 'phone' => $user['phone'], 'role' => $user['role']];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } else { sendErr('بيانات غير صحيحة'); }
            break;

        case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;
        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;
        case 'get_admin_phone': $stmt = $pdo->query("SELECT phone FROM users WHERE role = 'admin' LIMIT 1"); $admin = $stmt->fetch(); sendRes(['phone' => $admin['phone'] ?? '201026034170']); break;
        
        default: sendErr('Unknown action');
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
?>