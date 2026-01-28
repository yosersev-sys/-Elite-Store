<?php
/**
 * ملف تهيئة البيانات - متجر النخبة
 * قم بزيارة هذا الملف في المتصفح مرة واحدة لإدخال البيانات الأساسية
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. الأقسام الافتراضية
    $categories = [
        ['id' => 'cat_1', 'name' => 'إلكترونيات'],
        ['id' => 'cat_2', 'name' => 'أزياء'],
        ['id' => 'cat_3', 'name' => 'منزل ومطبخ'],
        ['id' => 'cat_4', 'name' => 'جمال وعناية'],
        ['id' => 'cat_5', 'name' => 'اكسسوارات']
    ];

    $pdo->exec("DELETE FROM categories"); // تنظيف قديم
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
    foreach ($categories as $cat) {
        $catStmt->execute([$cat['id'], $cat['name']]);
    }

    // 2. المنتجات الافتراضية
    $products = [
        [
            'id' => 'p_1',
            'name' => 'سماعات لاسلكية برو',
            'description' => 'تجربة صوتية محيطية مع خاصية إلغاء الضجيج وعمر بطارية طويل يصل لـ 40 ساعة.',
            'price' => 299.00,
            'categoryId' => 'cat_1',
            'images' => json_encode(['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600']),
            'sizes' => json_encode(['Small', 'Medium', 'Large']),
            'colors' => json_encode(['أسود', 'أبيض', 'أزرق']),
            'stockQuantity' => 50,
            'createdAt' => time(),
            'salesCount' => 120,
            'seoSettings' => json_encode([
                'metaTitle' => 'سماعات لاسلكية برو | صوت محيطي',
                'metaDescription' => 'أفضل سماعات لاسلكية برو في السوق مع عزل للضجيج.',
                'metaKeywords' => 'سماعات، بلوتوث، لاسلكي، تقنية',
                'slug' => 'wireless-headphones-pro'
            ])
        ],
        [
            'id' => 'p_2',
            'name' => 'ساعة ذكية رياضية',
            'description' => 'تتبع نشاطك البدني، نبضات القلب، والنوم مع شاشة AMOLED واضحة ومقاومة للماء.',
            'price' => 450.00,
            'categoryId' => 'cat_1',
            'images' => json_encode(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600']),
            'sizes' => json_encode(['40mm', '44mm']),
            'colors' => json_encode(['أسود', 'فضي', 'وردي']),
            'stockQuantity' => 30,
            'createdAt' => time(),
            'salesCount' => 85,
            'seoSettings' => json_encode([
                'metaTitle' => 'ساعة ذكية رياضية الترا',
                'metaDescription' => 'راقب صحتك ونشاطك مع الساعة الذكية الرياضية المتطورة.',
                'metaKeywords' => 'ساعة، ذكية، رياضة، صحة',
                'slug' => 'sports-smart-watch'
            ])
        ]
    ];

    $pdo->exec("DELETE FROM products"); // تنظيف قديم
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
        'message' => 'تم إنشاء 5 أقسام ومنتجين أوليين في قاعدة البيانات بنجاح!',
        'categories_added' => count($categories),
        'products_added' => count($products)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>