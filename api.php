
<?php
/**
 * API Backend for Elite Store
 */
error_reporting(E_ALL); 
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// دالة لإرجاع الخطأ بتنسيق JSON
function sendError($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['status' => 'error', 'message' => $msg]);
    exit;
}

try {
    if (!file_exists('config.php')) {
        sendError('الملف config.php غير موجود بالسيرفر', 500);
    }
    require_once 'config.php';

    $action = $_GET['action'] ?? '';
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
            $res = $stmt->fetchAll() ?: [];
            foreach ($res as &$p) {
                $p['images'] = json_decode($p['images'] ?? '[]') ?: [];
                $p['sizes'] = json_decode($p['sizes'] ?? '[]') ?: [];
                $p['colors'] = json_decode($p['colors'] ?? '[]') ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}') ?: null;
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (int)$p['stockQuantity'];
            }
            echo json_encode($res);
            break;

        case 'get_product':
            $id = $_GET['id'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $p = $stmt->fetch();
            if ($p) {
                $p['images'] = json_decode($p['images'] ?? '[]') ?: [];
                $p['sizes'] = json_decode($p['sizes'] ?? '[]') ?: [];
                $p['colors'] = json_decode($p['colors'] ?? '[]') ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}') ?: null;
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (int)$p['stockQuantity'];
                echo json_encode($p);
            } else {
                sendError('المنتج غير موجود', 404);
            }
            break;

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
            $res = $stmt->fetchAll() ?: [];
            echo json_encode($res);
            break;

        case 'get_orders':
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
            $res = $stmt->fetchAll() ?: [];
            echo json_encode($res);
            break;

        case 'add_product':
            if (!$input) sendError('لم يتم استلام بيانات المنتج');
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'] ?? 'p_'.time(), 
                $input['name'], 
                $input['description'], 
                $input['price'], 
                $input['categoryId'], 
                json_encode($input['images'] ?? []), 
                json_encode($input['sizes'] ?? []), 
                json_encode($input['colors'] ?? []), 
                (int)($input['stockQuantity'] ?? 0), 
                $input['createdAt'] ?? (time()*1000),
                json_encode($input['seoSettings'] ?? new stdClass())
            ]);
            echo json_encode(['status' => 'success']);
            break;

        case 'update_product':
            if (!$input) sendError('بيانات التحديث مفقودة');
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, seoSettings=? WHERE id=?");
            $stmt->execute([
                $input['name'], 
                $input['description'], 
                $input['price'], 
                $input['categoryId'], 
                json_encode($input['images'] ?? []), 
                json_encode($input['sizes'] ?? []), 
                json_encode($input['colors'] ?? []), 
                (int)($input['stockQuantity'] ?? 0), 
                json_encode($input['seoSettings'] ?? new stdClass()),
                $input['id']
            ]);
            echo json_encode(['status' => 'success']);
            break;

        case 'add_category':
            if (!$input) sendError('بيانات القسم مفقودة');
            $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
            $stmt->execute([$input['id'], $input['name']]);
            echo json_encode(['status' => 'success']);
            break;

        case 'update_category':
            if (!$input) sendError('بيانات التحديث مفقودة');
            $stmt = $pdo->prepare("UPDATE categories SET name=? WHERE id=?");
            $stmt->execute([$input['name'], $input['id']]);
            echo json_encode(['status' => 'success']);
            break;

        case 'delete_category':
            $id = $_GET['id'] ?? '';
            if(!$id) sendError('رقم القسم مفقود');
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
            break;

        case 'save_order':
            if (!$input) sendError('بيانات الطلب مفقودة');
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, total, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'], 
                $input['customerName'], 
                $input['phone'], 
                $input['city'], 
                $input['address'], 
                $input['total'], 
                time()*1000
            ]);
            echo json_encode(['status' => 'success']);
            break;

        case 'delete_product':
            $id = $_GET['id'] ?? '';
            if(!$id) sendError('رقم المنتج مفقود');
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
            break;

        default:
            sendError('الإجراء المطلوب غير معروف: ' . $action);
    }

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
