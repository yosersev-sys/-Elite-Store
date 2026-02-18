<?php
/**
 * Sales & Orders Module
 */
if (!defined('DB_HOST')) exit;

switch ($action) {
    case 'get_orders':
        if (isAdmin()) $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC LIMIT 500");
        else if (isset($_SESSION['user'])) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC LIMIT 50");
            $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]);
        } else sendRes([]);
        $orders = $stmt->fetchAll();
        foreach ($orders as &$o) {
            $o['items'] = json_decode($o['items'], true) ?: [];
            $o['total'] = (float)$o['total'];
        }
        sendRes($orders);
        break;

    case 'save_order':
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['id'], $input['customerName'], $input['phone'], $input['city'] ?? 'سوق العصر', $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $input['status'], $input['userId'] ?? null, time() * 1000
            ]);
            foreach ($input['items'] as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")->execute([$item['quantity'], $item['quantity'], $item['id']]);
            }
            $pdo->commit();
            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل في حفظ الفاتورة');
        }
        break;

    case 'return_order':
        if (!isAdmin()) sendErr('غير مصرح');
        $pdo->beginTransaction();
        try {
            $id = $input['id'] ?? $_GET['id'] ?? '';
            $stmt = $pdo->prepare("SELECT items, status FROM orders WHERE id = ? FOR UPDATE");
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            if ($order && $order['status'] !== 'cancelled') {
                $items = json_decode($order['items'], true);
                foreach ($items as $item) {
                    $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?")->execute([$item['quantity'], $item['quantity'], $item['id']]);
                }
                $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$id]);
                $pdo->commit();
                sendRes(['status' => 'success']);
            } else sendErr('الطلب ملغي مسبقاً');
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('خطأ في الاسترجاع');
        }
        break;
}
