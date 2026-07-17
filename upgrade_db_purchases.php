<?php
/**
 * Database Upgrade Script: Purchases Log Features
 * Run this script once to upgrade the schema of the drawer_transactions table.
 */
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Restrict to logged in admin users, allow CLI execution
if (php_sapi_name() !== 'cli' && (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin')) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'غير مصرح بتشغيل هذا الملف. يجب تسجيل الدخول كأدمن.'
    ]);
    exit;
}

try {
    // 1. Check and add 'category' column
    $checkCat = $pdo->query("SHOW COLUMNS FROM drawer_transactions LIKE 'category'")->fetch();
    $catAdded = false;
    if (!$checkCat) {
        $pdo->exec("ALTER TABLE drawer_transactions ADD COLUMN category VARCHAR(50) NULL DEFAULT 'general'");
        
        // Populate existing data with correct categories
        $pdo->exec("UPDATE drawer_transactions SET category = 'purchase' WHERE type = 'withdrawal'");
        $pdo->exec("UPDATE drawer_transactions SET category = 'deposit' WHERE type = 'deposit'");
        
        $catAdded = true;
    }

    // 2. Check and add 'balanceAfter' column
    $checkBal = $pdo->query("SHOW COLUMNS FROM drawer_transactions LIKE 'balanceAfter'")->fetch();
    $balAdded = false;
    if (!$checkBal) {
        $pdo->exec("ALTER TABLE drawer_transactions ADD COLUMN balanceAfter DECIMAL(10,2) NULL DEFAULT NULL");
        $balAdded = true;
    }

    // 3. Check and add composite index
    $checkIndex = $pdo->query("SHOW INDEX FROM drawer_transactions WHERE Key_name = 'idx_drawer_tx_cat_created'")->fetchAll();
    $indexAdded = false;
    if (empty($checkIndex)) {
        $pdo->exec("ALTER TABLE drawer_transactions ADD INDEX idx_drawer_tx_cat_created (category, createdAt)");
        $indexAdded = true;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'تمت ترقية قاعدة البيانات بنجاح.',
        'details' => [
            'category_added' => $catAdded,
            'balanceAfter_added' => $balAdded,
            'index_added' => $indexAdded
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'فشلت ترقية قاعدة البيانات.',
        'error' => $e->getMessage()
    ]);
}
