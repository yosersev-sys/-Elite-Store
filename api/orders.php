<?php
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'get_orders':
        if (isAdmin()) $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
        else if (isset($_SESSION['user'])) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE userId = ? OR phone = ? ORDER BY createdAt DESC");
            $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]);
        } else sendRes([]);
        $orders = $stmt->fetchAll();
        foreach ($orders as &$o) { $o['items'] = json_decode($o['items'], true) ?: []; $o['total'] = (float)$o['total']; }
        sendRes($orders);
        break;

    case 'save_order':
        $pdo->beginTransaction();
        try {
            foreach ($input['items'] as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")
                    ->execute([(float)$item['quantity'], (int)$item['quantity'], $item['id']]);
            }
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$input['id'], $input['customerName'], $input['phone'], $input['city'], $input['address'], $input['subtotal'], $input['total'], json_encode($input['items']), $input['paymentMethod'], $input['status'], $input['userId'], time() * 1000]);
            $pdo->commit();
            sendRes(['status' => 'success']);
        } catch (Exception $e) { $pdo->rollBack(); sendErr($e->getMessage()); }
        break;

    case 'update_order_payment':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $pdo->prepare("UPDATE orders SET paymentMethod = ? WHERE id = ?")->execute([$input['paymentMethod'], $input['id']]);
        sendRes(['status' => 'success']);
        break;

    case 'return_order':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $id = $input['id'];
        $order = $pdo->prepare("SELECT items, status FROM orders WHERE id = ?");
        $order->execute([$id]);
        $o = $order->fetch();
        if ($o && $o['status'] !== 'cancelled') {
            $items = json_decode($o['items'], true) ?: [];
            foreach ($items as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?")
                    ->execute([(float)$item['quantity'], (int)$item['quantity'], $item['id']]);
            }
            $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$id]);
        }
        sendRes(['status' => 'success']);
        break;
}
?>