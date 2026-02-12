
<?php
/**
 * ملف تهيئة البيانات الشامل - فاقوس ستور
 * تم التحديث لإضافة قسم السوبر ماركت مع 10 منتجات
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. إنشاء الجداول وضمان وجودها
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL,
        sortOrder INT DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        description TEXT, 
        price DECIMAL(10,2) DEFAULT 0, 
        categoryId VARCHAR(50), 
        images TEXT, 
        sizes TEXT, 
        colors TEXT, 
        stockQuantity INT DEFAULT 0, 
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

    // 2. تنظيف الجداول القديمة
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 3. إضافة الأقسام
    $categories = [
        ['id' => 'cat_supermarket', 'name' => 'سوبر ماركت', 'order' => 0],
        ['id' => 'cat_veggies', 'name' => 'خضروات طازجة', 'order' => 1],
        ['id' => 'cat_fruits', 'name' => 'فواكه موسمية', 'order' => 2],
        ['id' => 'cat_dairy', 'name' => 'ألبان وأجبان', 'order' => 3],
        ['id' => 'cat_bakery', 'name' => 'مخبوزات', 'order' => 4]
    ];
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)");
    foreach ($categories as $cat) $catStmt->execute([$cat['id'], $cat['name'], $cat['order']]);

    // 4. إضافة المنتجات
    $now = time() * 1000;
    $products = [
        // --- سوبر ماركت (10 أصناف) ---
        ['p_s1', 'أرز مصري فاخر 1كجم', 'أرز مصري عريض الحبة، منقى بعناية ومغسول وجاهز للطهي مباشرة.', 35.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800'],
        ['p_s2', 'سكر أبيض نقي 1كجم', 'سكر أبيض ناعم وعالي الجودة، مثالي للحلويات والمشروبات اليومية.', 28.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1622484211148-716598e04141?w=800'],
        ['p_s3', 'زيت عباد الشمس 1لتر', 'زيت نقي وصحي، خفيف على المعدة ومثالي لجميع أنواع الطهي والقلي.', 65.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800'],
        ['p_s4', 'مكرونة إيطالي مشكلة', 'تشكيلة من أفضل أنواع المكرونة المصنوعة من سميد القمح القاسي.', 15.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800'],
        ['p_s5', 'شاي خرز كيني فاخر', 'شاي أسود ذو نكهة قوية ولون رائع، منتقى من أفضل المزارع الكينية.', 45.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1544787210-2213d4b39353?w=800'],
        ['p_s6', 'قهوة تركي محوجة', 'خلطة مميزة من البن البرازيلي مع الهيل، محمصة بعناية لمذاق أصيل.', 55.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800'],
        ['p_s7', 'دقيق فاخر لجميع الأغراض', 'دقيق أبيض استخراج 72%، مثالي للمخبوزات والحلويات المنزلية.', 22.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'],
        ['p_s8', 'عدس أصفر منقى 500جم', 'عدس أصفر عالي الجودة، غني بالبروتين ومثالي لشوربة العدس الشتوية.', 25.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=800'],
        ['p_s9', 'تونة قطعة واحدة 140جم', 'لحم تونة خفيف محفوظ في زيت نباتي، وجبة غنية بالأوميجا 3.', 48.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800'],
        ['p_s10', 'سمن طبيعي نيوزيلندي', 'سمن طبيعي 100% يضيف نكهة مميزة ورائحة زكية لجميع أطباقك.', 180.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?w=800'],

        // --- الخضروات ---
        ['p_v1', 'طماطم بلدي طازجة', 'طماطم حمراء ناضجة طازجة من الحقل.', 15.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
        ['p_v2', 'خيار بلدي مقرمش', 'خيار طازج يومياً، مثالي للسلطات.', 12.00, 'cat_veggies', 'https://images.unsplash.com/photo-1449333255014-24e0da978f91?w=800']
    ];

    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, stockQuantity, createdAt, salesCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($products as $p) {
        $prodStmt->execute([$p[0], $p[1], $p[2], $p[3], $p[4], json_encode([$p[5]]), 100, $now, rand(10, 50)]);
    }

    echo json_encode(['status' => 'success', 'message' => 'تم إضافة 10 منتجات سوبر ماركت بنجاح!'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
