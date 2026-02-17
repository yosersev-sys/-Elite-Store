<?php
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'get_products':
        $prods = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC")->fetchAll();
        foreach ($prods as &$p) {
            $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
            $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
            $p['seoSettings'] = json_decode($p['seoSettings'] ?? '{}', true) ?: null;
            $p['price'] = (float)$p['price'];
            $p['stockQuantity'] = (float)$p['stockQuantity'];
        }
        sendRes($prods);
        break;

    case 'add_product':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, seoSettings, batches, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$input['id'], $input['name'], $input['description'], $input['price'], $input['wholesalePrice'], $input['categoryId'], $input['supplierId'], json_encode($input['images']), $input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches']), time() * 1000]);
        sendRes(['status' => 'success']);
        break;

    case 'update_product':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $stmt = $pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, wholesalePrice = ?, categoryId = ?, supplierId = ?, images = ?, stockQuantity = ?, unit = ?, barcode = ?, seoSettings = ?, batches = ? WHERE id = ?");
        $stmt->execute([$input['name'], $input['description'], $input['price'], $input['wholesalePrice'], $input['categoryId'], $input['supplierId'], json_encode($input['images']), $input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['seoSettings']), json_encode($input['batches']), $input['id']]);
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
            $imgs = json_decode($p['images'], true) ?: [];
            foreach ($imgs as url) $res[] = ['url' => $url, 'productName' => $p['name']];
        }
        sendRes($res);
        break;
}
?>