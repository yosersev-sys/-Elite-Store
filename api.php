<?php
/**
 * API Backend for Souq Al-Asr - Batch System Edition (FIFO)
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

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

function initDatabase($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, image LONGTEXT, isActive BOOLEAN DEFAULT 1, sortOrder INT DEFAULT 0)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'user', createdAt BIGINT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), wholesalePrice DECIMAL(10,2) DEFAULT 0, categoryId VARCHAR(50), images LONGTEXT, sizes TEXT, colors TEXT, stockQuantity INT DEFAULT 0, unit VARCHAR(20) DEFAULT 'piece', createdAt BIGINT, salesCount INT DEFAULT 0, seoSettings TEXT, barcode VARCHAR(100), batches LONGTEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), city VARCHAR(100), address TEXT, total DECIMAL(10,2), subtotal DECIMAL(10,2), items LONGTEXT, paymentMethod VARCHAR(50), status VARCHAR(20), createdAt BIGINT, userId VARCHAR(50))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value LONGTEXT)");
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
                $p['batches'] = json_decode($p['batches'] ?? '[]') ?: [];
                $p['price'] = (float)$p['price'];
                $p['wholesalePrice'] = (float)($p['wholesalePrice'] ?? 0);
                $p['stockQuantity'] = (int)$p['stockQuantity'];
            }
            sendRes($products);
            break;

        case 'add_product':
        case 'update_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            
            // تحويل الدفعات إلى JSON
            $batchesJson = json_encode($input['batches'] ?? []);
            
            if ($action === 'add_product') {
                $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, images, stockQuantity, unit, barcode, createdAt, seoSettings, batches) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $input['id'], $input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], 
                    $input['categoryId'], json_encode($input['images']), (int)$input['stockQuantity'], $input['unit'], 
                    $input['barcode'] ?? '', $input['createdAt'], json_encode($input['seoSettings'] ?? null), $batchesJson
                ]);
            } else {
                $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, wholesalePrice=?, categoryId=?, images=?, stockQuantity=?, unit=?, barcode=?, seoSettings=?, batches=? WHERE id=?");
                $stmt->execute([
                    $input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], 
                    $input['categoryId'], json_encode($input['images']), (int)$input['stockQuantity'], $input['unit'], 
                    $input['barcode'] ?? '', json_encode($input['seoSettings'] ?? null), $batchesJson, $input['id']
                ]);
            }
            sendRes(['status' => 'success']);
            break;

        case 'save_order':
            $pdo->beginTransaction();
            try {
                $processedItems = [];
                $customerName = $input['customerName'] ?? ($input['fullName'] ?? 'عميل مجهول');
                
                foreach ($input['items'] as $cartItem) {
                    $stmt = $pdo->prepare("SELECT batches, stockQuantity, name FROM products WHERE id = ?");
                    $stmt->execute([$cartItem['id']]);
                    $product = $stmt->fetch();
                    
                    if (!$product) continue;

                    $batches = json_decode($product['batches'] ?? '[]', true) ?: [];
                    $qtyToDeduct = (int)$cartItem['quantity'];
                    $totalWholesaleCostForThisItem = 0;

                    // إذا لم تكن هناك دفعات (نظام قديم)، نستخدم سعر الجملة المباشر
                    if (empty($batches)) {
                        $totalWholesaleCostForThisItem = ($cartItem['wholesalePrice'] ?? 0) * $qtyToDeduct;
                    } else {
                        // منطق FIFO (الوارد أولاً يصرف أولاً)
                        for ($i = 0; $i < count($batches); $i++) {
                            if ($qtyToDeduct <= 0) break;

                            if ($batches[$i]['quantity'] > 0) {
                                $deductFromThisBatch = min($qtyToDeduct, $batches[$i]['quantity']);
                                $totalWholesaleCostForThisItem += ($deductFromThisBatch * $batches[$i]['wholesalePrice']);
                                
                                $batches[$i]['quantity'] -= $deductFromThisBatch;
                                $qtyToDeduct -= $deductFromThisBatch;
                            }
                        }
                    }

                    // تخزين سعر التكلفة الفعلي في عنصر الفاتورة للتقارير
                    $actualAvgWholesale = $cartItem['quantity'] > 0 ? ($totalWholesaleCostForThisItem / $cartItem['quantity']) : 0;
                    $cartItem['actualWholesalePrice'] = $actualAvgWholesale;
                    $processedItems[] = $cartItem;

                    // تحديث المخزون والدفعات
                    $newTotalStock = max(0, (int)$product['stockQuantity'] - (int)$cartItem['quantity']);
                    $updateStmt = $pdo->prepare("UPDATE products SET stockQuantity = ?, batches = ?, salesCount = salesCount + ? WHERE id = ?");
                    $updateStmt->execute([$newTotalStock, json_encode($batches), (int)$cartItem['quantity'], $cartItem['id']]);
                }

                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$input['id'], $customerName, $input['phone'] ?? '0', $input['city'] ?? 'فاقوس', $input['address'] ?? '', (float)($input['subtotal'] ?? $input['total']), (float)$input['total'], json_encode($processedItems), $input['paymentMethod'], 'completed', $input['createdAt'], $input['userId'] ?? null]);
                
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        case 'return_order':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $orderId = $input['id'] ?? '';
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("SELECT items, status FROM orders WHERE id = ?");
                $stmt->execute([$orderId]);
                $order = $stmt->fetch();
                if (!$order || $order['status'] === 'cancelled') throw new Exception('طلب غير صالح أو مسترد مسبقاً');
                
                $items = json_decode($order['items'], true);
                foreach ($items as $item) {
                    // عند الاسترجاع، نعيد الكمية لأحدث دفعة أو كدفعة جديدة
                    $pStmt = $pdo->prepare("SELECT batches, stockQuantity FROM products WHERE id = ?");
                    $pStmt->execute([$item['id']]);
                    $product = $pStmt->fetch();
                    
                    if ($product) {
                        $batches = json_decode($product['batches'] ?? '[]', true) ?: [];
                        // نضيف الكمية المسترجعة لأول دفعة (الأقدم) لإعادة تدويرها
                        if (!empty($batches)) {
                            $batches[0]['quantity'] += $item['quantity'];
                        }
                        
                        $updateProduct = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ?, batches = ? WHERE id = ?");
                        $updateProduct->execute([$item['quantity'], $item['quantity'], json_encode($batches), $item['id']]);
                    }
                }
                $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$orderId]);
                $pdo->commit();
                sendRes(['status' => 'success']);
            } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
            break;

        case 'get_orders':
            $isAdmin = isAdmin();
            if ($isAdmin) { $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC"); } 
            else if (isset($_SESSION['user']['phone'])) { $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC"); $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]); }
            else { sendRes([]); }
            $orders = $stmt->fetchAll() ?: [];
            foreach ($orders as &$o) { 
                $o['items'] = json_decode($o['items'] ?? '[]', true) ?: []; 
                $o['total'] = (float)$o['total']; 
                $o['subtotal'] = (float)($o['subtotal'] ?? $o['total']);
            }
            sendRes($orders);
            break;

        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'add_category':
        case 'update_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            if ($action === 'add_category') {
                $stmt = $pdo->prepare("INSERT INTO categories (id, name, image, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$input['id'], $input['name'], $input['image'] ?? '', (int)($input['isActive'] ?? 1), (int)($input['sortOrder'] ?? 0)]);
            } else {
                $stmt = $pdo->prepare("UPDATE categories SET name=?, image=?, isActive=?, sortOrder=? WHERE id=?");
                $stmt->execute([$input['name'], $input['image'] ?? '', (int)($input['isActive'] ?? 1), (int)($input['sortOrder'] ?? 0), $input['id']]);
            }
            sendRes(['status' => 'success']);
            break;

        case 'delete_product':
        case 'delete_category':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $id = $_GET['id'] ?? $input['id'] ?? '';
            $table = ($action === 'delete_product') ? 'products' : 'categories';
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
            $stmt->execute([$id]);
            sendRes(['status' => 'success']);
            break;

        case 'update_order_payment':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->prepare("UPDATE orders SET paymentMethod = ? WHERE id = ?");
            $stmt->execute([$input['paymentMethod'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'get_users':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'admin_update_user':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $passwordPart = $input['password'] ? ", password = '" . password_hash($input['password'], PASSWORD_DEFAULT) . "'" : "";
            $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? $passwordPart WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $input['id']]);
            sendRes(['status' => 'success']);
            break;

        case 'login':
            $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ?");
            $stmt->execute([$input['phone']]);
            $user = $stmt->fetch();
            if ($user && password_verify($input['password'], $user['password'])) {
                $userData = ['id' => $user['id'], 'name' => $user['name'], 'phone' => $user['phone'], 'role' => $user['role']];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } else { sendErr('بيانات الدخول غير صحيحة'); }
            break;

        case 'register':
            $id = 'u_'.time();
            $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, createdAt) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $input['name'], $input['phone'], password_hash($input['password'], PASSWORD_DEFAULT), time()*1000]);
            $userData = ['id' => $id, 'name' => $input['name'], 'phone' => $input['phone'], 'role' => 'user'];
            $_SESSION['user'] = $userData;
            sendRes(['status' => 'success', 'user' => $userData]);
            break;

        case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;
        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;
        case 'get_admin_phone': $stmt = $pdo->query("SELECT phone FROM users WHERE role = 'admin' LIMIT 1"); $admin = $stmt->fetch(); sendRes(['phone' => $admin['phone'] ?? '201026034170']); break;
        case 'get_store_settings': $stmt = $pdo->query("SELECT * FROM settings"); $res = []; foreach($stmt->fetchAll() as $r) $res[$r['setting_key']] = $r['setting_value']; sendRes($res); break;
        case 'update_store_settings': if(!isAdmin()) sendErr('403'); foreach($input as $k => $v) { $s = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?"); $s->execute([$k, $v, $v]); } sendRes(['status'=>'success']); break;
        default: sendErr('Unknown action');
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
