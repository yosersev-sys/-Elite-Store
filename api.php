
<?php
/**
 * API Backend for Elite Store - Robust Version
 */
error_reporting(0); 

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
        echo json_encode(['status' => 'error', 'message' => 'config.php not found']);
        exit;
    }
    require_once 'config.php';

    $action = $_GET['action'] ?? '';
    $output = [];

    $input = json_decode(file_get_contents('php://input'), true);

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
            $res = $stmt->fetchAll() ?: [];
            // ضمان وجود قيم افتراضية إذا كانت فارغة
            if (empty($res)) {
                $res = [];
            }
            $output = $res;
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
            if (!$input) throw new Exception("No data received");
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, seoSettings, salesCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
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
                $input['createdAt'] ?: (time()*1000), 
                json_encode($input['seoSettings'] ?? null), 
                0
            ]);
            $output = ['status' => 'success'];
            break;

        case 'update_product':
            if (!$input) throw new Exception("No data received");
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
                json_encode($input['seoSettings'] ?? null), 
                $input['id']
            ]);
            $output = ['status' => 'success'];
            break;

        case 'delete_product':
            $id = $_GET['id'] ?? '';
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $output = ['status' => 'success'];
            break;

        case 'add_category':
            if (!$input) throw new Exception("No category data");
            $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
            $stmt->execute([$input['id'], $input['name']]);
            $output = ['status' => 'success'];
            break;

        case 'delete_category':
            $id = $_GET['id'] ?? '';
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            $output = ['status' => 'success'];
            break;

        case 'save_order':
            if (!$input) throw new Exception("No order data");
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, items, subtotal, total, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'], 
                $input['customerName'], 
                $input['phone'], 
                $input['city'], 
                $input['address'], 
                json_encode($input['items']), 
                $input['subtotal'], 
                $input['total'], 
                $input['paymentMethod'], 
                'pending', 
                $input['createdAt'] ?: (time()*1000)
            ]);
            $output = ['status' => 'success'];
            break;

        default:
            $output = ['status' => 'error', 'message' => 'Unknown action'];
            break;
    }

    echo json_encode($output);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
exit;
