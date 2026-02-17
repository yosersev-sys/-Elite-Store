<?php
/**
 * API Backend for Souq Al-Asr - Full Version v4.8
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
    if (isset($_SESSION['schema_verified'])) return;
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive BOOLEAN DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) NOT NULL, companyName VARCHAR(255), address TEXT, notes TEXT, type VARCHAR(50) DEFAULT 'wholesale', balance DECIMAL(10,2) DEFAULT 0, rating INT DEFAULT 5, status VARCHAR(20) DEFAULT 'active', createdAt BIGINT)");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10,2), 
        wholesalePrice DECIMAL(10,2) DEFAULT 0,
        categoryId VARCHAR(50), 
        images LONGTEXT, 
        stockQuantity INT DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'piece',
        barcode VARCHAR(100),
        salesCount INT DEFAULT 0,
        seoSettings LONGTEXT,
        batches LONGTEXT,
        createdAt BIGINT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY, 
        customerName VARCHAR(255), 
        phone VARCHAR(20), 
        city VARCHAR(100) DEFAULT 'فاقوس',
        address TEXT,
        subtotal DECIMAL(10,2),
        total DECIMAL(10,2), 
        items LONGTEXT, 
        paymentMethod VARCHAR(100) DEFAULT 'نقدي (تم الدفع)',
        status VARCHAR(50) DEFAULT 'completed',
        userId VARCHAR(50),
        createdAt BIGINT
    )");
    
    $_SESSION['schema_verified'] = true;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    ensureSchema($pdo);

    switch ($action) {
        case 'get_orders':
            if (isAdmin()) { $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC"); } 
            else if (isset($_SESSION['user']['phone'])) { 
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC"); 
                $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]); 
            } else { sendRes([]); }
            $orders = $stmt->fetchAll() ?: [];
            foreach ($orders as &$o) { 
                $o['items'] = json_decode($o['items'] ?? '[]', true) ?: []; 
                $o['total'] = (float)$o['total']; 
                $o['paymentMethod'] = $o['paymentMethod'] ?: 'نقدي (تم الدفع)';
            }
            sendRes($orders);
            break;

        case 'update_order_payment':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            if (!$input['id'] || !$input['paymentMethod']) sendErr('بيانات ناقصة');
            
            // توحيد القيم لتجنب خلل المسافات أو نوع الياء والألف
            $method = $input['paymentMethod'];
            $finalStatus = 'نقدي (تم الدفع)';
            if (strpos($method, 'آجل') !== false || strpos($method, 'اجل') !== false || $method === 'debt') {
                $finalStatus = 'آجل (مديونية)';
            }
            
            $stmt = $pdo->prepare("UPDATE orders SET paymentMethod = ? WHERE id = ?");
            $stmt->execute([$finalStatus, $input['id']]);
            sendRes(['status' => 'success', 'paymentMethod' => $finalStatus]);
            break;

        case 'return_order':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
            $stmt->execute([$input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
            $products = $stmt->fetchAll() ?: [];
            foreach ($products as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]') ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]') ?: [];
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (int)$p['stockQuantity'];
            }
            sendRes($products);
            break;

        case 'add_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, createdAt, seoSettings, batches) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['description'], $input['price'], $input['wholesalePrice'], $input['categoryId'], $input['supplierId'], json_encode($input['images']), $input['stockQuantity'], $input['unit'], $input['barcode'], $input['createdAt'], json_encode($input['seoSettings']), json_encode($input['batches'])]);
            sendRes(['status' => 'success']);
            break;

        case 'update_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, wholesalePrice = ?, categoryId = ?, supplierId = ?, images = ?, stockQuantity = ?, unit = ?, barcode = ?, seoSettings = ?, batches = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'], $input['price'], $input['wholesalePrice'], $input['categoryId'], $input['supplierId'], json_encode($input['images']), $input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches']), $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'add_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO categories (id, name, image, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['image'], $input['isActive'] ? 1 : 0, $input['sortOrder']]);
            sendRes(['status' => 'success']);
            break;

        case 'update_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE categories SET name = ?, image = ?, isActive = ?, sortOrder = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['image'], $input['isActive'] ? 1 : 0, $input['sortOrder'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_users':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'admin_update_user':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            if (isset($input['password']) && !empty($input['password'])) {
                $hashed = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?");
                $stmt->execute([$input['name'], $input['phone'], $hashed, $input['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
                $stmt->execute([$input['name'], $input['phone'], $input['id']]);
            }
            sendRes(['status' => 'success']);
            break;

        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'add_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, phone, companyName, address, notes, type, balance, rating, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], $input['balance'], $input['rating'], $input['status'], $input['createdAt']]);
            sendRes(['status' => 'success']);
            break;

        case 'update_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE suppliers SET name = ?, phone = ?, companyName = ?, address = ?, notes = ?, type = ?, balance = ?, rating = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], $input['balance'], $input['rating'], $input['status'], $input['id']]);
            sendRes(['status' => 'success']);
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
        case 'get_admin_phone':
            $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'whatsapp_number' LIMIT 1");
            $stmt->execute();
            $phone = $stmt->fetchColumn() ?: '201026034170';
            sendRes(['phone' => $phone]);
            break;

        case 'save_order':
            $pdo->beginTransaction();
            try {
                $processedItems = [];
                $customerName = $input['customerName'] ?? ($input['fullName'] ?? 'عميل مجهول');
                foreach ($input['items'] as $cartItem) {
                    $stmt = $pdo->prepare("SELECT batches, stockQuantity FROM products WHERE id = ?");
                    $stmt->execute([$cartItem['id']]);
                    $product = $stmt->fetch();
                    if (!$product) continue;
                    $batches = json_decode($product['batches'] ?? '[]', true) ?: [];
                    $qtyToDeduct = (int)$cartItem['quantity'];
                    $totalWholesaleCost = 0;
                    if (empty($batches)) { $totalWholesaleCost = ($cartItem['wholesalePrice'] ?? 0) * $qtyToDeduct; } 
                    else {
                        for ($i = 0; $i < count($batches); $i++) {
                            if ($qtyToDeduct <= 0) break;
                            if ($batches[$i]['quantity'] > 0) {
                                $deduct = min($qtyToDeduct, $batches[$i]['quantity']);
                                $totalWholesaleCost += ($deduct * $batches[$i]['wholesalePrice']);
                                $batches[$i]['quantity'] -= $deduct;
                                $qtyToDeduct -= $deduct;
                            }
                        }
                    }
                    $cartItem['actualWholesalePrice'] = $cartItem['quantity'] > 0 ? ($totalWholesaleCost / $cartItem['quantity']) : 0;
                    $processedItems[] = $cartItem;
                    $newStock = max(0, (int)$product['stockQuantity'] - (int)$cartItem['quantity']);
                    $updateStmt = $pdo->prepare("UPDATE products SET stockQuantity = ?, batches = ?, salesCount = salesCount + ? WHERE id = ?");
                    $updateStmt->execute([$newStock, json_encode($batches), (int)$cartItem['quantity'], $cartItem['id']]);
                }
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$input['id'], $customerName, $input['phone'] ?? '0', $input['city'] ?? 'فاقوس', $input['address'] ?? '', (float)($input['subtotal'] ?? $input['total']), (float)$input['total'], json_encode($processedItems), $input['paymentMethod'] ?? 'نقدي (تم الدفع)', 'completed', $input['createdAt'], $input['userId'] ?? null]);
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        default: sendRes(['status' => 'ok']);
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }