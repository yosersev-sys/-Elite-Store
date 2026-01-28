<?php
/**
 * ملف تهيئة البيانات الشامل - متجر النخبة
 * قم بزيارة هذا الملف في المتصفح مرة واحدة لإدخال البيانات الأساسية في قاعدة البيانات
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. تنظيف الجداول القديمة (اختياري - لضمان بداية نظيفة)
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. الأقسام الافتراضية
    $categories = [
        ['id' => 'cat_electronics', 'name' => 'إلكترونيات'],
        ['id' => 'cat_fashion', 'name' => 'أزياء'],
        ['id' => 'cat_home', 'name' => 'منزل ومطبخ'],
        ['id' => 'cat_beauty', 'name' => 'جمال وعناية']
    ];

    $catStmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
    foreach ($categories as $cat) {
        $catStmt->execute([$cat['id'], $cat['name']]);
    }

    // 3. المنتجات الافتراضية الاحترافية
    $products = [
        [
            'id' => 'p_iphone_15',
            'name' => 'آيفون 15 برو ماكس - تيتانيوم',
            'description' => 'أقوى آيفون على الإطلاق مع تصميم من التيتانيوم القوي والخفيف، وشريحة A17 Pro الجبارة للألعاب والأداء المهني.',
            'price' => 5299.00,
            'categoryId' => 'cat_electronics',
            'images' => json_encode(['https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800']),
            'sizes' => json_encode(['256GB', '512GB', '1TB']),
            'colors' => json_encode(['تيتانيوم طبيعي', 'تيتانيوم أسود', 'تيتانيوم أزرق']),
            'stockQuantity' => 15,
            'createdAt' => time() * 1000,
            'salesCount' => 450,
            'seoSettings' => json_encode(['metaTitle' => 'آيفون 15 برو ماكس | متجر النخبة', 'metaDescription' => 'اشترِ آيفون 15 برو ماكس بأفضل سعر في السعودية.', 'metaKeywords' => 'ايفون, ابل, جوال, تكنولوجيا', 'slug' => 'iphone-15-pro-max'])
        ],
        [
            'id' => 'p_macbook_m3',
            'name' => 'ماك بوك اير M3 - 13 بوصة',
            'description' => 'جهاز اللابتوب الأكثر نحافة وخفة في العالم، الآن مع قوة شريحة M3 وبطارية تدوم حتى 18 ساعة.',
            'price' => 4899.00,
            'categoryId' => 'cat_electronics',
            'images' => json_encode(['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800']),
            'sizes' => json_encode(['8GB RAM', '16GB RAM']),
            'colors' => json_encode(['سبيس جراي', 'فضي', 'سماء الليل']),
            'stockQuantity' => 8,
            'createdAt' => time() * 1000,
            'salesCount' => 120,
            'seoSettings' => json_encode(['metaTitle' => 'ماك بوك اير M3 الجديد', 'metaDescription' => 'أداء مذهل وتصميم رائع مع شريحة M3.', 'metaKeywords' => 'ماك بوك, ابل, لابتوب', 'slug' => 'macbook-air-m3'])
        ],
        [
            'id' => 'p_nespresso',
            'name' => 'ماكينة نسبريسو فيرتو لاين',
            'description' => 'استمتع بقهوة ذات جودة عالية بلمسة زر واحدة. تقنية استخلاص القهوة المتطورة للحصول على كريمة غنية.',
            'price' => 899.00,
            'categoryId' => 'cat_home',
            'images' => json_encode(['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&q=80&w=800']),
            'sizes' => json_encode(['Compact', 'Deluxe']),
            'colors' => json_encode(['أسود مات', 'كروم']),
            'stockQuantity' => 25,
            'createdAt' => time() * 1000,
            'salesCount' => 310,
            'seoSettings' => json_encode(['metaTitle' => 'ماكينة قهوة نسبريسو', 'metaDescription' => 'أفضل ماكينة قهوة للمنزل والمكتب.', 'metaKeywords' => 'قهوة, نسبريسو, مطبخ', 'slug' => 'nespresso-vertuo'])
        ],
        [
            'id' => 'p_chanel_blue',
            'name' => 'عطر بلو دو شانيل - بارفيوم',
            'description' => 'عطر خشبي عطري مكثف يعبر عن الرجل الواثق والمستقل. ثبات يدوم طويلاً وجاذبية لا تقاوم.',
            'price' => 650.00,
            'categoryId' => 'cat_beauty',
            'images' => json_encode(['https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800']),
            'sizes' => json_encode(['50ml', '100ml', '150ml']),
            'colors' => json_encode(['أزرق داكن']),
            'stockQuantity' => 40,
            'createdAt' => time() * 1000,
            'salesCount' => 890,
            'seoSettings' => json_encode(['metaTitle' => 'عطر بلو دو شانيل الأصلي', 'metaDescription' => 'أفخم العطور الرجالية العالمية.', 'metaKeywords' => 'عطر, شانيل, جمال', 'slug' => 'bleu-de-chanel'])
        ],
        [
            'id' => 'p_sneakers_air',
            'name' => 'حذاء نايكي إير جوردن 1',
            'description' => 'أيقونة الملاعب والشوارع. تصميم كلاسيكي يجمع بين الراحة والأناقة الرياضية الفائقة.',
            'price' => 749.00,
            'categoryId' => 'cat_fashion',
            'images' => json_encode(['https://images.unsplash.com/photo-1584906332183-f25c04879612?auto=format&fit=crop&q=80&w=800']),
            'sizes' => json_encode(['40', '41', '42', '43', '44']),
            'colors' => json_encode(['أبيض/أحمر', 'أبيض/أسود']),
            'stockQuantity' => 12,
            'createdAt' => time() * 1000,
            'salesCount' => 560,
            'seoSettings' => json_encode(['metaTitle' => 'نايكي اير جوردن 1', 'metaDescription' => 'أحذية رياضية أصلية من نايكي.', 'metaKeywords' => 'نايكي, حذاء, أزياء', 'slug' => 'nike-air-jordan-1'])
        ],
        [
            'id' => 'p_airpods_max',
            'name' => 'سماعات ابل ايربودز ماكس',
            'description' => 'صوت عالي الدقة وتصميم مذهل. ميزة إلغاء الضجيج النشط والشفافية لصوت غامر تماماً.',
            'price' => 2199.00,
            'categoryId' => 'cat_electronics',
            'images' => json_encode(['https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&q=80&w=800']),
            'sizes' => json_encode(['One Size']),
            'colors' => json_encode(['سبيس جراي', 'فضي', 'أخضر', 'وردي']),
            'stockQuantity' => 5,
            'createdAt' => time() * 1000,
            'salesCount' => 200,
            'seoSettings' => json_encode(['metaTitle' => 'ايربودز ماكس ابل الأصلية', 'metaDescription' => 'أفضل تجربة صوتية من ابل.', 'metaKeywords' => 'سماعات, ابل, ايربودز', 'slug' => 'airpods-max'])
        ]
    ];

    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, salesCount, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($products as $p) {
        $prodStmt->execute([
            $p['id'], $p['name'], $p['description'], $p['price'], $p['categoryId'],
            $p['images'], $p['sizes'], $p['colors'], $p['stockQuantity'],
            $p['createdAt'], $p['salesCount'], $p['seoSettings']
        ]);
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'تم تنظيف الجداول وإعادة بناء قاعدة البيانات بـ 6 منتجات احترافية بنجاح!',
        'categories_added' => count($categories),
        'products_added' => count($products),
        'info' => 'يمكنك الآن العودة للمتجر وستجد البيانات محدثة للجميع.'
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>