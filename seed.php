
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
        createdAt BIGINT
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY, 
        setting_value LONGTEXT
    )");

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
    $checkAdmin = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
    $checkAdmin->execute([$adminPhone]);
    if (!$checkAdmin->fetch()) {
        $adminPass = password_hash('admin123', PASSWORD_DEFAULT);
        $userStmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
        $userStmt->execute(['admin_root', 'مدير النظام', $adminPhone, $adminPass, 'admin', time() * 1000]);
    }

    echo json_encode(['status' => 'success', 'message' => 'تمت تهيئة قاعدة البيانات بنجاح.'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
