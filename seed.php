<?php
/**
 * ملف تهيئة البيانات الشامل - متجر النخبة
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // إنشاء الجداول إذا لم تكن موجودة
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS brands (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, logo TEXT NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), categoryId VARCHAR(50), images TEXT, sizes TEXT, colors TEXT, stockQuantity INT, createdAt BIGINT, salesCount INT DEFAULT 0, seoSettings TEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), address TEXT, total DECIMAL(10,2), createdAt BIGINT, status VARCHAR(50) DEFAULT 'pending')");

    // تنظيف الجداول القديمة
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("TRUNCATE TABLE brands");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. الأقسام
    $categories = [
        ['id' => 'cat_electronics', 'name' => 'إلكترونيات'],
        ['id' => 'cat_fashion', 'name' => 'أزياء'],
        ['id' => 'cat_home', 'name' => 'منزل ومطبخ'],
        ['id' => 'cat_beauty', 'name' => 'جمال وعناية']
    ];
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
    foreach ($categories as $cat) $catStmt->execute([$cat['id'], $cat['name']]);

    // 3. العلامات التجارية
    $brands = [
        ['id' => 'br_apple', 'name' => 'Apple', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'],
        ['id' => 'br_samsung', 'name' => 'Samsung', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg'],
        ['id' => 'br_sony', 'name' => 'Sony', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg'],
        ['id' => 'br_adidas', 'name' => 'Adidas', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg'],
        ['id' => 'br_nike', 'name' => 'Nike', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg']
    ];
    $brandStmt = $pdo->prepare("INSERT INTO brands (id, name, logo) VALUES (?, ?, ?)");
    foreach ($brands as $b) $brandStmt->execute([$b['id'], $b['name'], $b['logo']]);

    // 4. المنتجات
    $products = [
        [
            'id' => 'p_iphone_15',
            'name' => 'آيفون 15 برو ماكس - تيتانيوم',
            'description' => 'أقوى آيفون على الإطلاق مع تصميم من التيتانيوم.',
            'price' => 5299.00,
            'categoryId' => 'cat_electronics',
            'images' => json_encode(['https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800']),
            'sizes' => json_encode(['256GB', '512GB', '1TB']),
            'colors' => json_encode(['تيتانيوم طبيعي', 'تيتانيوم أسود']),
            'stockQuantity' => 15,
            'createdAt' => time() * 1000,
            'salesCount' => 450,
            'seoSettings' => json_encode(['metaTitle' => 'آيفون 15 برو ماكس', 'metaDescription' => 'اشترِ آيفون 15', 'metaKeywords' => 'ايفون', 'slug' => 'iphone-15-pro-max'])
        ]
    ];
    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, salesCount, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($products as $p) {
        $prodStmt->execute([$p['id'], $p['name'], $p['description'], $p['price'], $p['categoryId'], $p['images'], $p['sizes'], $p['colors'], $p['stockQuantity'], $p['createdAt'], $p['salesCount'], $p['seoSettings']]);
    }

    echo json_encode(['status' => 'success', 'message' => 'تم تهيئة قاعدة البيانات بنجاح']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
