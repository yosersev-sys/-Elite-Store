
<?php
/**
 * ملف تهيئة البيانات الشامل - فاقوس ستور
 * تم التحديث لدعم إعادة ترتيب الأقسام
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. إنشاء الجداول وضمان وجودها مع الأعمدة الجديدة
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL,
        sortOrder INT DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        logo TEXT NOT NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10,2), 
        categoryId VARCHAR(50), 
        images TEXT, 
        sizes TEXT, 
        colors TEXT, 
        stockQuantity INT, 
        createdAt BIGINT, 
        salesCount INT DEFAULT 0, 
        seoSettings TEXT,
        barcode VARCHAR(100)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY, 
        customerName VARCHAR(255), 
        phone VARCHAR(50), 
        city VARCHAR(100), 
        address TEXT, 
        total DECIMAL(10,2), 
        createdAt BIGINT, 
        status VARCHAR(50) DEFAULT 'pending'
    )");

    // 2. تنظيف الجداول القديمة (اختياري - يفضل التعليق إذا كنت تملك بيانات حقيقية)
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("TRUNCATE TABLE brands");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 3. إضافة الأقسام مع ترتيب افتراضي
    $categories = [
        ['id' => 'cat_veggies', 'name' => 'خضروات طازجة', 'order' => 1],
        ['id' => 'cat_fruits', 'name' => 'فواكه موسمية', 'order' => 2],
        ['id' => 'cat_dairy', 'name' => 'ألبان وأجبان', 'order' => 3],
        ['id' => 'cat_bakery', 'name' => 'مخبوزات', 'order' => 4]
    ];
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)");
    foreach ($categories as $cat) $catStmt->execute([$cat['id'], $cat['name'], $cat['order']]);

    // 4. إضافة منتجات تجريبية (عينة)
    $now = time() * 1000;
    $pdo->exec("INSERT INTO products (id, name, description, price, categoryId, images, stockQuantity, createdAt, sortOrder) VALUES 
        ('p1', 'طماطم بلدي', 'طماطم طازجة من المزرعة', 5.50, 'cat_veggies', '[\"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800\"]', 100, $now, 1)");

    echo json_encode(['status' => 'success', 'message' => 'تم تحديث بنية قاعدة البيانات وتهيئة الأقسام بنجاح!'], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
