
<?php
/**
 * ملف تهيئة البيانات الشامل (Master Seed) - فاقوس ستور
 * يحتوي على 30 منتجاً موزعة على الأقسام الرئيسية
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. التأكد من وجود الجداول
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

    // 2. مسح البيانات القديمة لبناء المتجر الشامل
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 3. إضافة الأقسام الرئيسية
    $categories = [
        ['id' => 'cat_supermarket', 'name' => 'سوبر ماركت', 'order' => 1],
        ['id' => 'cat_veggies', 'name' => 'خضروات طازجة', 'order' => 2],
        ['id' => 'cat_fruits', 'name' => 'فواكه موسمية', 'order' => 3],
        ['id' => 'cat_dairy', 'name' => 'ألبان وأجبان', 'order' => 4]
    ];
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)");
    foreach ($categories as $cat) $catStmt->execute([$cat['id'], $cat['name'], $cat['order']]);

    // 4. قائمة المنتجات الشاملة (30 منتج)
    $now = time() * 1000;
    $products = [
        // --- السوبر ماركت (10 منتجات) ---
        ['p_s1', 'أرز مصري فاخر 1كجم', 'أرز عريض الحبة منقى ومغسول.', 35.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800'],
        ['p_s2', 'سكر أبيض نقي 1كجم', 'سكر ناصع البياض للحلويات والمشروبات.', 28.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1622484211148-716598e04141?w=800'],
        ['p_s3', 'زيت عباد الشمس 1لتر', 'زيت نقي خفيف ومثالي للقلي والطبخ.', 65.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800'],
        ['p_s4', 'مكرونة إيطالي 400جم', 'مكرونة فاخرة مصنوعة من السميد القاسي.', 15.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800'],
        ['p_s5', 'شاي كيني ثقيل', 'شاي أسود ذو نكهة قوية ولون رائع.', 45.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1544787210-2213d4b39353?w=800'],
        ['p_s6', 'بن برازيلي محوج', 'قهوة محمصة بعناية مع الهيل.', 55.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800'],
        ['p_s7', 'دقيق فاخر 1كجم', 'دقيق أبيض مخصص للمخبوزات والحلويات.', 22.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'],
        ['p_s8', 'عدس أصفر منقى', 'عدس درجة أولى سريع الطهي.', 25.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=800'],
        ['p_s9', 'تونة قطع سهلة الفتح', 'لحم تونة خفيف في زيت نباتي.', 48.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800'],
        ['p_s10', 'سمن طبيعي فاخر', 'سمن ذو رائحة زكية وطعم أصيل.', 180.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?w=800'],

        // --- الخضروات (10 منتجات) ---
        ['p_v1', 'طماطم بلدي', 'طماطم حمراء طازجة يومياً.', 15.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
        ['p_v2', 'خيار مقرمش', 'خيار بلدي طازج من المزرعة.', 12.00, 'cat_veggies', 'https://images.unsplash.com/photo-1449333255014-24e0da978f91?w=800'],
        ['p_v3', 'بطاطس تحمير', 'بطاطس اسبونتا مخصصة للقلي.', 20.00, 'cat_veggies', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800'],
        ['p_v4', 'بصل أحمر', 'بصل قوي النكهة للجودة العالية.', 18.00, 'cat_veggies', 'https://images.unsplash.com/photo-1508747703725-7197771375a0?w=800'],
        ['p_v5', 'فلفل ألوان', 'فلفل رومي مشكل غني بالفيتامينات.', 45.00, 'cat_veggies', 'https://images.unsplash.com/photo-1566232392379-afd9298e6a46?w=800'],
        ['p_v6', 'باذنجان رومي', 'باذنجان طازج للحشو أو القلي.', 10.00, 'cat_veggies', 'https://images.unsplash.com/photo-1510440730032-15f206126685?w=800'],
        ['p_v7', 'كوسة خضراء', 'كوسة صغيرة طازجة للحشو.', 15.00, 'cat_veggies', 'https://images.unsplash.com/photo-1557844352-761f2565b576?w=800'],
        ['p_v8', 'جزر سكري', 'جزر برتقالي مقرمش ومغسول.', 12.00, 'cat_veggies', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800'],
        ['p_v9', 'فلفل حامي', 'فلفل أخضر حار جداً طازج.', 25.00, 'cat_veggies', 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800'],
        ['p_v10', 'ليمون بنزهير', 'ليمون حامض غني بالعصارة.', 30.00, 'cat_veggies', 'https://images.unsplash.com/photo-1590505681531-f67551444e33?w=800'],

        // --- الفواكه (10 منتجات) ---
        ['p_f1', 'تفاح أحمر إيطالي', 'تفاح مقرمش وحلو المذاق.', 65.00, 'cat_fruits', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=800'],
        ['p_f2', 'موز بلدي', 'موز طازج غني بالبوتاسيوم.', 25.00, 'cat_fruits', 'https://images.unsplash.com/photo-1571771894821-ad99026a0947?w=800'],
        ['p_f3', 'برتقال عصير', 'برتقال صيفي غني بالعصير.', 15.00, 'cat_fruits', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800'],
        ['p_f4', 'عنب سكري', 'عنب بدون بذور طازج.', 45.00, 'cat_fruits', 'https://images.unsplash.com/photo-1537640538966-79f369b41e8f?w=800'],
        ['p_f5', 'فراولة فريش', 'فراولة حمراء منتقاة بعناية.', 35.00, 'cat_fruits', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800'],
        ['p_f6', 'مانجو عويسي', 'ملك المانجو بمذاق رائع.', 85.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800'],
        ['p_f7', 'بطيخ أحمر', 'بطيخ منعش بارد.', 75.00, 'cat_fruits', 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800'],
        ['p_f8', 'رمان منفلوطي', 'حب رمان أحمر ياقوتي.', 30.00, 'cat_fruits', 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=800'],
        ['p_f9', 'خوخ سكري', 'خوخ طازج حلو المذاق.', 55.00, 'cat_fruits', 'https://images.unsplash.com/photo-1628489648397-315181057e44?w=800'],
        ['p_f10', 'كرز أحمر', 'كرز فاخر مستورد.', 150.00, 'cat_fruits', 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800']
    ];

    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, stockQuantity, createdAt, salesCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($products as $p) {
        $prodStmt->execute([$p[0], $p[1], $p[2], $p[3], $p[4], json_encode([$p[5]]), 100, $now, rand(10, 100)]);
    }

    echo json_encode(['status' => 'success', 'message' => 'تم إعادة بناء المتجر بالكامل بـ 30 منتجاً في جميع الأقسام!'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
