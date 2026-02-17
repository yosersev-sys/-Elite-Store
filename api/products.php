<?php
/**
 * Products API Module - Souq Al-Asr
 */
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'get_products':
        try {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
            $prods = $stmt->fetchAll() ?: [];
            foreach ($prods as &$p) {
                // تحويل النصوص المخزنة كـ JSON إلى مصفوفات حقيقية
                $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
                $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}', true) ?: null;
                
                // التأكد من أن القيم الرقمية يتم إرسالها كأرقام وليس نصوص
                $p['price'] = (float)($p['price'] ?? 0);
                $p['wholesalePrice'] = (float)($p['wholesalePrice'] ?? 0);
                $p['stockQuantity'] = (float)($p['stockQuantity'] ?? 0);
                $p['salesCount'] = (int)($p['salesCount'] ?? 0);
                $p['createdAt'] = (int)($p['createdAt'] ?? (time() * 1000));
            }
            sendRes($prods);
        } catch (Exception $e) {
            sendErr($e->getMessage());
        }
        break;

    case 'add_product':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, seoSettings, batches, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['id'], 
            $input['name'], 
            $input['description'], 
            (float)$input['price'], 
            (float)($input['wholesalePrice'] ?? 0), 
            $input['categoryId'], 
            $input['supplierId'] ?? null, 
            json_encode($input['images'] ?? []), 
            (float)($input['stockQuantity'] ?? 0), 
            $input['unit'] ?? 'piece', 
            $input['barcode'] ?? '', 
            json_encode($input['seoSettings'] ?? (object)[]), 
            json_encode($input['batches'] ?? []), 
            $input['createdAt'] ?? (time() * 1000)
        ]);
        sendRes(['status' => 'success']);
        break;

    case 'update_product':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, wholesalePrice = ?, categoryId = ?, supplierId = ?, images = ?, stockQuantity = ?, unit = ?, barcode = ?, seoSettings = ?, batches = ? WHERE id = ?");
        $stmt->execute([
            $input['name'], 
            $input['description'], 
            (float)$input['price'], 
            (float)($input['wholesalePrice'] ?? 0), 
            $input['categoryId'], 
            $input['supplierId'] ?? null, 
            json_encode($input['images'] ?? []), 
            (float)($input['stockQuantity'] ?? 0), 
            $input['unit'] ?? 'piece', 
            $input['barcode'] ?? '', 
            json_encode($input['seoSettings'] ?? (object)[]), 
            json_encode($input['batches'] ?? []), 
            $input['id']
        ]);
        sendRes(['status' => 'success']);
        break;

    case 'delete_product':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$_GET['id']]);
        sendRes(['status' => 'success']);
        break;

    case 'get_all_images':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $res = [];
        $prods = $pdo->query("SELECT name, images FROM products")->fetchAll();
        foreach ($prods as $p) {
            $imgs = json_decode($p['images'] ?? '[]', true) ?: [];
            foreach ($imgs as $url) { // تم إصلاح الخطأ هنا بإضافة علامة $
                $res[] = ['url' => $url, 'productName' => $p['name']];
            }
        }
        sendRes($res);
        break;

    default:
        sendErr('Action not found in products module');
}
?>