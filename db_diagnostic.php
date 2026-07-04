<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/config.php';

echo "=== DATABASE DIAGNOSTIC ===\n";

try {
    // 1. Check if order_payments table exists and show its columns
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'order_payments'")->fetch();
    if ($tableCheck) {
        echo "order_payments table: EXISTS\n";
        
        $desc = $pdo->query("DESCRIBE order_payments")->fetchAll(PDO::FETCH_ASSOC);
        echo "Columns:\n";
        foreach ($desc as $col) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
        
        // Count total rows
        $count = $pdo->query("SELECT COUNT(*) FROM order_payments")->fetchColumn();
        echo "Total rows: $count\n\n";
        
        // Show first 20 rows
        if ($count > 0) {
            echo "First 20 rows:\n";
            $rows = $pdo->query("SELECT * FROM order_payments ORDER BY id DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                print_r($row);
            }
        }
    } else {
        echo "order_payments table: NOT FOUND!\n";
    }
    
    // 2. Check if payment_methods table exists
    $pmCheck = $pdo->query("SHOW TABLES LIKE 'payment_methods'")->fetch();
    if ($pmCheck) {
        echo "\npayment_methods table: EXISTS\n";
        $pmRows = $pdo->query("SELECT * FROM payment_methods")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($pmRows as $row) {
            print_r($row);
        }
    }
    
} catch (Exception $e) {
    echo "Error running diagnostic: " . $e->getMessage() . "\n";
}
