<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain; charset=utf-8');

require_once 'config.php';

echo "=== DATABASE DIAGNOSTIC START ===\n";

try {
    // 1. Check tables
    echo "\n[1] Tables in database:\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $t) {
        echo " - $t\n";
    }

    // 2. Check orders columns
    echo "\n[2] Columns in 'orders' table:\n";
    $cols = $pdo->query("DESCRIBE orders")->fetchAll();
    foreach ($cols as $c) {
        echo " - {$c['Field']}: {$c['Type']} (Null: {$c['Null']}, Key: {$c['Key']}, Default: {$c['Default']})\n";
    }

    // 3. Check customer_ledger columns
    echo "\n[3] Columns in 'customer_ledger' table:\n";
    $colsLedger = $pdo->query("DESCRIBE customer_ledger")->fetchAll();
    foreach ($colsLedger as $c) {
        echo " - {$c['Field']}: {$c['Type']} (Null: {$c['Null']}, Key: {$c['Key']}, Default: {$c['Default']})\n";
    }

    // 4. Test order insert dry-run
    echo "\n[4] Running dry-run insert test...\n";
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt, shiftId, confirmedAt, confirmedById, confirmedShiftId, paymentStatus, discount, discountType, discountValue, deliveryFee, totalItemDiscounts, subtotalBeforeDiscount, finalTotal, discountsMetadata, outstandingAmount, localUuid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            'TEST-' . time(), 'Test Customer', '01009241485', 'سوق العصر', 'Address',
            100.0, 100.0, json_encode([]),
            'نقدي', 'completed', 'admin', time() * 1000,
            null, null, null, null,
            'paid', 0, 'fixed', 0, 0, 0, 100.0, 100.0,
            null, 0, 'test-uuid-' . time()
        ]);
        echo "Dry-run insert succeeded!\n";
    } catch (Exception $e) {
        echo "Dry-run insert FAILED: " . $e->getMessage() . "\n";
    } finally {
        $pdo->rollBack();
    }

} catch (Exception $e) {
    echo "\nGENERAL ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== DATABASE DIAGNOSTIC END ===\n";
