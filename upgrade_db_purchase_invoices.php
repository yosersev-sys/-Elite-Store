<?php
/**
 * Database Upgrade Script: Purchase Invoices & Movements Module
 * Run this script to upgrade the schema for Purchase Invoices, Supplier Payments, and Inventory Movements.
 */
session_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// Allow CLI or Logged in Admin
if (php_sapi_name() !== 'cli' && (!isset($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin')) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'غير مصرح بتشغيل هذا الملف. يجب تسجيل الدخول كأدمن.'
    ]);
    exit;
}

try {
    // 1. Create uploads/invoices directory if not exists
    $uploadDir = __DIR__ . '/uploads/invoices';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 2. Table: purchase_invoices
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS purchase_invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoiceNumber VARCHAR(100) NULL,
            supplierId VARCHAR(100) NOT NULL,
            totalAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            paidAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            remainingAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            invoiceImagePath VARCHAR(255) NULL,
            notes TEXT NULL,
            shiftId INT NULL,
            userId INT NULL,
            createdAt BIGINT NOT NULL,
            updatedAt BIGINT NOT NULL,
            INDEX idx_pur_supplier (supplierId),
            INDEX idx_pur_status (status),
            INDEX idx_pur_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 3. Table: purchase_invoice_items
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS purchase_invoice_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoiceId INT NOT NULL,
            productId VARCHAR(100) NULL,
            productName VARCHAR(255) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
            unitCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            totalCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            updateStock TINYINT(1) NOT NULL DEFAULT 1,
            INDEX idx_item_invoice (invoiceId),
            INDEX idx_item_product (productId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 4. Table: supplier_payments
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS supplier_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            supplierId VARCHAR(100) NOT NULL,
            invoiceId INT NULL,
            amount DECIMAL(10,2) NOT NULL,
            type VARCHAR(20) NOT NULL DEFAULT 'payment',
            walletType VARCHAR(50) NOT NULL DEFAULT 'drawer',
            notes TEXT NULL,
            shiftId INT NULL,
            userId INT NULL,
            createdAt BIGINT NOT NULL,
            INDEX idx_pay_supplier (supplierId),
            INDEX idx_pay_invoice (invoiceId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 5. Table: inventory_movements
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS inventory_movements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            productId VARCHAR(100) NOT NULL,
            type VARCHAR(50) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL,
            unitCost DECIMAL(10,2) NULL,
            referenceType VARCHAR(50) NULL,
            referenceId VARCHAR(100) NULL,
            notes TEXT NULL,
            userId INT NULL,
            createdAt BIGINT NOT NULL,
            INDEX idx_mov_product (productId),
            INDEX idx_mov_ref (referenceType, referenceId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    echo json_encode([
        'status' => 'success',
        'message' => 'تم إنشاء وجداول فواتير الشراء والحركات المخزنية والمجالس بنجاح.',
        'details' => [
            'tables_checked' => ['purchase_invoices', 'purchase_invoice_items', 'supplier_payments', 'inventory_movements'],
            'upload_directory' => 'uploads/invoices/'
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
