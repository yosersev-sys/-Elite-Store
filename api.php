<?php
/**
 * API Backend for Elite Store - Clean JSON Edition
 */

// منع أي مخرجات قبل الـ JSON
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
        throw new Exception("config.php missing");
    }
    require_once 'config.php';

    if (!isset($pdo)) {
        throw new Exception("PDO connection failed");
    }

    // تهيئة الجداول
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10, 2), categoryId VARCHAR(50), images LONGTEXT, sizes LONGTEXT, colors LONGTEXT, stockQuantity INT DEFAULT 0, salesCount INT DEFAULT 0, seoSettings LONGTEXT, createdAt BIGINT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), address TEXT, items LONGTEXT, subtotal DECIMAL(10, 2), total DECIMAL(10, 2), paymentMethod VARCHAR(50), status VARCHAR(50) DEFAULT 'pending', createdAt BIGINT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $action = $_GET['action'] ?? '';
    $output = null;

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
            $d = json_decode(file_get_contents('php://input'), true);
            if ($d) {
                $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, seoSettings, salesCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $d['id'], $d['name'], $d['description'], $d['price'], $d['categoryId'], 
                    json_encode($d['images']), json_encode($d['sizes'] ?? []), json_encode($d['colors'] ?? []), 
                    (int)$d['stockQuantity'], $d['createdAt'] ?: (time() * 1000), 
                    json_encode($d['seoSettings'] ?? null), (int)($d['salesCount'] ?? 0)
                ]);
                $output = ['status' => 'success'];
            }
            break;

        case 'update_product':
            $d = json_decode(file_get_contents('php://input'), true);
            if ($d) {
                $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, seoSettings=?, salesCount=? WHERE id=?");
                $stmt->execute([
                    $d['name'], $d['description'], $d['price'], $d['categoryId'], 
                    json_encode($d['images']), json_encode($d['sizes'] ?? []), json_encode($d['colors'] ?? []), 
                    (int)$d['stockQuantity'], json_encode($d['seoSettings'] ?? null), 
                    (int)($d['salesCount'] ?? 0), $d['id']
                ]);
                $output = ['status' => 'success'];
            }
            break;

        case 'delete_product':
            $id = $_GET['id'] ?? '';
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $output = ['status' => 'success'];
            break;

        case 'add_category':
            $d = json_decode(file_get_contents('php://input'), true);
            if ($d) {
                $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
                $stmt->execute([$d['id'], $d['name']]);
                $output = ['status' => 'success'];
            }
            break;

        case 'delete_category':
            $id = $_GET['id'] ?? '';
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            $output = ['status' => 'success'];
            break;

        case 'save_order':
            $d = json_decode(file_get_contents('php://input'), true);
            if ($d) {
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, items, subtotal, total, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $d['id'], $d['customerName'], $d['phone'], $d['city'], $d['address'], 
                    json_encode($d['items']), $d['subtotal'], $d['total'], $d['paymentMethod'], 
                    'pending', $d['createdAt'] ?: (time() * 1000)
                ]);
                $output = ['status' => 'success'];
            }
            break;

        default:
            http_response_code(404);
            $output = ['error' => 'Not Found'];
            break;
    }

    // مسح أي مخرجات غريبة قبل إرسال الـ JSON النهائي
    ob_clean();
    echo json_encode($output);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
exit;