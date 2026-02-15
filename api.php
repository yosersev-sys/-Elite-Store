<?php
/**
 * API Backend for Souq Al-Asr
 * نظام الإدارة المطور v8.0 - دعم FIFO المحاسبي
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
    // تحديث جدول المنتجات لإضافة عمود الدفعات
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
                $p['batches'] = json_decode($p['batches'] ?? '[]') ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}') ?: null;
                $p['price'] = (float)$p['price'];
                $p['wholesalePrice'] = (float)($p['wholesalePrice'] ?? 0);
                $p['stockQuantity'] = (int)$p['stockQuantity'];
            }
            sendRes($products);
            break;

        case 'add_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            // عند إضافة منتج جديد، ننشئ أول دفعة (Batch) له بسعر الجملة الحالي
            $initialBatch = [['quantity' => (int)$input['stockQuantity'], 'wholesalePrice' => (float)$input['wholesalePrice'], 'createdAt' => time()]];
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, images, stockQuantity, unit, barcode, createdAt, seoSettings, batches) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['id'], $input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], 
                $input['categoryId'], json_encode($input['images']), (int)$input['stockQuantity'], $input['unit'], 
                $input['barcode'] ?? '', $input['createdAt'], json_encode($input['seoSettings'] ?? null), json_encode($initialBatch)
            ]);
            sendRes(['status' => 'success']);
            break;

        case 'update_product':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            // تحديث منطق الدفعات عند تعديل الكمية يدوياً (نضيف دفعة جديدة بالفرق إذا زادت الكمية)
            $stmt = $pdo->prepare("SELECT stockQuantity, batches, wholesalePrice FROM products WHERE id = ?");
            $stmt->execute([$input['id']]);
            $old = $stmt->fetch();
            $newQty = (int)$input['stockQuantity'];
            $oldQty = (int)$old['stockQuantity'];
            $batches = json_decode($old['batches'] ?? '[]', true) ?: [];

            if ($newQty > $oldQty) {
                $diff = $newQty - $oldQty;
                $batches[] = ['quantity' => $diff, 'wholesalePrice' => (float)$input['wholesalePrice'], 'createdAt' => time()];
            } else if ($newQty < $oldQty) {
                // تقليل الكمية يدوياً يخصم من أحدث الدفعات (LIFO للمدير) أو أقدمها حسب الرغبة، هنا سنعدل الإجمالي فقط للتبسيط
            }

            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, wholesalePrice=?, categoryId=?, images=?, stockQuantity=?, unit=?, barcode=?, seoSettings=?, batches=? WHERE id=?");
            $stmt->execute([
                $input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], 
                $input['categoryId'], json_encode($input['images']), $newQty, $input['unit'], 
                $input['barcode'] ?? '', json_encode($input['seoSettings'] ?? null), json_encode($batches), $input['id']
            ]);
            sendRes(['status' => 'success']);
            break;

        case 'save_order':
            $pdo->beginTransaction();
            try {
                $items = $input['items'];
                $processedItems = [];

                foreach ($items as $item) {
                    $stmt = $pdo->prepare("SELECT name, batches, stockQuantity, wholesalePrice FROM products WHERE id = ?");
                    $stmt->execute([$item['id']]);
                    $product = $stmt->fetch();
                    
                    if (!$product) throw new Exception("المنتج غير موجود: " . $item['id']);
                    
                    $qtyToSell = (int)$item['quantity'];
                    $batches = json_decode($product['batches'] ?? '[]', true) ?: [];
                    
                    // إذا لم توجد دفعات، ننشئ واحدة افتراضية بسعر الجملة الحالي
                    if (empty($batches)) {
                        $batches = [['quantity' => (int)$product['stockQuantity'], 'wholesalePrice' => (float)$product['wholesalePrice'], 'createdAt' => 0]];
                    }

                    $costForThisItem = 0;
                    $remainingToSell = $qtyToSell;

                    // تطبيق منطق FIFO
                    foreach ($batches as &$batch) {
                        if ($remainingToSell <= 0) break;
                        if ($batch['quantity'] <= 0) continue;

                        $take = min($remainingToSell, $batch['quantity']);
                        $costForThisItem += ($take * $batch['wholesalePrice']);
                        $batch['quantity'] -= $take;
                        $remainingToSell -= $take;
                    }

                    // متوسط سعر الجملة لهذه العملية (ليستخدم في التقارير لاحقاً)
                    $item['actualWholesalePrice'] = $qtyToSell > 0 ? $costForThisItem / $qtyToSell : $product['wholesalePrice'];
                    $processedItems[] = $item;

                    // تحديث المنتج
                    $newTotalStock = $product['stockQuantity'] - $qtyToSell;
                    $upd = $pdo->prepare("UPDATE products SET stockQuantity = ?, batches = ?, salesCount = salesCount + ? WHERE id = ?");
                    $upd->execute([$newTotalStock, json_encode($batches), $qtyToSell, $item['id']]);
                }

                $customerName = $input['customerName'] ?? ($input['fullName'] ?? 'عميل مجهول');
                $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$input['id'], $customerName, $input['phone'], $input['city'] ?? 'فاقوس', $input['address'] ?? '', (float)$input['total'], (float)$input['total'], json_encode($processedItems), $input['paymentMethod'], 'completed', $input['createdAt'], $input['userId'] ?? null]);
                
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
                if (!$order || $order['status'] === 'cancelled') throw new Exception('طلب غير صالح');
                
                $items = json_decode($order['items'], true);
                foreach ($items as $item) {
                    // عند الاسترجاع، نعيد الكمية لأول دفعة (أقدم دفعة) للحفاظ على الترتيب المحاسبي
                    $stmt = $pdo->prepare("SELECT batches, stockQuantity FROM products WHERE id = ?");
                    $stmt->execute([$item['id']]);
                    $prod = $stmt->fetch();
                    $batches = json_decode($prod['batches'] ?? '[]', true) ?: [];
                    
                    if (!empty($batches)) {
                        $batches[0]['quantity'] += $item['quantity'];
                    } else {
                        $batches = [['quantity' => (int)$item['quantity'], 'wholesalePrice' => (float)($item['actualWholesalePrice'] ?? 0), 'createdAt' => time()]];
                    }

                    $upd = $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, batches = ?, salesCount = salesCount - ? WHERE id = ?");
                    $upd->execute([$item['quantity'], json_encode($batches), $item['quantity'], $item['id']]);
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
            }
            sendRes($orders);
            break;
            
        case 'get_categories':
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'get_users':
            if (!isAdmin()) sendErr('غير مصرح', 403);
            $stmt = $pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC");
            sendRes($stmt->fetchAll() ?: []);
            break;

        case 'login':
            $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ?");
            $stmt->execute([$input['phone']]);
            $user = $stmt->fetch();
            if ($user && password_verify($input['password'], $user['password'])) {
                $userData = ['id' => $user['id'], 'name' => $user['name'], 'phone' => $user['phone'], 'role' => $user['role']];
                $_SESSION['user'] = $userData;
                sendRes(['status' => 'success', 'user' => $userData]);
            } else { sendErr('خطأ في البيانات'); }
            break;

        case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;
        case 'logout': session_destroy(); sendRes(['status' => 'success']); break;
        case 'get_store_settings': $stmt = $pdo->query("SELECT * FROM settings"); $res = []; foreach($stmt->fetchAll() as $r) $res[$r['setting_key']] = $r['setting_value']; sendRes($res); break;
        default: sendErr('Action not found');
    }
} catch (Exception $e) { sendErr($e->getMessage(), 500); }
