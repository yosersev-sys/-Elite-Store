<?php
/**
 * إعدادات قاعدة البيانات - سوق العصر
 */

// بيانات الاتصال (قم بتعديلها إذا تغيرت بيانات الاستضافة)
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'u588213546_store');
define('DB_USER', 'u588213546_store');
define('DB_PASS', 'sK0KAGUm|');

try {
    // إنشاء اتصال PDO مع دعم اللغة العربية (utf8mb4)
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    // في حال فشل الاتصال، يتم إرجاع خطأ JSON واضح للمتصفح
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'type' => 'db_connection_failed',
        'message' => 'فشل الاتصال بقاعدة البيانات. تأكد من صحة البيانات في ملف config.php',
        'debug' => $e->getMessage()
    ]);
    exit;
}

// ═══════════════════════════════════════════════════════════════════
// الترقية والتسوية الذاتية التلقائية لقواعد البيانات لجميع الجداول والأعمدة
// ═══════════════════════════════════════════════════════════════════
try {
    // 1. Table: purchase_invoices
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS purchase_invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoiceNumber VARCHAR(100) NULL,
            supplierId VARCHAR(100) NOT NULL,
            totalAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            paidAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            remainingAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            discountAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            freightAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            invoiceImagePath VARCHAR(255) NULL,
            notes TEXT NULL,
            shiftId INT NULL,
            userId VARCHAR(100) NULL,
            createdAt BIGINT NOT NULL,
            updatedAt BIGINT NOT NULL,
            INDEX idx_pur_supplier (supplierId),
            INDEX idx_pur_status (status),
            INDEX idx_pur_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $purCols = [
        'invoiceNumber' => 'VARCHAR(100) NULL',
        'supplierId' => 'VARCHAR(100) NOT NULL',
        'totalAmount' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'paidAmount' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'remainingAmount' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'discountAmount' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'freightAmount' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'status' => "VARCHAR(20) NOT NULL DEFAULT 'draft'",
        'invoiceImagePath' => 'VARCHAR(255) NULL',
        'notes' => 'TEXT NULL',
        'shiftId' => 'INT NULL',
        'userId' => 'VARCHAR(100) NULL',
        'createdAt' => 'BIGINT NOT NULL DEFAULT 0',
        'updatedAt' => 'BIGINT NOT NULL DEFAULT 0'
    ];
    foreach ($purCols as $col => $def) {
        $chk = $pdo->query("SHOW COLUMNS FROM purchase_invoices LIKE '$col'")->fetch();
        if (!$chk) {
            $pdo->exec("ALTER TABLE purchase_invoices ADD COLUMN $col $def");
        }
    }

    // 2. Table: purchase_invoice_items
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS purchase_invoice_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoiceId INT NOT NULL,
            productId VARCHAR(100) NULL,
            productName VARCHAR(255) NOT NULL,
            unitName VARCHAR(100) NULL,
            barcode VARCHAR(100) NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
            unitCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            totalCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            conversionFactor DECIMAL(10,2) NOT NULL DEFAULT 1.00,
            newSalePrice DECIMAL(10,2) NULL,
            lastCostPrice DECIMAL(10,2) NULL,
            updateStock TINYINT(1) NOT NULL DEFAULT 1,
            INDEX idx_item_invoice (invoiceId),
            INDEX idx_item_product (productId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $itemCols = [
        'invoiceId' => 'INT NOT NULL',
        'productId' => 'VARCHAR(100) NULL',
        'productName' => 'VARCHAR(255) NOT NULL',
        'unitName' => 'VARCHAR(100) NULL',
        'barcode' => 'VARCHAR(100) NULL',
        'quantity' => 'DECIMAL(10,2) NOT NULL DEFAULT 1.00',
        'unitCost' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'totalCost' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'conversionFactor' => 'DECIMAL(10,2) NOT NULL DEFAULT 1.00',
        'newSalePrice' => 'DECIMAL(10,2) NULL',
        'lastCostPrice' => 'DECIMAL(10,2) NULL',
        'updateStock' => 'TINYINT(1) NOT NULL DEFAULT 1'
    ];
    foreach ($itemCols as $col => $def) {
        $chk = $pdo->query("SHOW COLUMNS FROM purchase_invoice_items LIKE '$col'")->fetch();
        if (!$chk) {
            $pdo->exec("ALTER TABLE purchase_invoice_items ADD COLUMN $col $def");
        }
    }

    // 3. Table: supplier_payments
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS supplier_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            supplierId VARCHAR(100) NOT NULL,
            invoiceId INT NULL,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            type VARCHAR(20) NOT NULL DEFAULT 'payment',
            walletType VARCHAR(50) NOT NULL DEFAULT 'drawer',
            paymentMethod VARCHAR(50) NOT NULL DEFAULT 'cash',
            referenceNumber VARCHAR(100) NULL,
            notes TEXT NULL,
            shiftId INT NULL,
            userId VARCHAR(100) NULL,
            createdAt BIGINT NOT NULL DEFAULT 0,
            INDEX idx_pay_supplier (supplierId),
            INDEX idx_pay_invoice (invoiceId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $payCols = [
        'supplierId' => 'VARCHAR(100) NOT NULL',
        'invoiceId' => 'INT NULL',
        'amount' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'type' => "VARCHAR(20) NOT NULL DEFAULT 'payment'",
        'walletType' => "VARCHAR(50) NOT NULL DEFAULT 'drawer'",
        'paymentMethod' => "VARCHAR(50) NOT NULL DEFAULT 'cash'",
        'referenceNumber' => 'VARCHAR(100) NULL',
        'notes' => 'TEXT NULL',
        'shiftId' => 'INT NULL',
        'userId' => 'VARCHAR(100) NULL',
        'createdAt' => 'BIGINT NOT NULL DEFAULT 0'
    ];
    foreach ($payCols as $col => $def) {
        $chk = $pdo->query("SHOW COLUMNS FROM supplier_payments LIKE '$col'")->fetch();
        if (!$chk) {
            $pdo->exec("ALTER TABLE supplier_payments ADD COLUMN $col $def");
        }
    }

    // 4. Table: expenses
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            category VARCHAR(100) NOT NULL DEFAULT 'عام',
            paymentSource VARCHAR(20) DEFAULT 'drawer',
            referenceNumber VARCHAR(100) NULL,
            attachment TEXT NULL,
            status VARCHAR(20) DEFAULT 'active',
            shiftId INT NULL,
            drawerTransactionId INT NULL,
            userId VARCHAR(100) NULL,
            notes TEXT NULL,
            date BIGINT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 5. Table: inventory_movements
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS inventory_movements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            productId VARCHAR(100) NOT NULL,
            type VARCHAR(50) NOT NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            unitCost DECIMAL(10,2) NULL,
            referenceType VARCHAR(50) NULL,
            referenceId VARCHAR(100) NULL,
            notes TEXT NULL,
            userId VARCHAR(100) NULL,
            createdAt BIGINT NOT NULL DEFAULT 0,
            INDEX idx_mov_product (productId),
            INDEX idx_mov_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $movCols = [
        'productId' => 'VARCHAR(100) NOT NULL',
        'type' => 'VARCHAR(50) NOT NULL',
        'quantity' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
        'unitCost' => 'DECIMAL(10,2) NULL',
        'referenceType' => 'VARCHAR(50) NULL',
        'referenceId' => 'VARCHAR(100) NULL',
        'notes' => 'TEXT NULL',
        'userId' => 'VARCHAR(100) NULL',
        'createdAt' => 'BIGINT NOT NULL DEFAULT 0'
    ];
    foreach ($movCols as $col => $def) {
        $chk = $pdo->query("SHOW COLUMNS FROM inventory_movements LIKE '$col'")->fetch();
        if (!$chk) {
            $pdo->exec("ALTER TABLE inventory_movements ADD COLUMN $col $def");
        }
    }
} catch (Exception $schemaErr) {}