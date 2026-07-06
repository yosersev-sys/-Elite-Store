<?php
/**
 * Database Upgrade Migration Script - Souq Al-Asr
 * Run this script once to add the necessary columns and indexes for offline sync support.
 */

header('Content-Type: text/plain; charset=utf-8');

require_once 'config.php';

echo "Starting Database Upgrade...\n";

try {
    // 1. Check if localUuid column exists
    $checkCol = $pdo->query("SHOW COLUMNS FROM orders LIKE 'localUuid'")->fetch();
    if (!$checkCol) {
        echo "Adding 'localUuid' column to 'orders' table...\n";
        $pdo->exec("ALTER TABLE orders ADD COLUMN localUuid VARCHAR(50) NULL");
        echo "'localUuid' column added successfully.\n";
    } else {
        echo "'localUuid' column already exists in 'orders' table.\n";
    }

    // 2. Check if unique index unique_localUuid exists
    $checkIndex = $pdo->query("SHOW INDEX FROM orders WHERE Key_name = 'unique_localUuid'")->fetch();
    if (!$checkIndex) {
        echo "Adding unique constraint index 'unique_localUuid'...\n";
        $pdo->exec("ALTER TABLE orders ADD UNIQUE KEY unique_localUuid (localUuid)");
        echo "Unique constraint index added successfully.\n";
    } else {
        echo "Unique constraint index 'unique_localUuid' already exists.\n";
    }

    echo "Database Upgrade Completed Successfully!\n";
} catch (Exception $e) {
    echo "ERROR: Database Upgrade Failed!\n";
    echo $e->getMessage() . "\n";
    exit(1);
}
