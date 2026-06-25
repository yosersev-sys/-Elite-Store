<?php
require_once 'config.php';
header('Content-Type: text/plain; charset=utf-8');

try {
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables on Server:\n";
    print_r($tables);
    
    foreach (['shifts', 'audit_logs', 'drawer_transactions', 'expenses', 'orders'] as $tbl) {
        if (in_array($tbl, $tables)) {
            echo "\nTable '$tbl' exists. Columns:\n";
            $columns = $pdo->query("DESCRIBE `$tbl`")->fetchAll();
            foreach ($columns as $col) {
                echo "  {$col['Field']} - {$col['Type']}\n";
            }
        } else {
            echo "\nTable '$tbl' DOES NOT exist!\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
