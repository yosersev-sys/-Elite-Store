
<?php
/**
 * API Backend for Souq Al-Asr
 * نظام الإدارة المطور v4.7 - دعم وحدات القياس (قطعة/وزن)
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
    // جداول النظام الأساسية
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        createdAt BIGINT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL,
        sortOrder INT DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10,2), 
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

    // تأكد من وجود عمود unit إذا كان الجدول موجوداً مسبقاً
    try {
        $pdo->exec("ALTER TABLE products ADD COLUMN unit VARCHAR(20) DEFAULT 'piece' AFTER stockQuantity");
    } catch (Exception $e) {}

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
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    initDatabase($pdo);

    switch ($action) {
        case 'register':
            if (!isset($input['name'], $input['phone'], $input['password'])) sendErr('بيانات ناقصة');
            if (!preg_match('/^01[0125][0-9]{8}$/', $input['phone'])) sendErr('رقم جوال مصري غير صحيح');
            
            $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
            $stmt->execute([$input['phone']]);
            if ($stmt->fetch()) sendErr('رقم الجوال مسجل مسبقاً');

            $id = 'u_' . uniqid();
            $hash = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, createdAt) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $input['name'], $input['phone'], $hash, time()*1000]);
            
            $user = ['id' => $id, 'name' => $input['name'], 'phone' => $input['phone'], 'role' => 'user'];
            $_SESSION['user'] = $user;
            sendRes(['status' => 'success', 'user' => $user]);
            break;

        case 'login':
            if (!isset($input['phone'], $input['password'])) sendErr('بيانات ناقصة');
            $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ?");
            $stmt->execute([$input['phone']]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($input['password'], $user['password'])) {
                $userData = [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'phone' => $user['phone'],
                    'role' => $user['role']
                ];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } else {
                sendErr('رقم الجوال أو كلمة المرور غير صحيحة');
            }
            break;

        case 'get_current_user':
            sendRes($_SESSION['user'] ?? null);
            break;

        case 'logout':
            session_destroy();
            sendRes(['status' => 'success']);
            break;

        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
            $products = $stmt->fetchAll() ?: [];
            foreach ($products as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]') ?: [];
                $p['sizes'] = json_decode($p['sizes'] ?? '[]') ?: [];
                $p['colors'] = json_decode($p['colors'] ?? '[]') ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}') ?: null;
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (int)$p['stockQuantity'];
                $p['unit'] = $p['unit'] ?? 'piece';
            }
            sendRes($products);
            break;

        case 'add_product':
        case 'update_product':
            $isUpdate = $action === 'update_product';
            $sql = $isUpdate 
                ? "UPDATE products SET name=?, description=?, price=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, unit=?, seoSettings=?, barcode=? WHERE id=?"
                : "INSERT INTO products (name, description, price, categoryId, images, sizes, colors, stockQuantity, unit, seoSettings, barcode, createdAt, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $pdo->prepare($sql);
            $params = [
                $input['name'], $input['description'], $input['price'], $input['categoryId'],
                json_encode($input['images']), json_encode($input['sizes'] ?? []), json_encode($input['colors'] ?? []),
                $input['stockQuantity'], $input['unit'] ?? 'piece', json_encode($input['seoSettings']), $input['barcode']
            ];
            
            if ($isUpdate) {
                $params[] = $input['id'];
            } else {
                $params[] = $input['createdAt'];
                $params[] = $input['id'];
            }
            
            $stmt->execute($params);
            sendRes(['status' => 'success']);
            break;

        case 'delete_product':
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC, name ASC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'add_category':
            $stmt = $pdo->prepare("INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $input['sortOrder'] ?? 0]);
            sendRes(['status' => 'success']);
            break;

        case 'update_category':
            $stmt = $pdo->prepare("UPDATE categories SET name=?, sortOrder=? WHERE id=?");
            $stmt->execute([$input['name'], $input['sortOrder'] ?? 0, $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_category':
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'save_order':
            $pdo->beginTransaction();
            try {
                // البحث عن مستخدم بنفس رقم الهاتف لربط الفاتورة
                $stmtUser = $pdo->prepare("SELECT id, name FROM users WHERE phone = ? LIMIT 1");
                $stmtUser->execute([$input['phone']]);
                $foundUser = $stmtUser->fetch();

                $targetUserId = $foundUser ? $foundUser['id'] : null;
                $finalCustomerName = ($foundUser && $input['customerName'] === 'عميل نقدي') ? $foundUser['name'] : $input['customerName'];

                // تسجيل الطلب - الحالة دائماً مكتملة
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $input['id'], $finalCustomerName, $input['phone'], 
                    $input['city'], $input['address'], $input['subtotal'], $input['total'],
                    json_encode($input['items']), $input['paymentMethod'], 'completed',
                    $input['createdAt'], $targetUserId
                ]);

                // تحديث المخزون
                $updateStock = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?");
                foreach ($input['items'] as $item) {
                    $updateStock->execute([$item['quantity'], $item['quantity'], $item['id']]);
                }

                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) {
                $pdo->rollBack();
                sendErr("فشل تسجيل الطلب: " . $e->getMessage());
            }
            break;
            
        case 'get_orders':
            if (($_SESSION['user']['role'] ?? '') === 'admin') {
                $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
            } else if (isset($_SESSION['user']['id'])) {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC");
                $stmt->execute([$_SESSION['user']['id']]);
            } else {
                sendRes([]);
            }
            $orders = $stmt->fetchAll() ?: [];
            foreach ($orders as &$o) {
                $o['items'] = json_decode($o['items'] ?? '[]') ?: [];
                $o['total'] = (float)$o['total'];
                $o['subtotal'] = (float)$o['subtotal'];
            }
            sendRes($orders);
            break;

        default:
            sendErr('Unknown action: ' . $action);
    }
} catch (Exception $e) {
    sendErr($e->getMessage(), 500);
}
?>
