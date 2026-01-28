<?php
/**
 * API Backend for Elite Store
 * تم التعديل ليعتمد على config.php
 */

// إخفاء أخطاء PHP المباشرة لضمان نظافة مخرجات JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// استدعاء ملف الإعدادات (config.php)
require_once 'config.php';

/**
 * ملاحظة: متغير $pdo معرف الآن داخل config.php
 * نقوم هنا بإنشاء الجداول تلقائياً إذا لم تكن موجودة
 */
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL) ENGINE=InnoDB;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10, 2), categoryId VARCHAR(50), images LONGTEXT, sizes LONGTEXT, colors LONGTEXT, stockQuantity INT DEFAULT 0, salesCount INT DEFAULT 0, seoSettings LONGTEXT, createdAt BIGINT) ENGINE=InnoDB;");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), address TEXT, items LONGTEXT, subtotal DECIMAL(10, 2), total DECIMAL(10, 2), paymentMethod VARCHAR(50), status VARCHAR(50) DEFAULT 'pending', createdAt BIGINT) ENGINE=InnoDB;");
} catch (PDOException $e) {
    // تجاهل أخطاء إنشاء الجداول إذا كانت موجودة مسبقاً
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_products':
        $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
        $res = $stmt->fetchAll();
        foreach ($res as &$p) {
            $p['images'] = json_decode($p['images'] ?? '[]') ?: [];
            $p['sizes'] = json_decode($p['sizes'] ?? '[]') ?: [];
            $p['colors'] = json_decode($p['colors'] ?? '[]') ?: [];
            $p['seoSettings'] = json_decode($p['seoSettings'] ?? 'null') ?: null;
            $p['price'] = (float)$p['price'];
            $p['stockQuantity'] = (int)$p['stockQuantity'];
            $p['salesCount'] = (int)$p['salesCount'];
        }
        echo json_encode($res);
        break;

    case 'get_categories':
        $stmt = $pdo->query("SELECT * FROM categories");
        echo json_encode($stmt->fetchAll());
        break;

    case 'get_orders':
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
        $res = $stmt->fetchAll();
        foreach ($res as &$o) {
            $o['items'] = json_decode($o['items'] ?? '[]') ?: [];
            $o['subtotal'] = (float)$o['subtotal'];
            $o['total'] = (float)$o['total'];
        }
        echo json_encode($res);
        break;

    case 'add_product':
        $d = json_decode(file_get_contents('php://input'), true);
        if ($d) {
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$d['id'], $d['name'], $d['description'], $d['price'], $d['categoryId'], json_encode($d['images']), json_encode($d['sizes'] ?? []), json_encode($d['colors'] ?? []), $d['stockQuantity'] ?? 0, $d['createdAt'] ?? time(), json_encode($d['seoSettings'] ?? null)]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'update_product':
        $d = json_decode(file_get_contents('php://input'), true);
        if ($d) {
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, seoSettings=? WHERE id=?");
            $stmt->execute([$d['name'], $d['description'], $d['price'], $d['categoryId'], json_encode($d['images']), json_encode($d['sizes'] ?? []), json_encode($d['colors'] ?? []), $d['stockQuantity'] ?? 0, json_encode($d['seoSettings'] ?? null), $d['id']]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'delete_product':
        $id = $_GET['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'add_category':
        $d = json_decode(file_get_contents('php://input'), true);
        if ($d) {
            $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
            $stmt->execute([$d['id'], $d['name']]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'delete_category':
        $id = $_GET['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'save_order':
        $d = json_decode(file_get_contents('php://input'), true);
        if ($d) {
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, items, subtotal, total, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$d['id'], $d['customerName'], $d['phone'], $d['city'], $d['address'], json_encode($d['items']), $d['subtotal'], $d['total'], $d['paymentMethod'], 'pending', $d['createdAt'] ?? time()]);
            echo json_encode(['status' => 'success']);
        }
        break;

    default:
        echo json_encode(['error' => 'invalid_action']);
        break;
}
exit;
?>