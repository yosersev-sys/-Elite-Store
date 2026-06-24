<?php
/**
 * ملف إعادة ضبط قاعدة البيانات بالكامل (Database Reset) - سوق العصر
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// لمنع التشغيل غير المقصود، يجب تمرير معلمة تأكيد
if (($_GET['confirm'] ?? '') !== 'yes') {
    http_response_code(400);
    echo json_encode([
        'status' => 'error', 
        'message' => 'يرجى تأكيد العملية بتمرير confirm=yes في الرابط (مثال: reset.php?confirm=yes)'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // 1. إيقاف التحقق من المفاتيح الأجنبية مؤقتاً لحذف الجداول بأمان
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // 2. حذف الجداول الحالية إن وجدت
    $tables = ['orders', 'products', 'categories', 'suppliers', 'users', 'settings'];
    foreach ($tables as $table) {
        $pdo->exec("DROP TABLE IF EXISTS `$table`");
    }

    // 3. إعادة تفعيل التحقق من المفاتيح الأجنبية
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // 4. إنشاء الجداول من جديد
    $pdo->exec("CREATE TABLE categories (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL,
        image LONGTEXT,
        isActive TINYINT(1) DEFAULT 1,
        sortOrder INT DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE products (
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

    $pdo->exec("CREATE TABLE suppliers (
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

    $pdo->exec("CREATE TABLE users (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        phone VARCHAR(20) UNIQUE NOT NULL, 
        password VARCHAR(255) NOT NULL, 
        role VARCHAR(20) DEFAULT 'user', 
        createdAt BIGINT
    )");

    $pdo->exec("CREATE TABLE settings (
        setting_key VARCHAR(100) PRIMARY KEY, 
        setting_value LONGTEXT
    )");

    $pdo->exec("CREATE TABLE orders (
        id VARCHAR(50) PRIMARY KEY, 
        customerName VARCHAR(255) NOT NULL, 
        phone VARCHAR(20) NOT NULL, 
        city VARCHAR(100) DEFAULT 'سوق العصر', 
        address TEXT, 
        subtotal DECIMAL(10,2) DEFAULT 0, 
        total DECIMAL(10,2) DEFAULT 0, 
        items LONGTEXT, 
        paymentMethod VARCHAR(50) DEFAULT 'عند الاستلام', 
        status VARCHAR(20) DEFAULT 'completed', 
        userId VARCHAR(50), 
        createdAt BIGINT
    )");

    // 5. إضافة الأقسام الأساسية الافتراضية
    $categories = [
        ['id' => 'cat_supermarket', 'name' => 'سوبر ماركت', 'order' => 1],
        ['id' => 'cat_veggies', 'name' => 'خضروات طازجة', 'order' => 2],
        ['id' => 'cat_fruits', 'name' => 'فواكه موسمية', 'order' => 3],
        ['id' => 'cat_dairy', 'name' => 'ألبان وأجبان', 'order' => 4]
    ];
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name, sortOrder, isActive) VALUES (?, ?, ?, 1)");
    foreach ($categories as $cat) {
        $catStmt->execute([$cat['id'], $cat['name'], $cat['order']]);
    }

    // 6. إضافة حساب المدير الافتراضي
    $adminPhone = '01000000000';
    $adminPass = password_hash('admin123', PASSWORD_DEFAULT);
    $userStmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
    $userStmt->execute(['admin_root', 'مدير النظام', $adminPhone, $adminPass, 'admin', time() * 1000]);

    echo json_encode([
        'status' => 'success', 
        'message' => 'تم تصفير قاعدة البيانات بالكامل وإعادة تهيئة الجداول والأدمن الافتراضي بنجاح.'
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'فشلت عملية إعادة الضبط.', 
        'debug' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
