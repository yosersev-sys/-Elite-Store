
<?php
/**
 * ملف تهيئة البيانات الشامل - فاقوس ستور
 * تم التحديث لإضافة 10 منتجات في قسم الخضروات و 10 في قسم الفواكه
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

    // 4. إضافة المنتجات (10 فواكه + 11 خضروات)
    $now = time() * 1000;
    $products = [
        // --- الفواكه ---
        ['p_f1', 'تفاح أحمر إيطالي', 'تفاح إيطالي منتقى بعناية، يتميز بقرمشته وحلاوته الطبيعية.', 65.00, 'cat_fruits', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=800'],
        ['p_f2', 'موز بلدي فاخر', 'موز بلدي طازج، غني بالبوتاسيوم ومثالي للرياضيين والأطفال.', 25.00, 'cat_fruits', 'https://images.unsplash.com/photo-1571771894821-ad99026a0947?w=800'],
        ['p_f3', 'برتقال صيفي عصير', 'برتقال صيفي غني بالعصارة، مثالي لتحضير عصير فريش في الصباح.', 15.00, 'cat_fruits', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800'],
        ['p_f4', 'عنب أحمر سكري', 'عنب أحمر طازج بدون بذور، يتميز بمذاق سكري رائع.', 45.00, 'cat_fruits', 'https://images.unsplash.com/photo-1537640538966-79f369b41e8f?w=800'],
        ['p_f5', 'فراولة طازجة', 'فراولة حمراء ناضجة، منتقاة من أفضل المزارع للحلويات والعصائر.', 35.00, 'cat_fruits', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800'],
        ['p_f6', 'مانجو عويسي', 'مانجو عويسي فاخرة، رائحة زكية وطعم كريمي لا يقاوم.', 85.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800'],
        ['p_f7', 'بطيخ أحمر كبير', 'بطيخ أحمر منعش، الحجم يتراوح بين 6-8 كيلو، منتقى بعناية.', 75.00, 'cat_fruits', 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800'],
        ['p_f8', 'رمان سكري بلدي', 'رمان بلدي فاخر، حبات حمراء ياقوتية غنية بمضادات الأكسدة.', 30.00, 'cat_fruits', 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=800'],
        ['p_f9', 'خوخ سكري طازج', 'خوخ سكري متميز بطعمه الرائع وقوامه الطري، طازج يومياً.', 55.00, 'cat_fruits', 'https://images.unsplash.com/photo-1628489648397-315181057e44?w=800'],
        ['p_f10', 'كرز أحمر مستورد', 'كرز أحمر فاخر، جودة عالمية وطعم لا ينسى، مثالي للتقديم.', 150.00, 'cat_fruits', 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800'],
        
        // --- الخضروات (11 صنف) ---
        ['p_v1', 'طماطم بلدي فاخرة', 'طماطم حمراء ناضجة طازجة من الحقل مباشرة، مثالية للسلطات والطبخ.', 15.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
        ['p_v2', 'خيار بلدي طازج', 'خيار بلدي مقرمش وطازج يومياً، مثالي للسلطات والمقبلات المتميزة.', 12.00, 'cat_veggies', 'https://images.unsplash.com/photo-1449333255014-24e0da978f91?w=800'],
        ['p_v3', 'بطاطس تحمير سبونتا', 'بطاطس منتقاة بعناية للتحمير، مقرمشة من الخارج وطرية جداً من الداخل.', 20.00, 'cat_veggies', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800'],
        ['p_v4', 'بصل أحمر فاخر', 'بصل أحمر طازج ذو نكهة قوية وجودة عالية، مثالي للسلطات والطهي اليومي.', 18.00, 'cat_veggies', 'https://images.unsplash.com/photo-1508747703725-7197771375a0?w=800'],
        ['p_v5', 'فلفل ألوان مشكل', 'فلفل رومي ألوان (أحمر، أصفر، أخضر) غني بالفيتامينات لإضافة بهجة لأطباقك.', 45.00, 'cat_veggies', 'https://images.unsplash.com/photo-1566232392379-afd9298e6a46?w=800'],
        ['p_v6', 'باذنجان رومي كبير', 'باذنجان رومي طازج، مثالي للمسقعة والقلي والبابا غنوج بمذاقه الرائع.', 10.00, 'cat_veggies', 'https://images.unsplash.com/photo-1510440730032-15f206126685?w=800'],
        ['p_v7', 'كوسة خضراء طازجة', 'كوسة طازجة صغيرة الحجم، مثالية للحشو والطهي الصحي بمذاق سكري.', 15.00, 'cat_veggies', 'https://images.unsplash.com/photo-1557844352-761f2565b576?w=800'],
        ['p_v8', 'جزر سكري مغسول', 'جزر برتقالي زاهي، طعم سكري ومقرمش، مغسول وجاهز للاستخدام الفوري.', 12.00, 'cat_veggies', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800'],
        ['p_v9', 'فلفل حامي بلدي', 'فلفل أخضر حامي جداً، طازج ويضيف نكهة قوية وحريفة لأطباقك المميزة.', 25.00, 'cat_veggies', 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800'],
        ['p_v10', 'ليمون بنزهير طازج', 'ليمون أخضر وأصفر حامض جداً، غني بفيتامين سي، مثالي لكل الأطباق والعصائر.', 30.00, 'cat_veggies', 'https://images.unsplash.com/photo-1590505681531-f67551444e33?w=800'],
        ['p_v11', 'ثوم بلدي منشف', 'ثوم بلدي ذو فصوص قوية ورائحة نفاذة، أساس كل طبخة مصرية أصيلة.', 40.00, 'cat_veggies', 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=800']
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
            100, // زيادة كمية المخزون الافتراضية
            $now, 
            rand(10, 100) // مبيعات عشوائية أعلى للعرض
        ]);
    }

    echo json_encode([
        'status' => 'success', 
        'message' => 'تم تحديث المتجر بنجاح! تم إضافة 11 صنف من الخضروات و 10 أصناف من الفواكه بالأسعار الجديدة.'
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
