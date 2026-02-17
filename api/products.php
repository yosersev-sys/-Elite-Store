<?php
/**
 * Products API Module - Optimized for Performance and Reliability
 */
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'get_products':
        try {
            // جلب البيانات الأساسية للمتجر ولوحة التحكم
            // ملاحظة: جلب الصور بالكامل قد يكون ثقيلاً، لذا نعتمد على التحويل في الواجهة أو تقليص البيانات
            $stmt = $pdo->query("SELECT id, name, price, wholesalePrice, categoryId, images, stockQuantity, unit, salesCount, createdAt, barcode, batches FROM products ORDER BY createdAt DESC");
            $prods = $stmt->fetchAll() ?: [];
            
            foreach ($prods as &$p) {
                // تحويل نصوص الـ JSON إلى مصفوفات
                $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
                
                // تحويل الأنواع لضمان استقرار العمليات الحسابية في React
                $p['price'] = (float)$p['price'];
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

    case 'get_product_details':
        $id = $_GET['id'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $p = $stmt->fetch();
        if ($p) {
            $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
            $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
            $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}', true) ?: null;
            $p['price'] = (float)$p['price'];
            $p['wholesalePrice'] = (float)$p['wholesalePrice'];
            $p['stockQuantity'] = (float)$p['stockQuantity'];
            sendRes($p);
        } else sendErr('المنتج غير موجود');
        break;

    case 'add_product':
    case 'update_product':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        
        $isAdd = ($action === 'add_product');
        
        if ($isAdd) {
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, seoSettings, batches, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        } else {
            $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, wholesalePrice = ?, categoryId = ?, supplierId = ?, images = ?, stockQuantity = ?, unit = ?, barcode = ?, seoSettings = ?, batches = ? WHERE id = ?");
        }
        
        $params = [
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
            json_encode($input['batches'] ?? [])
        ];

        if ($isAdd) {
            array_unshift($params, $input['id']);
            $params[] = $input['createdAt'] ?? (time() * 1000);
        } else {
            $params[] = $input['id'];
        }

        $stmt->execute($params);
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
            foreach ($imgs as $url) { // تم إصلاح الخطأ المطبعي هنا $url
                $res[] = ['url' => $url, 'productName' => $p['name']];
            }
        }
        sendRes($res);
        break;
}
?>