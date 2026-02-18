<?php
/**
 * System & Settings Module
 */
if (!defined('DB_HOST')) exit;

switch ($action) {
    case 'get_admin_summary':
        if (!isAdmin()) sendErr('غير مصرح');
        $res = [
            'total_revenue' => (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled'")->fetchColumn(),
            'total_customer_debt' => (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled' AND paymentMethod LIKE '%آجل%'")->fetchColumn(),
            'total_supplier_debt' => (float)$pdo->query("SELECT SUM(balance) FROM suppliers")->fetchColumn(),
            'low_stock_count' => (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stockQuantity < 5")->fetchColumn(),
            'new_orders_count' => (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE createdAt > " . ((time()-86400)*1000))->fetchColumn()
        ];
        sendRes($res);
        break;

    case 'get_store_settings':
        $settings = [];
        foreach ($pdo->query("SELECT * FROM settings")->fetchAll() as $s) $settings[$s['setting_key']] = $s['setting_value'];
        sendRes($settings);
        break;

    case 'update_store_settings':
        if (!isAdmin()) sendErr('غير مصرح');
        foreach ($input as $key => $val) {
            $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->execute([$key, $val, $val]);
        }
        sendRes(['status' => 'success']);
        break;
}
