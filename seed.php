
<?php
/**
 * ملف تهيئة البيانات الشامل - فاقوس ستور
 * تم التحديث لإضافة 10 منتجات في قسم الفواكه
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

    // 2. تنظيف الجداول القديمة للبدء ببيانات جديدة
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
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

    // 4. إضافة 10 منتجات في قسم الفواكه ومنتج واحد في الخضروات
    $now = time() * 1000;
    $products = [
        ['p_f1', 'تفاح أحمر إيطالي', 'تفاح إيطالي منتقى بعناية، يتميز بقرمشته وحلاوته الطبيعية.', 12.50, 'cat_fruits', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=800'],
        ['p_f2', 'موز بلدي فاخر', 'موز بلدي طازج، غني بالبوتاسيوم ومثالي للرياضيين والأطفال.', 8.00, 'cat_fruits', 'https://images.unsplash.com/photo-1571771894821-ad99026a0947?w=800'],
        ['p_f3', 'برتقال صيفي عصير', 'برتقال صيفي غني بالعصارة، مثالي لتحضير عصير فريش في الصباح.', 5.75, 'cat_fruits', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800'],
        ['p_f4', 'عنب أحمر سكري', 'عنب أحمر طازج بدون بذور، يتميز بمذاق سكري رائع.', 18.00, 'cat_fruits', 'https://images.unsplash.com/photo-1537640538966-79f369b41e8f?w=800'],
        ['p_f5', 'فراولة طازجة', 'فراولة حمراء ناضجة، منتقاة من أفضل المزارع للحلويات والعصائر.', 14.25, 'cat_fruits', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800'],
        ['p_f6', 'مانجو عويسي', 'مانجو عويسي فاخرة، رائحة زكية وطعم كريمي لا يقاوم.', 35.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800'],
        ['p_f7', 'بطيخ أحمر كبير', 'بطيخ أحمر منعش، الحجم يتراوح بين 6-8 كيلو، منتقى بعناية.', 25.00, 'cat_fruits', 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800'],
        ['p_f8', 'رمان سكري بلدي', 'رمان بلدي فاخر، حبات حمراء ياقوتية غنية بمضادات الأكسدة.', 16.50, 'cat_fruits', 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=800'],
        ['p_f9', 'خوخ سكري طازج', 'خوخ سكري متميز بطعمه الرائع وقوامه الطري، طازج يومياً.', 22.00, 'cat_fruits', 'https://images.unsplash.com/photo-1628489648397-315181057e44?w=800'],
        ['p_f10', 'كرز أحمر مستورد', 'كرز أحمر فاخر، جودة عالمية وطعم لا ينسى، مثالي للتقديم.', 48.00, 'cat_fruits', 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800'],
        ['p_v1', 'طماطم بلدي', 'طماطم طازجة من المزرعة، مناسبة للسلطات والطبخ.', 6.50, 'cat_veggies', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800']
    ];

    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, stockQuantity, createdAt, salesCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($products as $p) {
        $prodStmt->execute([
            $p[0], 
            $p[1], 
            $p[2], 
            $p[3], 
            $p[4], 
            json_encode([$p[5]]), 
            50, // الكمية الافتراضية
            $now, 
            rand(5, 50) // مبيعات عشوائية للعرض
        ]);
    }

    echo json_encode(['status' => 'success', 'message' => 'تم إضافة 10 منتجات فواكه بنجاح! يرجى تحديث الصفحة الرئيسية.'], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
