<?php
/**
 * ملف تهيئة البيانات الشامل - متجر النخبة
 * هذا الملف يقوم بإنشاء 24 منتجاً احترافياً (6 لكل قسم) في قاعدة البيانات
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 1. إنشاء الجداول وضمان وجودها
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS brands (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, logo TEXT NOT NULL)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10,2), categoryId VARCHAR(50), images TEXT, sizes TEXT, colors TEXT, stockQuantity INT, createdAt BIGINT, salesCount INT DEFAULT 0, seoSettings TEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(50), city VARCHAR(100), address TEXT, total DECIMAL(10,2), createdAt BIGINT, status VARCHAR(50) DEFAULT 'pending')");

    // 2. تنظيف الجداول القديمة
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
        ['id' => 'br_nespresso', 'name' => 'Nespresso', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Nespresso_logo.svg'],
        ['id' => 'br_nintendo', 'name' => 'Nintendo', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg']
    ];
    $brandStmt = $pdo->prepare("INSERT INTO brands (id, name, logo) VALUES (?, ?, ?)");
    foreach ($brands as $b) $brandStmt->execute([$b['id'], $b['name'], $b['logo']]);

    // 5. مصفوفة المنتجات الـ 24
    $now = time() * 1000;
    $products = [
        // --- إلكترونيات (6) ---
        ['id' => 'el_1', 'cat' => 'cat_electronics', 'name' => 'آيفون 15 برو ماكس', 'price' => 5299, 'stock' => 15, 'sales' => 120, 'img' => ['https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800'], 'desc' => 'تيتانيوم طبيعي مع شريحة A17 Pro.'],
        ['id' => 'el_2', 'cat' => 'cat_electronics', 'name' => 'سامسونج جالاكسي S24 الترا', 'price' => 4899, 'stock' => 10, 'sales' => 95, 'img' => ['https://images.unsplash.com/photo-1707230102120-d66763a8da31?w=800'], 'desc' => 'هاتف الذكاء الاصطناعي المتطور بكاميرا 200 ميجابكسل.'],
        ['id' => 'el_3', 'cat' => 'cat_electronics', 'name' => 'ماك بوك برو M3', 'price' => 7499, 'stock' => 5, 'sales' => 30, 'img' => ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'], 'desc' => 'أقوى لابتوب للمحترفين مع شاشة ريتنا XDR.'],
        ['id' => 'el_4', 'cat' => 'cat_electronics', 'name' => 'سماعات سوني XM5', 'price' => 1299, 'stock' => 20, 'sales' => 210, 'img' => ['https://images.unsplash.com/photo-1670057037124-710892a0966a?w=800'], 'desc' => 'رائدة عزل الضجيج في العالم.'],
        ['id' => 'el_5', 'cat' => 'cat_electronics', 'name' => 'آيباد برو 12.9 إنش', 'price' => 4599, 'stock' => 8, 'sales' => 45, 'img' => ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'], 'desc' => 'تجربة إبداعية لا مثيل لها مع شاشة Liquid Retina.'],
        ['id' => 'el_6', 'cat' => 'cat_electronics', 'name' => 'نينتندو سويتش OLED', 'price' => 1450, 'stock' => 12, 'sales' => 180, 'img' => ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800'], 'desc' => 'أفضل جهاز ألعاب منزلي ومتنقل.'],

        // --- أزياء (6) ---
        ['id' => 'fa_1', 'cat' => 'cat_fashion', 'name' => 'حذاء نايكي إير جوردن', 'price' => 850, 'stock' => 25, 'sales' => 400, 'img' => ['https://images.unsplash.com/photo-1584906332183-f25c04879612?w=800'], 'desc' => 'أيقونة الموضة الرياضية.'],
        ['id' => 'fa_2', 'cat' => 'cat_fashion', 'name' => 'تيشيرت أديداس أوريجينالز', 'price' => 180, 'stock' => 50, 'sales' => 320, 'img' => ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'], 'desc' => 'راحة تامة وأناقة يومية.'],
        ['id' => 'fa_3', 'cat' => 'cat_fashion', 'name' => 'بنطال ليفايز 501 كلاسيك', 'price' => 350, 'stock' => 40, 'sales' => 150, 'img' => ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800'], 'desc' => 'الدنيم الأصلي الذي يدوم للأبد.'],
        ['id' => 'fa_4', 'cat' => 'cat_fashion', 'name' => 'جاكيت زارا الشتوي', 'price' => 599, 'stock' => 15, 'sales' => 80, 'img' => ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800'], 'desc' => 'تصميم عصري ودفء مثالي.'],
        ['id' => 'fa_5', 'cat' => 'cat_fashion', 'name' => 'هودي نايكي سبورتس', 'price' => 290, 'stock' => 30, 'sales' => 240, 'img' => ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'], 'desc' => 'الخيار الأفضل للتمارين والأيام الباردة.'],
        ['id' => 'fa_6', 'cat' => 'cat_fashion', 'name' => 'قميص لاكوست بولو', 'price' => 420, 'stock' => 20, 'sales' => 190, 'img' => ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800'], 'desc' => 'أناقة فرنسية كلاسيكية.'],

        // --- منزل ومطبخ (6) ---
        ['id' => 'ho_1', 'cat' => 'cat_home', 'name' => 'ماكينة قهوة نسبريسو', 'price' => 899, 'stock' => 12, 'sales' => 350, 'img' => ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800'], 'desc' => 'قهوتك الصباحية بجودة احترافية.'],
        ['id' => 'ho_2', 'cat' => 'cat_home', 'name' => 'مكنسة دايسون V15 اللاسلكية', 'price' => 2800, 'stock' => 7, 'sales' => 60, 'img' => ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800'], 'desc' => 'أقوى مكنسة لاسلكية ذكية بليزر كشف الغبار.'],
        ['id' => 'ho_3', 'cat' => 'cat_home', 'name' => 'عجانة كيتشن إيد آرتيزان', 'price' => 2450, 'stock' => 5, 'sales' => 45, 'img' => ['https://images.unsplash.com/photo-1594385208974-2e75f9d8ad48?w=800'], 'desc' => 'المساعد المثالي لكل خباز محترف.'],
        ['id' => 'ho_4', 'cat' => 'cat_home', 'name' => 'قلاية فيليبس الهوائية XXL', 'price' => 1149, 'stock' => 10, 'sales' => 420, 'img' => ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800'], 'desc' => 'طعام صحي ومقرمش بدون زيت.'],
        ['id' => 'ho_5', 'cat' => 'cat_home', 'name' => 'قدر الضغط الكهربائي إنستانت بوت', 'price' => 550, 'stock' => 15, 'sales' => 280, 'img' => ['https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=800'], 'desc' => 'جهاز المطبخ المتعدد الاستخدامات.'],
        ['id' => 'ho_6', 'cat' => 'cat_home', 'name' => 'روبوت تنظيف الأرضيات رويوروك', 'price' => 1999, 'stock' => 6, 'sales' => 75, 'img' => ['https://images.unsplash.com/photo-1589923158776-cb4485d99fd6?w=800'], 'desc' => 'نظافة ذكية ومؤتمتة بالكامل لمنزلك.'],

        // --- جمال وعناية (6) ---
        ['id' => 'be_1', 'cat' => 'cat_beauty', 'name' => 'عطر بلو دو شانيل', 'price' => 620, 'stock' => 30, 'sales' => 1200, 'img' => ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800'], 'desc' => 'الفخامة والجاذبية في زجاجة.'],
        ['id' => 'be_2', 'cat' => 'cat_beauty', 'name' => 'مصفف شعر دايسون ايرواب', 'price' => 2350, 'stock' => 4, 'sales' => 85, 'img' => ['https://images.unsplash.com/photo-1652438318617-660993557e93?w=800'], 'desc' => 'تصفيف احترافي بدون حرارة زائدة.'],
        ['id' => 'be_3', 'cat' => 'cat_beauty', 'name' => 'عطر ديور سوفاج', 'price' => 580, 'stock' => 25, 'sales' => 950, 'img' => ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'], 'desc' => 'الروح البرية في عطر أيقوني.'],
        ['id' => 'be_4', 'cat' => 'cat_beauty', 'name' => 'سيروم استي لودر الليلي', 'price' => 450, 'stock' => 15, 'sales' => 310, 'img' => ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'], 'desc' => 'إصلاح البشرة المتقدم أثناء النوم.'],
        ['id' => 'be_5', 'cat' => 'cat_beauty', 'name' => 'مرطب كلينيك هيدراتور', 'price' => 210, 'stock' => 20, 'sales' => 140, 'img' => ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800'], 'desc' => 'ترطيب عميق يدوم 72 ساعة.'],
        ['id' => 'be_6', 'cat' => 'cat_beauty', 'name' => 'جهاز تنظيف البشرة فوريو لونا', 'price' => 780, 'stock' => 10, 'sales' => 65, 'img' => ['https://images.unsplash.com/photo-1590156221122-c748e789290e?w=800'], 'desc' => 'عناية فائقة بالبشرة بتقنية النبضات.'],
    ];

    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, categoryId, images, sizes, colors, stockQuantity, createdAt, salesCount, seoSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($products as $p) {
        $slug = strtolower(str_replace(' ', '-', $p['name'])) . '-' . $p['id'];
        $seo = [
            'metaTitle' => $p['name'] . ' | متجر النخبة',
            'metaDescription' => $p['desc'],
            'metaKeywords' => $p['name'] . ', تسوق, عروض',
            'slug' => $slug
        ];

        $prodStmt->execute([
            $p['id'], $p['name'], $p['desc'], $p['price'], $p['cat'],
            json_encode($p['img']), 
            json_encode(['Standard']), 
            json_encode(['Multi']),
            $p['stock'], $now, $p['sales'], 
            json_encode($seo)
        ]);
    }

    echo json_encode(['status' => 'success', 'message' => 'تم تهيئة المتجر بـ 24 منتجاً بنجاح!'], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
