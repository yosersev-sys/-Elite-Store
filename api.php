<?php
/**
 * API Backend for Elite Store
 */
error_reporting(E_ALL); 
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

function sendError($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['status' => 'error', 'message' => $msg]);
    exit;
}

try {
    if (!file_exists('config.php')) {
        sendError('Config file missing', 500);
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
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (int)$p['stockQuantity'];
            }
            echo json_encode($res);
            break;

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY name ASC");
            echo json_encode($stmt->fetchAll() ?: []);
            break;

        case 'get_orders':
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
            echo json_encode($stmt->fetchAll() ?: []);
            break;

        case 'add_category':
            if (!$input) sendError('No input');
            $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
            $stmt->execute([$input['id'], $input['name']]);
            echo json_encode(['status' => 'success']);
            break;

        case 'delete_category':
            $id = $_GET['id'] ?? '';
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
            break;

        case 'add_product':
            if (!$input) sendError('No input');
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, stockQuantity, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'] ?? 'p_'.time(),
                $input['name'],
                $input['description'],
                $input['price'],
                $input['categoryId'],
                json_encode($input['images'] ?? []),
                (int)$input['stockQuantity'],
                $input['createdAt'] ?? time()
            ]);
            echo json_encode(['status' => 'success']);
            break;

        case 'delete_product':
            $id = $_GET['id'] ?? '';
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
            break;

        case 'save_order':
            if (!$input) sendError('No input');
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, total, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'],
                $input['customerName'],
                $input['phone'],
                $input['city'],
                $input['address'],
                $input['total'],
                time()
            ]);
            echo json_encode(['status' => 'success']);
            break;

        default:
            sendError('Unknown action: ' . $action);
    }

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}
