<?php
/**
 * API Backend for Souq Al-Asr - Full Version v5.1
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

function sendErr($msg, $code = 400) {
    http_response_code($code);
    sendRes(['status' => 'error', 'message' => $msg]);
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    if (!isset($pdo)) {
        throw new Exception("Database connection not initialized.");
    }

    switch ($action) {
        case 'get_current_user': 
            if (isset($_SESSION['user'])) {
                sendRes($_SESSION['user']);
            } else {
                sendRes(["id" => null, "guest" => true]);
            }
            break;

        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
            $products = $stmt->fetchAll() ?: [];
            foreach ($products as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
                $p['price'] = (float)$p['price'];
                $p['wholesalePrice'] = (float)$p['wholesalePrice'];
                $p['stockQuantity'] = (float)$p['stockQuantity'];
            }
            sendRes($products);
            break;

        case 'add_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, createdAt, seoSettings, batches) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], $input['categoryId'], $input['supplierId'] ?? null, json_encode($input['images']), (float)$input['stockQuantity'], $input['unit'], $input['barcode'], $input['createdAt'], json_encode($input['seoSettings']), json_encode($input['batches'])]);
            sendRes(['status' => 'success']);
            break;

        case 'update_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, wholesalePrice = ?, categoryId = ?, supplierId = ?, images = ?, stockQuantity = ?, unit = ?, barcode = ?, seoSettings = ?, batches = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], $input['categoryId'], $input['supplierId'] ?? null, json_encode($input['images']), (float)$input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches']), $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_suppliers':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC");
            $suppliers = $stmt->fetchAll() ?: [];
            foreach ($suppliers as &$s) {
                $s['balance'] = (float)$s['balance'];
                $s['rating'] = (int)$s['rating'];
            }
            sendRes($suppliers);
            break;

        case 'add_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, phone, companyName, address, notes, type, balance, rating, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], (float)$input['balance'], (int)$input['rating'], $input['status'], $input['createdAt']]);
            sendRes(['status' => 'success']);
            break;

        case 'update_supplier':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE suppliers SET name = ?, phone = ?, companyName = ?, address = ?, notes = ?, type = ?, balance = ?, rating = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], (float)$input['balance'], (int)$input['rating'], $input['status'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

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
            $method = $input['paymentMethod'];
            $finalStatus = 'نقدي (تم الدفع)';
            if ($method === 'debt' || strpos($method, 'آجل') !== false || strpos($method, 'اجل') !== false) {
                $finalStatus = 'آجل (مديونية)';
            }
            $stmt = $pdo->prepare("UPDATE orders SET paymentMethod = ? WHERE id = ?");
            $stmt->execute([$finalStatus, $input['id']]);
            sendRes(['status' => 'success', 'paymentMethod' => $finalStatus]);
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

        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;

        default: sendRes(['status' => 'ok']);
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }