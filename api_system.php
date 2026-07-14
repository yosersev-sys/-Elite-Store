<?php
/**
 * System & Settings Module
 */
if (!defined('DB_HOST')) exit;

switch ($action) {
    case 'get_admin_summary':
        if (!isAdmin() && ($_SESSION['user']['role'] ?? '') !== 'cashier') sendErr('غير مصرح');
        
        $cashSales = (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status = 'completed' AND (paymentMethod LIKE '%نقدي%' OR paymentMethod LIKE '%عند الاستلام%')")->fetchColumn();
        $cashReturns = (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status = 'cancelled' AND (paymentMethod LIKE '%نقدي%' OR paymentMethod LIKE '%عند الاستلام%')")->fetchColumn();
        $collectedLedgerCash = (float)$pdo->query("SELECT SUM(ABS(amount)) FROM customer_ledger WHERE type = 'PAYMENT' AND paymentMethod LIKE '%نقدي%'")->fetchColumn();

        $res = [
            'total_revenue' => (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status = 'completed'")->fetchColumn(),
            'total_customer_debt' => (float)$pdo->query("SELECT IFNULL(SUM(amount), 0) FROM customer_ledger")->fetchColumn(),
            'credit_sales' => (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status = 'completed' AND paymentMethod LIKE '%آجل%'")->fetchColumn(),
            'collected_cash' => $cashSales - $cashReturns + $collectedLedgerCash,
            'total_supplier_debt' => (float)$pdo->query("SELECT SUM(balance) FROM suppliers")->fetchColumn(),
            'low_stock_count' => (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stockQuantity < 5 AND isDeleted = 0")->fetchColumn(),
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
