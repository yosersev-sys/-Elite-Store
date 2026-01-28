<?php
/**
 * API Backend for Elite Store
 */
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);

// إعدادات الـ CORS للسماح بالطلبات من واجهات برمجية مختلفة
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
        throw new Exception("File config.php not found.");
    }
    require_once 'config.php';

    $action = $_GET['action'] ?? '';
    $output = null;

    // قراءة البيانات المرسلة بصيغة JSON
    $inputData = json_decode(file_get_contents('php://input'), true);

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
            if (!$inputData) throw new Exception("No product data provided.");
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, seoSettings, salesCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $inputData['id'] ?? 'p_'.time(),
                $inputData['name'],
                $inputData['description'],
                $inputData['price'],
                $inputData['categoryId'],
                json_encode($inputData['images'] ?? []),
                json_encode($inputData['sizes'] ?? []),
                json_encode($inputData['colors'] ?? []),
                (int)$inputData['stockQuantity'],
                $inputData['createdAt'] ?? (time() * 1000),
                json_encode($inputData['seoSettings'] ?? null),
                0
            ]);
            $output = ['status' => 'success'];
            break;

        case 'update_product':
            if (!$inputData) throw new Exception("No update data provided.");
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, categoryId=?, images=?, sizes=?, colors=?, stockQuantity=?, seoSettings=?, salesCount=? WHERE id=?");
            $stmt->execute([
                $inputData['name'],
                $inputData['description'],
                $inputData['price'],
                $inputData['categoryId'],
                json_encode($inputData['images']),
                json_encode($inputData['sizes'] ?? []),
                json_encode($inputData['colors'] ?? []),
                (int)$inputData['stockQuantity'],
                json_encode($inputData['seoSettings']),
                (int)($inputData['salesCount'] ?? 0),
                $inputData['id']
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
            if (!$inputData) throw new Exception("No category data provided.");
            $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
            $stmt->execute([$inputData['id'], $inputData['name']]);
            $output = ['status' => 'success'];
            break;

        case 'delete_category':
            $id = $_GET['id'] ?? '';
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            $output = ['status' => 'success'];
            break;

        case 'save_order':
            if (!$inputData) throw new Exception("No order data provided.");
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, items, subtotal, total, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $inputData['id'],
                $inputData['customerName'],
                $inputData['phone'],
                $inputData['city'],
                $inputData['address'],
                json_encode($inputData['items']),
                $inputData['subtotal'],
                $inputData['total'],
                $inputData['paymentMethod'],
                $inputData['status'],
                $inputData['createdAt']
            ]);
            $output = ['status' => 'success'];
            break;

        default:
            $output = ['status' => 'error', 'message' => "Unknown action: $action"];
            break;
    }

    ob_clean();
    echo json_encode($output);
} catch (Exception $e) {
    ob_clean();
    http_response_code(200); // Return 200 but with error status to be handled by JS
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
exit;
