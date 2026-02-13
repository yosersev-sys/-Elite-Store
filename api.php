
<?php
/**
 * API Backend for Souq Al-Asr
 * نظام الإدارة المطور v5.0 - إصلاح مشكلة ظهور الطلبات بشكل نهائي
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
    // إنشاء جدول المستخدمين
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        createdAt BIGINT
    )");

    // إنشاء جدول الأقسام
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL,
        sortOrder INT DEFAULT 0
    )");

    // إنشاء جدول المنتجات
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10,2), 
        wholesalePrice DECIMAL(10,2) DEFAULT 0,
        categoryId VARCHAR(50), 
        images TEXT, 
        sizes TEXT, 
        colors TEXT, 
        stockQuantity INT DEFAULT 0, 
        unit VARCHAR(20) DEFAULT 'piece',
        createdAt BIGINT, 
        salesCount INT DEFAULT 0, 
        seoSettings TEXT,
        barcode VARCHAR(100)
    )");

    // تحديث هيكل جدول المنتجات للتأكد من وجود الأعمدة الجديدة
    try { $pdo->exec("ALTER TABLE products ADD COLUMN wholesalePrice DECIMAL(10,2) DEFAULT 0 AFTER price"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE products ADD COLUMN unit VARCHAR(20) DEFAULT 'piece' AFTER stockQuantity"); } catch (Exception $e) {}

    // إنشاء جدول الطلبات
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customerName VARCHAR(255),
        phone VARCHAR(20),
        city VARCHAR(100),
        address TEXT,
        total DECIMAL(10,2),
        subtotal DECIMAL(10,2),
        items TEXT,
        paymentMethod VARCHAR(50),
        status VARCHAR(20),
        createdAt BIGINT,
        userId VARCHAR(50)
    )");

    // تحديث هيكل جدول الطلبات للتأكد من وجود أعمدة (customerName, subtotal, userId, status)
    $cols = [
        "customerName" => "VARCHAR(255)",
        "phone" => "VARCHAR(20)",
        "city" => "VARCHAR(100)",
        "address" => "TEXT",
        "total" => "DECIMAL(10,2)",
        "subtotal" => "DECIMAL(10,2)",
        "items" => "TEXT",
        "paymentMethod" => "VARCHAR(50)",
        "status" => "VARCHAR(20)",
        "createdAt" => "BIGINT",
        "userId" => "VARCHAR(50)"
    ];
    foreach ($cols as $col => $type) {
        try { $pdo->exec("ALTER TABLE orders ADD COLUMN $col $type"); } catch (Exception $e) {}
    }
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

        case 'add_product':
        case 'update_product':
            $isUpdate = $action === 'update_product';
            $sql = $isUpdate 
                ? "UPDATE products SET name=?, description=?, price=?, wholesalePrice=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, unit=?, seoSettings=?, barcode=? WHERE id=?"
                : "INSERT INTO products (name, description, price, wholesalePrice, categoryId, images, sizes, colors, stockQuantity, unit, seoSettings, barcode, createdAt, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $pdo->prepare($sql);
            $params = [
                $input['name'], $input['description'], $input['price'], $input['wholesalePrice'] ?? 0,
                $input['categoryId'], json_encode($input['images']), json_encode($input['sizes'] ?? []), 
                json_encode($input['colors'] ?? []), $input['stockQuantity'], $input['unit'] ?? 'piece', 
                json_encode($input['seoSettings']), $input['barcode']
            ];
            
            if ($isUpdate) { $params[] = $input['id']; } 
            else { $params[] = $input['createdAt']; $params[] = $input['id']; }
            
            $stmt->execute($params);
            sendRes(['status' => 'success']);
            break;

        case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;
        
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

        case 'register':
            if (!isset($input['name'], $input['phone'], $input['password'])) sendErr('بيانات ناقصة');
            $id = 'u_' . bin2hex(random_bytes(4));
            $pass = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, 'user', ?)");
            $stmt->execute([$id, $input['name'], $input['phone'], $pass, time()]);
            $userData = ['id' => $id, 'name' => $input['name'], 'phone' => $input['phone'], 'role' => 'user'];
            $_SESSION['user'] = $userData;
            sendRes(['status' => 'success', 'user' => $userData]);
            break;

        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;
        
        case 'get_categories': sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC, name ASC")->fetchAll() ?: []); break;

        case 'save_order':
            $pdo->beginTransaction();
            try {
                // التأكد من مسميات الحقول
                $customerName = $input['customerName'] ?? ($input['fullName'] ?? 'عميل مجهول');
                $phone = $input['phone'] ?? '00000000000';
                $city = $input['city'] ?? 'فاقوس';
                $address = $input['address'] ?? '';
                $userId = $input['userId'] ?? null;
                $paymentMethod = $input['paymentMethod'] ?? 'عند الاستلام';
                $subtotal = (float)($input['subtotal'] ?? $input['total']);
                $total = (float)($input['total'] ?? 0);
                $createdAt = $input['createdAt'] ?? (time() * 1000);

                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $input['id'], $customerName, $phone, $city, $address, 
                    $subtotal, $total, json_encode($input['items']), $paymentMethod, 
                    'completed', $createdAt, $userId
                ]);

                // تحديث الكميات في المخزن
                $updateStock = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?");
                foreach ($input['items'] as $item) { 
                    $updateStock->execute([$item['quantity'], $item['quantity'], $item['id']]); 
                }
                
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { 
                $pdo->rollBack(); 
                sendErr($e->getMessage()); 
            }
            break;

        case 'get_orders':
            $isAdmin = ($_SESSION['user']['role'] ?? '') === 'admin';
            if ($isAdmin) { 
                $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC"); 
            } else if (isset($_SESSION['user']['phone'])) {
                // البحث بالـ ID أو برقم الهاتف لضمان ظهور طلبات الزائر السابقة
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC");
                $stmt->execute([$_SESSION['user']['id'] ?? 'none', $_SESSION['user']['phone']]);
            } else { 
                sendRes([]); 
            }
            $orders = $stmt->fetchAll() ?: [];
            foreach ($orders as &$o) { 
                $o['items'] = json_decode($o['items'] ?? '[]', true) ?: []; 
                $o['total'] = (float)$o['total'];
                $o['subtotal'] = (float)$o['subtotal'];
            }
            sendRes($orders);
            break;

        case 'delete_product':
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'add_category':
            $stmt = $pdo->prepare("INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['sortOrder'] ?? 0]);
            sendRes(['status' => 'success']);
            break;

        default: sendErr('Unknown action');
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
?>
