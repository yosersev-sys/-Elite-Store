<?php
/**
 * ملف تهيئة البيانات الشامل - متجر النخبة
 * هذا الملف يقوم بإنشاء 12 منتجاً احترافياً في قاعدة البيانات
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. إنشاء الجداول وضمان وجودها
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS brands (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, logo TEXT NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), categoryId VARCHAR(50), images TEXT, sizes TEXT, colors TEXT, stockQuantity INT, createdAt BIGINT, salesCount INT DEFAULT 0, seoSettings TEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), address TEXT, total DECIMAL(10,2), createdAt BIGINT, status VARCHAR(50) DEFAULT 'pending')");

    // 2. تنظيف الجداول القديمة لضمان بيانات دقيقة
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("TRUNCATE TABLE brands");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 3. إضافة الأقسام
    $categories = [
        ['id' => 'cat_electronics', 'name' => 'إلكترونيات'],
        ['id' => 'cat_fashion', 'name' => 'أزياء'],
        ['id' => 'cat_home', 'name' => 'منزل ومطبخ'],
        ['id' => 'cat_beauty', 'name' => 'جمال وعناية']
    ];
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
    foreach ($categories as $cat) $catStmt->execute([$cat['id'], $cat['name']]);

    // 4. إضافة العلامات التجارية
    $brands = [
        ['id' => 'br_apple', 'name' => 'Apple', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'],
        ['id' => 'br_samsung', 'name' => 'Samsung', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg'],
        ['id' => 'br_sony', 'name' => 'Sony', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg'],
        ['id' => 'br_adidas', 'name' => 'Adidas', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg'],
        ['id' => 'br_nike', 'name' => 'Nike', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg'],
        ['id' => 'br_dyson', 'name' => 'Dyson', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Dyson_logo.svg'],
        ['id' => 'br_nespresso', 'name' => 'Nespresso', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Nespresso_logo.svg']
    ];
    $brandStmt = $pdo->prepare("INSERT INTO brands (id, name, logo) VALUES (?, ?, ?)");
    foreach ($brands as $b) $brandStmt->execute([$b['id'], $b['name'], $b['logo']]);

    // 5. إضافة الـ 12 منتجاً الاحترافية
    $now = time() * 1000;
    $products = [
        // قسم الإلكترونيات (4 منتجات)
        [
            'id' => 'p_1', 'name' => 'آيفون 15 برو ماكس - تيتانيوم',
            'desc' => 'أقوى آيفون على الإطلاق مع شريحة A17 Pro وكاميرا متطورة.',
            'price' => 5299.00, 'cat' => 'cat_electronics', 'stock' => 12, 'sales' => 850,
            'img' => ['https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800'],
            'sizes' => ['256GB', '512GB', '1TB'], 'colors' => ['أسود', 'طبيعي'],
            'slug' => 'iphone-15-pro-max'
        ],
        [
            'id' => 'p_2', 'name' => 'سامسونج S24 الترا - AI',
            'desc' => 'هاتف الذكاء الاصطناعي الأول مع قلم S Pen مدمج وشاشة مسطحة.',
            'price' => 4699.00, 'cat' => 'cat_electronics', 'stock' => 8, 'sales' => 620,
            'img' => ['https://images.unsplash.com/photo-1707230102120-d66763a8da31?w=800'],
            'sizes' => ['256GB', '512GB'], 'colors' => ['تيتانيوم رمادي', 'أسود'],
            'slug' => 'samsung-s24-ultra'
        ],
        [
            'id' => 'p_3', 'name' => 'ماك بوك اير M3 الجديد',
            'desc' => 'أداء مذهل وتصميم فائق النحافة مع شريحة ابل M3 الجديدة.',
            'price' => 4899.00, 'cat' => 'cat_electronics', 'stock' => 5, 'sales' => 140,
            'img' => ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'],
            'sizes' => ['8GB RAM', '16GB RAM'], 'colors' => ['فضي', 'سبيس جراي'],
            'slug' => 'macbook-air-m3'
        ],
        [
            'id' => 'p_4', 'name' => 'سماعات سوني WH-1000XM5',
            'desc' => 'رائدة عزل الضجيج في العالم مع جودة صوت استثنائية.',
            'price' => 1349.00, 'cat' => 'cat_electronics', 'stock' => 20, 'sales' => 980,
            'img' => ['https://images.unsplash.com/photo-1670057037124-710892a0966a?w=800'],
            'sizes' => ['One Size'], 'colors' => ['أسود', 'بيج'],
            'slug' => 'sony-wh1000xm5'
        ],
        // قسم الأزياء (3 منتجات)
        [
            'id' => 'p_5', 'name' => 'حذاء نايكي إير جوردن 1',
            'desc' => 'التصميم الكلاسيكي الذي لا يغيب عن الساحة، راحة وأناقة رياضية.',
            'price' => 749.00, 'cat' => 'cat_fashion', 'stock' => 15, 'sales' => 1200,
            'img' => ['https://images.unsplash.com/photo-1584906332183-f25c04879612?w=800'],
            'sizes' => ['41', '42', '43', '44'], 'colors' => ['أبيض/أحمر', 'أسود/رمادي'],
            'slug' => 'nike-air-jordan-1'
        ],
        [
            'id' => 'p_6', 'name' => 'تيشيرت أديداس أوريجينالز',
            'desc' => 'قطن عالي الجودة مع شعار أديداس الكلاسيكي المريح.',
            'price' => 159.00, 'cat' => 'cat_fashion', 'stock' => 50, 'sales' => 450,
            'img' => ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
            'sizes' => ['S', 'M', 'L', 'XL'], 'colors' => ['أبيض', 'أسود', 'كحلي'],
            'slug' => 'adidas-original-tee'
        ],
        [
            'id' => 'p_7', 'name' => 'نظارة ريبان كلاسيك',
            'desc' => 'حماية كاملة من الشمس مع تصميم إطارات أيقوني.',
            'price' => 699.00, 'cat' => 'cat_fashion', 'stock' => 25, 'sales' => 310,
            'img' => ['https://images.unsplash.com/photo-1511499767390-a8a19759900e?w=800'],
            'sizes' => ['Standard'], 'colors' => ['ذهبي', 'أسود'],
            'slug' => 'rayban-classic'
        ],
        // قسم المنزل (3 منتجات)
        [
            'id' => 'p_8', 'name' => 'ماكينة قهوة نسبريسو فيرتو',
            'desc' => 'قهوة بلمسة زر واحدة مع رغوة غنية وجودة باريستا.',
            'price' => 949.00, 'cat' => 'cat_home', 'stock' => 10, 'sales' => 540,
            'img' => ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800'],
            'sizes' => ['Compact'], 'colors' => ['أسود', 'كروم'],
            'slug' => 'nespresso-vertuo-next'
        ],
        [
            'id' => 'p_9', 'name' => 'قلاية فيليبس الهوائية XXL',
            'desc' => 'طعام صحي ومقرمش بدون زيت مع سعة عائلية كبيرة.',
            'price' => 1199.00, 'cat' => 'cat_home', 'stock' => 7, 'sales' => 890,
            'img' => ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800'],
            'sizes' => ['XXL'], 'colors' => ['أسود'],
            'slug' => 'philips-airfryer-xxl'
        ],
        [
            'id' => 'p_10', 'name' => 'محضرة طعام كيتشن إيد',
            'desc' => 'الرفيق المثالي لكل شيف في المطبخ، قوة ومتانة.',
            'price' => 2499.00, 'cat' => 'cat_home', 'stock' => 4, 'sales' => 120,
            'img' => ['https://images.unsplash.com/photo-1594385208974-2e75f9d8ad48?w=800'],
            'sizes' => ['4.8L'], 'colors' => ['أحمر', 'كريمي', 'فضي'],
            'slug' => 'kitchenaid-artisan'
        ],
        // قسم التجميل (2 منتج)
        [
            'id' => 'p_11', 'name' => 'عطر بلو دو شانيل - بارفيوم',
            'desc' => 'عطر رجالي فخم يعبر عن الحرية والثقة بالنفس.',
            'price' => 649.00, 'cat' => 'cat_beauty', 'stock' => 30, 'sales' => 2100,
            'img' => ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800'],
            'sizes' => ['100ml'], 'colors' => ['أزرق داكن'],
            'slug' => 'bleu-de-chanel'
        ],
        [
            'id' => 'p_12', 'name' => 'مصفف شعر دايسون ايرواب',
            'desc' => 'تصفيف احترافي للشعر بدون حرارة زائدة، تجفيف وتجعيد.',
            'price' => 2299.00, 'cat' => 'cat_beauty', 'stock' => 6, 'sales' => 180,
            'img' => ['https://images.unsplash.com/photo-1652438318617-660993557e93?w=800'],
            'sizes' => ['Complete Set'], 'colors' => ['نيكل/نحاسي'],
            'slug' => 'dyson-airwrap-styler'
        ]
    ];

    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, salesCount, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($products as $p) {
        $seo = [
            'metaTitle' => $p['name'] . ' | متجر النخبة',
            'metaDescription' => $p['desc'],
            'metaKeywords' => $p['name'] . ', تسوق, عروض',
            'slug' => $p['slug']
        ];

        $prodStmt->execute([
            $p['id'], $p['name'], $p['desc'], $p['price'], $p['cat'],
            json_encode($p['img']), json_encode($p['sizes']), json_encode($p['colors']),
            $p['stock'], $now, $p['sales'], json_encode($seo)
        ]);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'تم تهيئة المتجر بـ 12 منتجاً احترافياً بنجاح!',
        'details' => [
            'categories' => count($categories),
            'brands' => count($brands),
            'products' => count($products)
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
