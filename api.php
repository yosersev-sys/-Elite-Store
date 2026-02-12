
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

// دالة فحص وتحديث قاعدة البيانات تلقائياً
function ensureSortOrderColumn($pdo) {
    try {
        $pdo->query("SELECT sortOrder FROM categories LIMIT 1");
    } catch (Exception $e) {
        // العمود غير موجود، نقوم بإضافته
        $pdo->exec("ALTER TABLE categories ADD COLUMN sortOrder INT DEFAULT 0");
    }
}

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
            ensureSortOrderColumn($pdo); // التأكد من وجود العمود قبل الاستعلام
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC, name ASC");
            $categories = $stmt->fetchAll() ?: [];
            foreach ($categories as &$c) {
                $c['sortOrder'] = isset($c['sortOrder']) ? (int)$c['sortOrder'] : 0;
            }
            sendRes($categories);
            break;

        case 'add_category':
            ensureSortOrderColumn($pdo);
            $res = $pdo->query("SELECT MAX(sortOrder) as maxOrder FROM categories")->fetch();
            $nextOrder = ($res['maxOrder'] ?? 0) + 1;
            $stmt = $pdo->prepare("INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)");
            $stmt->execute([$input['id'], $input['name'], $nextOrder]);
            sendRes(['status' => 'success']);
            break;

        case 'update_category':
            ensureSortOrderColumn($pdo);
            if (!$input) sendErr('Data missing');
            if (isset($input['sortOrder'])) {
                $stmt = $pdo->prepare("UPDATE categories SET name = ?, sortOrder = ? WHERE id = ?");
                $stmt->execute([$input['name'], $input['sortOrder'], $input['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE categories SET name = ? WHERE id = ?");
                $stmt->execute([$input['name'], $input['id']]);
            }
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
