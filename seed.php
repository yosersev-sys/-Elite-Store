
<?php
/**
 * ملف تهيئة البيانات الشامل (Master Seed) - سوق العصر
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. إنشاء الجداول مع كافة الأعمدة
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL,
        image LONGTEXT,
        isActive TINYINT(1) DEFAULT 1,
        sortOrder INT DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10,2) DEFAULT 0, 
        wholesalePrice DECIMAL(10,2) DEFAULT 0,
        categoryId VARCHAR(50), 
        supplierId VARCHAR(50),
        images LONGTEXT, 
        unit VARCHAR(20) DEFAULT 'piece',
        barcode VARCHAR(100),
        stockQuantity DECIMAL(10,2) DEFAULT 0, 
        createdAt BIGINT, 
        salesCount INT DEFAULT 0, 
        seoSettings LONGTEXT,
        batches LONGTEXT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS product_units (
        id VARCHAR(50) PRIMARY KEY,
        productId VARCHAR(50) NOT NULL,
        unitName VARCHAR(100) NOT NULL,
        barcode VARCHAR(100) UNIQUE NULL,
        purchasePrice DECIMAL(10,2) DEFAULT 0.00,
        salePrice DECIMAL(10,2) DEFAULT 0.00,
        conversionFactor DECIMAL(10,2) DEFAULT 1.00,
        isDefault TINYINT(1) DEFAULT 0,
        isActive TINYINT(1) DEFAULT 1,
        INDEX idx_productId (productId),
        INDEX idx_barcode (barcode)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    try {
        $pdo->exec("ALTER TABLE product_units MODIFY COLUMN barcode VARCHAR(100) UNIQUE NULL");
    } catch (Exception $e) {
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        phone VARCHAR(20) NOT NULL, 
        companyName VARCHAR(255), 
        address TEXT, 
        notes TEXT, 
        type VARCHAR(50) DEFAULT 'wholesale', 
        balance DECIMAL(10,2) DEFAULT 0, 
        rating INT DEFAULT 5, 
        status VARCHAR(20) DEFAULT 'active', 
        paymentHistory LONGTEXT, 
        createdAt BIGINT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        phone VARCHAR(20) UNIQUE NOT NULL, 
        password VARCHAR(255) NOT NULL, 
        role VARCHAR(20) DEFAULT 'user', 
        createdAt BIGINT,
        lastOrderAt BIGINT NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY, 
        setting_value LONGTEXT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY, 
        customerName VARCHAR(255) NOT NULL, 
        phone VARCHAR(20) NOT NULL, 
        city VARCHAR(100) DEFAULT 'سوق العصر', 
        address TEXT, 
        subtotal DECIMAL(10,2) DEFAULT 0.00, 
        total DECIMAL(10,2) DEFAULT 0.00, 
        items LONGTEXT, 
        paymentMethod VARCHAR(50) DEFAULT 'عند الاستلام', 
        status VARCHAR(20) DEFAULT 'completed', 
        userId VARCHAR(50), 
        createdAt BIGINT,
        shiftId INT NULL,
        discount DECIMAL(10,2) DEFAULT 0.00,
        discountType VARCHAR(20) DEFAULT 'fixed',
        discountValue DECIMAL(10,2) DEFAULT 0.00,
        deliveryFee DECIMAL(10,2) DEFAULT 0.00,
        totalItemDiscounts DECIMAL(10,2) DEFAULT 0.00,
        subtotalBeforeDiscount DECIMAL(10,2) DEFAULT 0.00,
        finalTotal DECIMAL(10,2) DEFAULT 0.00,
        discountsMetadata LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openedById VARCHAR(50) NOT NULL,
        closedById VARCHAR(50) NULL,
        status VARCHAR(20) DEFAULT 'open',
        startTime BIGINT NOT NULL,
        endTime BIGINT NULL,
        startingCash DECIMAL(10,2) NOT NULL,
        expectedCash DECIMAL(10,2) DEFAULT 0.00,
        actualCash DECIMAL(10,2) DEFAULT 0.00,
        currentCashBalance DECIMAL(10,2) DEFAULT 0.00,
        difference DECIMAL(10,2) DEFAULT 0.00,
        discrepancyReason VARCHAR(255) NULL,
        notes TEXT NULL,
        snapshotData LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS drawer_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shiftId INT NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        createdAt BIGINT NOT NULL,
        userId VARCHAR(50) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        paymentSource VARCHAR(50) NOT NULL,
        referenceNumber VARCHAR(100) NULL,
        attachment VARCHAR(255) NULL,
        status VARCHAR(20) DEFAULT 'active',
        shiftId INT NULL,
        drawerTransactionId INT NULL,
        userId VARCHAR(50) NOT NULL,
        notes TEXT NULL,
        date BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        shiftId INT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT NOT NULL,
        createdAt BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS customer_ledger (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        orderId VARCHAR(50) NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        balanceAfter DECIMAL(10,2) NOT NULL,
        paymentMethod VARCHAR(50) NULL,
        shiftId INT NULL,
        notes TEXT NULL,
        createdAt BIGINT NOT NULL,
        createdById VARCHAR(50) NOT NULL,
        KEY idx_userId (userId),
        KEY idx_createdAt (createdAt),
        KEY idx_orderId (orderId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // التحقق من وجود عمود shiftId في جدول orders وإضافته إن لم يكن موجوداً
    try {
        $q = $pdo->query("SHOW COLUMNS FROM orders LIKE 'shiftId'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN shiftId INT NULL");
        }
    } catch (PDOException $e) {
        // إذا لم يكن الجدول موجوداً بعد، سيتم إنشاؤه في الخطوة السابقة
    }

    // التحقق من وجود عمود paymentStatus في جدول orders وإضافته إن لم يكن موجوداً
    try {
        $q = $pdo->query("SHOW COLUMNS FROM orders LIKE 'paymentStatus'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN paymentStatus VARCHAR(50) DEFAULT 'unpaid'");
            $pdo->exec("UPDATE orders SET paymentStatus = 'paid' WHERE paymentMethod NOT LIKE '%آجل%' AND status = 'completed'");
        }
    } catch (PDOException $e) {
        // تجاهل
    }

    // التحقق وإضافة أعمدة المرتجعات التفصيلية لجدول orders
    try {
        $q = $pdo->query("SHOW COLUMNS FROM orders LIKE 'returnShiftId'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN returnShiftId INT NULL");
        }
    } catch (PDOException $e) {}

    try {
        $q = $pdo->query("SHOW COLUMNS FROM orders LIKE 'returnedAt'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN returnedAt BIGINT NULL");
        }
    } catch (PDOException $e) {}

    try {
        $q = $pdo->query("SHOW COLUMNS FROM orders LIKE 'returnedAmount'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN returnedAmount DECIMAL(10,2) DEFAULT 0.00");
        }
    } catch (PDOException $e) {}

    try {
        $q = $pdo->query("SHOW COLUMNS FROM orders LIKE 'returnStatus'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN returnStatus VARCHAR(20) DEFAULT 'none'");
        }
    } catch (PDOException $e) {}

    try {
        $q = $pdo->query("SHOW COLUMNS FROM orders LIKE 'returnedById'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN returnedById VARCHAR(50) NULL");
        }
    } catch (PDOException $e) {}

    try {
        $q = $pdo->query("SHOW COLUMNS FROM orders LIKE 'returnReason'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN returnReason TEXT NULL");
        }
    } catch (PDOException $e) {}

    // هجرة حقول الخصومات والرسوم الإضافية
    $newColumns = [
        'discount' => "DECIMAL(10,2) DEFAULT 0.00",
        'discountType' => "VARCHAR(20) DEFAULT 'fixed'",
        'discountValue' => "DECIMAL(10,2) DEFAULT 0.00",
        'deliveryFee' => "DECIMAL(10,2) DEFAULT 0.00",
        'totalItemDiscounts' => "DECIMAL(10,2) DEFAULT 0.00",
        'subtotalBeforeDiscount' => "DECIMAL(10,2) DEFAULT 0.00",
        'finalTotal' => "DECIMAL(10,2) DEFAULT 0.00",
        'discountsMetadata' => "LONGTEXT NULL"
    ];

    foreach ($newColumns as $col => $definition) {
        try {
            $q = $pdo->query("SHOW COLUMNS FROM orders LIKE '$col'");
            if (!$q->fetch()) {
                $pdo->exec("ALTER TABLE orders ADD COLUMN `$col` $definition");
            }
        } catch (PDOException $e) {}
    }

    // هجرة الصلاحيات وحد إعادة الطلب
    try {
        $q = $pdo->query("SHOW COLUMNS FROM users LIKE 'permissions'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE users ADD COLUMN permissions TEXT NULL");
        }
    } catch (PDOException $e) {}

    try {
        $q = $pdo->query("SHOW COLUMNS FROM products LIKE 'reorderLevel'");
        if (!$q->fetch()) {
            $pdo->exec("ALTER TABLE products ADD COLUMN reorderLevel DECIMAL(10,2) DEFAULT 5.00");
        }
    } catch (PDOException $e) {}

    // 1.5 إصلاح تعارض ترميز الحقول (Collation Mismatch) لجميع الجداول لضمان التوافق التام
    $tablesToConvert = ['categories', 'products', 'suppliers', 'users', 'settings', 'orders', 'shifts', 'drawer_transactions', 'expenses', 'audit_logs', 'customer_ledger'];
    foreach ($tablesToConvert as $tableToConvert) {
        try {
            $pdo->exec("ALTER TABLE `$tableToConvert` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (PDOException $e) {
            // تجاهل في حال عدم وجود الجدول
        }
    }

    // 2. إضافة الأقسام الأساسية
    $categories = [
        ['id' => 'cat_supermarket', 'name' => 'سوبر ماركت', 'order' => 1],
        ['id' => 'cat_veggies', 'name' => 'خضروات طازجة', 'order' => 2],
        ['id' => 'cat_fruits', 'name' => 'فواكه موسمية', 'order' => 3],
        ['id' => 'cat_dairy', 'name' => 'ألبان وأجبان', 'order' => 4]
    ];
    $catStmt = $pdo->prepare("INSERT IGNORE INTO categories (id, name, sortOrder, isActive) VALUES (?, ?, ?, 1)");
    foreach ($categories as $cat) $catStmt->execute([$cat['id'], $cat['name'], $cat['order']]);

    // 3. إضافة حساب مدير افتراضي
    $adminPhone = '01000000000';
    $checkAdmin = $pdo->prepare("SELECT id FROM users WHERE id = 'admin_root' OR phone = ?");
    $checkAdmin->execute([$adminPhone]);
    if (!$checkAdmin->fetch()) {
        $adminPass = password_hash('admin123', PASSWORD_DEFAULT);
        $userStmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
        $userStmt->execute(['admin_root', 'مدير النظام', $adminPhone, $adminPass, 'admin', time() * 1000]);
    }

    // 4. تهيئة إعدادات سياسة المخزون الافتراضية
    $settingsDefaults = [
        ['out_of_stock_policy', 'prevent'],
        ['negative_stock_limit', '0']
    ];
    $settStmt = $pdo->prepare("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)");
    foreach ($settingsDefaults as $sett) {
        $settStmt->execute([$sett[0], $sett[1]]);
    }

    // 5. ترحيل وتهيئة الوحدات الأساسية للمنتجات القديمة إلى جدول `product_units`
    $existingProds = $pdo->query("SELECT id, name, unit, barcode, price, wholesalePrice FROM products")->fetchAll();
    $insertUnit = $pdo->prepare("INSERT IGNORE INTO product_units (id, productId, unitName, barcode, purchasePrice, salePrice, conversionFactor, isDefault, isActive) VALUES (?, ?, ?, ?, ?, ?, 1.00, 1, 1)");
    
    foreach ($existingProds as $prod) {
        $checkUnits = $pdo->prepare("SELECT COUNT(*) FROM product_units WHERE productId = ?");
        $checkUnits->execute([$prod['id']]);
        $unitsCount = (int)$checkUnits->fetchColumn();
        
        if ($unitsCount === 0) {
            $unitName = !empty($prod['unit']) ? $prod['unit'] : 'piece';
            if ($unitName === 'piece') $unitName = 'قطعة';
            else if ($unitName === 'kg') $unitName = 'كجم';
            else if ($unitName === 'gram') $unitName = 'جرام';
            
            $barcode = !empty($prod['barcode']) ? $prod['barcode'] : ('bar_' . $prod['id']);
            $unitId = 'unit_' . $prod['id'] . '_base';
            
            $insertUnit->execute([
                $unitId,
                $prod['id'],
                $unitName,
                $barcode,
                $prod['wholesalePrice'] ?: 0.00,
                $prod['price'] ?: 0.00
            ]);
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'تمت تهيئة قاعدة البيانات بنجاح.'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
