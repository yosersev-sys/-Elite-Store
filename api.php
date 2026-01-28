<?php
/**
 * API Backend for Elite Store
 * Optimized for Hostinger and similar environments
 */

// تعطيل عرض الأخطاء المباشر لضمان مخرجات JSON نظيفة
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'php_error.log');

// ترويسات الاستجابة
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// التعامل مع طلبات Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// تنظيف الـ Buffer
if (ob_get_length()) ob_clean();

$host = 'localhost';
$db_name = 'u588213546_store';
$db_user = 'u588213546_store';
$db_pass = 'sK0KAGUm|';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // إنشاء الجداول بترتيب صحيح
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10, 2) NOT NULL, 
        categoryId VARCHAR(50), 
        images LONGTEXT, 
        sizes LONGTEXT, 
        colors LONGTEXT, 
        stockQuantity INT DEFAULT 0, 
        salesCount INT DEFAULT 0, 
        seoSettings LONGTEXT, 
        createdAt BIGINT, 
        INDEX (categoryId),
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY, 
        customerName VARCHAR(255) NOT NULL, 
        phone VARCHAR(50) NOT NULL, 
        city VARCHAR(100), 
        address TEXT, 
        items LONGTEXT, 
        subtotal DECIMAL(10, 2), 
        total DECIMAL(10, 2), 
        paymentMethod VARCHAR(50), 
        status VARCHAR(50) DEFAULT 'pending', 
        createdAt BIGINT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'message' => $e->getMessage()]);
    error_log("Database Error: " . $e->getMessage());
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_products':
        $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
        $products = $stmt->fetchAll();
        foreach ($products as &$p) {
            $p['images'] = json_decode($p['images'] ?? '[]') ?: [];
            $p['sizes'] = json_decode($p['sizes'] ?? '[]') ?: [];
            $p['colors'] = json_decode($p['colors'] ?? '[]') ?: [];
            $p['seoSettings'] = json_decode($p['seoSettings'] ?? 'null') ?: null;
        }
        echo json_encode($products);
        break;

    case 'get_categories':
        $stmt = $pdo->query("SELECT * FROM categories");
        echo json_encode($stmt->fetchAll());
        break;

    case 'get_orders':
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
        $orders = $stmt->fetchAll();
        foreach ($orders as &$o) {
            $o['items'] = json_decode($o['items'] ?? '[]') ?: [];
        }
        echo json_encode($orders);
        break;

    case 'add_product':
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data) {
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'], 
                $data['name'], 
                $data['description'], 
                $data['price'], 
                $data['categoryId'], 
                json_encode($data['images'] ?? []), 
                json_encode($data['sizes'] ?? []), 
                json_encode($data['colors'] ?? []), 
                $data['stockQuantity'] ?? 0, 
                $data['createdAt'] ?? time(),
                json_encode($data['seoSettings'] ?? null)
            ]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'update_product':
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data) {
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, seoSettings=? WHERE id=?");
            $stmt->execute([
                $data['name'], 
                $data['description'], 
                $data['price'], 
                $data['categoryId'], 
                json_encode($data['images'] ?? []), 
                json_encode($data['sizes'] ?? []), 
                json_encode($data['colors'] ?? []), 
                $data['stockQuantity'] ?? 0, 
                json_encode($data['seoSettings'] ?? null),
                $data['id']
            ]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'delete_product':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'add_category':
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data) {
            $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
            $stmt->execute([$data['id'], $data['name']]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'delete_category':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
        }
        break;

    case 'save_order':
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data) {
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, items, subtotal, total, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'], 
                $data['customerName'], 
                $data['phone'], 
                $data['city'], 
                $data['address'], 
                json_encode($data['items'] ?? []), 
                $data['subtotal'], 
                $data['total'], 
                $data['paymentMethod'], 
                'pending', 
                $data['createdAt'] ?? time()
            ]);
            echo json_encode(['status' => 'success']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action', 'action_received' => $action]);
        break;
}
exit;
?>