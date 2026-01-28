<?php
/**
 * ملف تهيئة البيانات - متجر النخبة
 */

ob_start();
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // الأقسام الافتراضية
    $categories = [
        ['id' => 'cat_1', 'name' => 'إلكترونيات'],
        ['id' => 'cat_2', 'name' => 'أزياء'],
        ['id' => 'cat_3', 'name' => 'منزل ومطبخ'],
        ['id' => 'cat_4', 'name' => 'جمال وعناية'],
        ['id' => 'cat_5', 'name' => 'اكسسوارات']
    ];

    $pdo->exec("DELETE FROM categories");
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
    foreach ($categories as $cat) {
        $catStmt->execute([$cat['id'], $cat['name']]);
    }

    // المنتجات الافتراضية
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
            'createdAt' => (time() * 1000),
            'salesCount' => 120,
            'seoSettings' => json_encode([
                'metaTitle' => 'سماعات لاسلكية برو | صوت محيطي',
                'metaDescription' => 'أفضل سماعات لاسلكية برو في السوق مع عزل للضجيج.',
                'metaKeywords' => 'سماعات، بلوتوث، لاسلكي، تقنية',
                'slug' => 'wireless-headphones-pro'
            ])
        ]
    ];

    $pdo->exec("DELETE FROM products");
    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, salesCount, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($products as $p) {
        $prodStmt->execute([
            $p['id'], $p['name'], $p['description'], $p['price'], $p['categoryId'],
            $p['images'], $p['sizes'], $p['colors'], $p['stockQuantity'],
            $p['createdAt'], $p['salesCount'], $p['seoSettings']
        ]);
    }

    ob_clean();
    echo json_encode([
        'status' => 'success',
        'message' => 'Database seeded successfully!'
    ]);

} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
exit;