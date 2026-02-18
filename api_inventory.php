<?php
/**
 * Inventory & Products Module
 */
if (!defined('DB_HOST')) exit;

switch ($action) {
    case 'get_products':
        $prods = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC")->fetchAll();
        foreach ($prods as &$p) {
            $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
            $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
            $p['price'] = (float)$p['price'];
            $p['stockQuantity'] = (float)$p['stockQuantity'];
        }
        sendRes($prods);
        break;

    case 'add_product':
        if (!isAdmin()) sendErr('غير مصرح');
        $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, batches, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $input['id'], $input['name'], $input['description'], $input['price'], $input['wholesalePrice'] ?? 0,
            $input['categoryId'], $input['supplierId'] ?? null, json_encode($input['images']),
            $input['stockQuantity'], $input['unit'], $input['barcode'] ?? null, '[]', time()*1000
        ]);
        sendRes(['status' => 'success']);
        break;

    case 'update_product':
        if (!isAdmin()) sendErr('غير مصرح');
        $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, wholesalePrice=?, categoryId=?, supplierId=?, images=?, stockQuantity=?, unit=?, barcode=?, batches=? WHERE id=?");
        $stmt->execute([
            $input['name'], $input['description'], $input['price'], $input['wholesalePrice'],
            $input['categoryId'], $input['supplierId'], json_encode($input['images']),
            $input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['batches'] ?? []), $input['id']
        ]);
        sendRes(['status' => 'success']);
        break;

    case 'get_categories':
        sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC")->fetchAll());
        break;

    case 'add_category':
        if (!isAdmin()) sendErr('غير مصرح');
        $stmt = $pdo->prepare("INSERT INTO categories (id, name, image, sortOrder) VALUES (?,?,?,?)");
        $stmt->execute([$input['id'], $input['name'], $input['image'] ?? '', $input['sortOrder'] ?? 0]);
        sendRes(['status' => 'success']);
        break;
}
