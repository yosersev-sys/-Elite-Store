
<?php
/**
 * API Backend for Faqous Store
 */
error_reporting(0); 
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once 'config.php';

function sendRes($data) {
    echo json_encode($data);
    exit;
}

function sendErr($msg, $code = 400) {
    http_response_code($code);
    sendRes(['status' => 'error', 'message' => $msg]);
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
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
                $p['stockQuantity'] = (int)$p['stockQuantity'];
            }
            sendRes($products);
            break;

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'add_product':
            if (!$input) sendErr('Data missing');
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'], $input['name'], $input['description'], 
                $input['price'], $input['categoryId'], json_encode($input['images']), 
                json_encode($input['sizes']), json_encode($input['colors']), 
                $input['stockQuantity'], time()*1000, json_encode($input['seoSettings'])
            ]);
            sendRes(['status' => 'success']);
            break;

        case 'update_product':
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, seoSettings=? WHERE id=?");
            $stmt->execute([
                $input['name'], $input['description'], $input['price'], 
                $input['categoryId'], json_encode($input['images']), 
                json_encode($input['sizes']), json_encode($input['colors']), 
                $input['stockQuantity'], json_encode($input['seoSettings']), $input['id']
            ]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_product':
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'add_category':
            $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
            $stmt->execute([$input['id'], $input['name']]);
            sendRes(['status' => 'success']);
            break;

        case 'update_category':
            if (!$input) sendErr('Data missing');
            $stmt = $pdo->prepare("UPDATE categories SET name = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'delete_category':
            if (!isset($_GET['id'])) sendErr('ID missing');
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendRes(['status' => 'success']);
            break;
            
        case 'get_orders':
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'save_order':
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, total, createdAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
            $stmt->execute([
                $input['id'], $input['customerName'], $input['phone'], 
                $input['city'], $input['address'], $input['total'], time()*1000
            ]);
            sendRes(['status' => 'success']);
            break;

        default:
            sendErr('Unknown action: ' . $action);
    }
} catch (Exception $e) {
    sendErr($e->getMessage(), 500);
}
