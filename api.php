
<?php
/**
 * API Backend for Souq Al-Asr
 * نظام الإدارة المطور v6.2 - تحديث الحساب الشخصي
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
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL,
        image LONGTEXT,
        isActive BOOLEAN DEFAULT 1,
        sortOrder INT DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        createdAt BIGINT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10,2), 
        wholesalePrice DECIMAL(10,2) DEFAULT 0,
        categoryId VARCHAR(50), 
        images LONGTEXT, 
        sizes TEXT, 
        colors TEXT, 
        stockQuantity INT DEFAULT 0, 
        unit VARCHAR(20) DEFAULT 'piece',
        createdAt BIGINT, 
        salesCount INT DEFAULT 0, 
        seoSettings TEXT,
        barcode VARCHAR(100)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customerName VARCHAR(255),
        phone VARCHAR(20),
        city VARCHAR(100),
        address TEXT,
        total DECIMAL(10,2),
        subtotal DECIMAL(10,2),
        items LONGTEXT,
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

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC, name ASC");
            $cats = $stmt->fetchAll() ?: [];
            foreach ($cats as &$c) {
                $c['isActive'] = (bool)$c['isActive'];
                $c['sortOrder'] = (int)$c['sortOrder'];
            }
            sendRes($cats);
            break;

        case 'add_category':
        case 'update_category':
            $isUpdate = $action === 'update_category';
            $sql = $isUpdate 
                ? "UPDATE categories SET name=?, image=?, isActive=?, sortOrder=? WHERE id=?"
                : "INSERT INTO categories (id, name, image, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)";
            
            $stmt = $pdo->prepare($sql);
            if ($isUpdate) {
                $stmt->execute([
                    $input['name'], $input['image'] ?? null, 
                    $input['isActive'] ? 1 : 0, $input['sortOrder'] ?? 0, 
                    $input['id']
                ]);
            } else {
                $stmt->execute([
                    $input['id'], $input['name'], $input['image'] ?? null, 
                    $input['isActive'] ? 1 : 0, $input['sortOrder'] ?? 0
                ]);
            }
            sendRes(['status' => 'success']);
            break;

        case 'delete_category':
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
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

        case 'update_profile':
            if (!isset($_SESSION['user'])) sendErr('غير مصرح', 401);
            $id = $_SESSION['user']['id'];
            $name = $input['name'];
            $phone = $input['phone'];
            
            // تحقق من عدم تكرار رقم الجوال لمستخدم آخر
            $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ? AND id != ?");
            $stmt->execute([$phone, $id]);
            if ($stmt->fetch()) sendErr('رقم الجوال هذا مستخدم بالفعل من قبل شخص آخر');

            if (!empty($input['password'])) {
                $pass = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?");
                $stmt->execute([$name, $phone, $pass, $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
                $stmt->execute([$name, $phone, $id]);
            }
            
            // إنهاء الجلسة لضمان إعادة تسجيل الدخول
            session_destroy();
            sendRes(['status' => 'success']);
            break;

        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;
        
        case 'save_order':
            $pdo->beginTransaction();
            try {
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

        case 'update_order_payment':
            if (!isset($input['id'], $input['paymentMethod'])) sendErr('بيانات ناقصة');
            $stmt = $pdo->prepare("UPDATE orders SET paymentMethod = ? WHERE id = ?");
            $stmt->execute([$input['paymentMethod'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        default: sendErr('Unknown action');
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
?>
