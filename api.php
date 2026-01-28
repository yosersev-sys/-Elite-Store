<?php
/**
 * API Backend for Elite Store - Strict JSON Mode
 */
ob_start();

error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    if (!file_exists('config.php')) {
        throw new Exception("Missing config.php");
    }
    require_once 'config.php';

    if (!isset($pdo)) {
        throw new Exception("Database connection failed");
    }

    $action = $_GET['action'] ?? '';
    $output = [];

    switch ($action) {
        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
            $res = $stmt->fetchAll() ?: [];
            foreach ($res as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]') ?: [];
                $p['sizes'] = json_decode($p['sizes'] ?? '[]') ?: [];
                $p['colors'] = json_decode($p['colors'] ?? '[]') ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? 'null') ?: null;
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (int)$p['stockQuantity'];
                $p['salesCount'] = (int)$p['salesCount'];
                $p['createdAt'] = (float)$p['createdAt'];
            }
            $output = $res;
            break;

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
            $output = $stmt->fetchAll() ?: [];
            break;

        case 'get_orders':
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
            $res = $stmt->fetchAll() ?: [];
            foreach ($res as &$o) {
                $o['items'] = json_decode($o['items'] ?? '[]') ?: [];
                $o['subtotal'] = (float)$o['subtotal'];
                $o['total'] = (float)$o['total'];
                $o['createdAt'] = (float)$o['createdAt'];
            }
            $output = $res;
            break;

        case 'add_product':
        case 'update_product':
        case 'add_category':
        case 'save_order':
            $d = json_decode(file_get_contents('php://input'), true);
            if (!$d) throw new Exception("Invalid JSON input");
            
            if ($action === 'add_product') {
                $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, seoSettings, salesCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$d['id'], $d['name'], $d['description'], $d['price'], $d['categoryId'], json_encode($d['images']), json_encode($d['sizes'] ?? []), json_encode($d['colors'] ?? []), (int)$d['stockQuantity'], $d['createdAt'] ?: (time() * 1000), json_encode($d['seoSettings'] ?? null), (int)($d['salesCount'] ?? 0)]);
            } elseif ($action === 'update_product') {
                $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, seoSettings=?, salesCount=? WHERE id=?");
                $stmt->execute([$d['name'], $d['description'], $d['price'], $d['categoryId'], json_encode($d['images']), json_encode($d['sizes'] ?? []), json_encode($d['colors'] ?? []), (int)$d['stockQuantity'], json_encode($d['seoSettings'] ?? null), (int)($d['salesCount'] ?? 0), $d['id']]);
            } elseif ($action === 'add_category') {
                $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
                $stmt->execute([$d['id'], $d['name']]);
            } elseif ($action === 'save_order') {
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, items, subtotal, total, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$d['id'], $d['customerName'], $d['phone'], $d['city'], $d['address'], json_encode($d['items']), $d['subtotal'], $d['total'], $d['paymentMethod'], 'pending', $d['createdAt'] ?: (time() * 1000)]);
            }
            $output = ['status' => 'success'];
            break;

        case 'delete_product':
        case 'delete_category':
            $id = $_GET['id'] ?? '';
            $table = ($action === 'delete_product') ? 'products' : 'categories';
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
            $stmt->execute([$id]);
            $output = ['status' => 'success'];
            break;

        default:
            http_response_code(404);
            $output = ['error' => 'Action not found'];
            break;
    }

    ob_clean();
    echo json_encode($output);
    exit;

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}