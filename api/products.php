<?php
/**
 * Products API Module - Performance Optimized
 */
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'get_products':
        try {
            // تحسين: جلب الصور الأولى فقط في القائمة العامة لتقليل الحجم
            $stmt = $pdo->query("SELECT id, name, price, categoryId, images, stockQuantity, unit, salesCount, createdAt FROM products ORDER BY createdAt DESC");
            $prods = $stmt->fetchAll() ?: [];
            foreach ($prods as &$p) {
                $imgs = json_decode($p['images'] ?? '[]', true) ?: [];
                $p['images'] = (count($imgs) > 0) ? [$imgs[0]] : []; // إرسال صورة واحدة فقط للقائمة
                $p['price'] = (float)$p['price'];
                $p['stockQuantity'] = (float)$p['stockQuantity'];
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
            $p['images'] = json_decode($p['images'] ?? '[]', true);
            $p['batches'] = json_decode($p['batches'] ?? '[]', true);
            $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}', true);
            sendRes($p);
        } else sendErr('المنتج غير موجود');
        break;

    case 'add_product':
    case 'update_product':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        // مسح الكاش من المتصفحات عند التعديل عبر تغيير نسخة الـ API مستقبلاً أو فرض تحديث
        $stmt = $pdo->prepare($action == 'add_product' ? 
            "INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, seoSettings, batches, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)" :
            "UPDATE products SET name = ?, description = ?, price = ?, wholesalePrice = ?, categoryId = ?, supplierId = ?, images = ?, stockQuantity = ?, unit = ?, barcode = ?, seoSettings = ?, batches = ? WHERE id = ?"
        );
        
        $params = [
            $input['name'], $input['description'], (float)$input['price'], (float)$input['wholesalePrice'], 
            $input['categoryId'], $input['supplierId'], json_encode($input['images']), (float)$input['stockQuantity'], 
            $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches'])
        ];

        if ($action == 'add_product') {
            array_unshift($params, $input['id']);
            $params[] = time() * 1000;
        } else {
            $params[] = $input['id'];
        }

        $stmt->execute($params);
        sendRes(['status' => 'success']);
        break;
}
?>