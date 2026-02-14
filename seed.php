<?php
/**
 * ملف تهيئة البيانات الشامل (Master Seed) v6.0 - سوق العصر - فاقوس
 * يحتوي على 80 صنفاً منتقاة بعناية لكافة أقسام السوبر ماركت
 */

require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE products");
    $pdo->exec("TRUNCATE TABLE categories");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    $categories = [
        ['id' => 'cat_basic', 'name' => 'أساسيات المطبخ', 'order' => 1],
        ['id' => 'cat_supermarket', 'name' => 'بقوليات ومعلبات', 'order' => 2],
        ['id' => 'cat_veggies', 'name' => 'خضروات طازجة', 'order' => 3],
        ['id' => 'cat_fruits', 'name' => 'فواكه موسمية', 'order' => 4],
        ['id' => 'cat_dairy', 'name' => 'ألبان وأجبان', 'order' => 5],
        ['id' => 'cat_snacks', 'name' => 'تسالي وحلويات', 'order' => 6],
        ['id' => 'cat_drinks', 'name' => 'مشروبات وعصائر', 'order' => 7],
        ['id' => 'cat_cleaning', 'name' => 'منظفات وعناية', 'order' => 8]
    ];
    $catStmt = $pdo->prepare("INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)");
    foreach ($categories as $cat) $catStmt->execute([$cat['id'], $cat['name'], $cat['order']]);

    $now = time() * 1000;
    $products = [
        // أساسيات (10)
        ['p_b1', 'أرز الساعة مصري 1كجم', 'أرز مصري فاخر منقى.', 35.00, 29.50, 'cat_basic', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800', 'piece'],
        ['p_b2', 'أرز الضحى 1كجم', 'أرز أبيض مغسول جاهز.', 38.00, 32.00, 'cat_basic', 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800', 'piece'],
        ['p_b3', 'سكر الأسرة 1كجم', 'سكر أبيض نقي.', 27.00, 24.00, 'cat_basic', 'https://images.unsplash.com/photo-1622484211148-716598e04141?w=800', 'piece'],
        ['p_b4', 'زيت كريستال عباد 0.8لتر', 'زيت خفيف للقلي.', 68.00, 62.00, 'cat_basic', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800', 'piece'],
        ['p_b5', 'زيت عافية ذرة 1.6لتر', 'زيت ذرة نقي 100%.', 145.00, 132.00, 'cat_basic', 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800', 'piece'],
        ['p_b6', 'مكرونة روجينا قلم 400جم', 'مكرونة قمح قاسي.', 16.00, 13.50, 'cat_basic', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800', 'piece'],
        ['p_b7', 'مكرونة الملكة مرمرية 400جم', 'مكرونة موفرة.', 11.00, 9.00, 'cat_basic', 'https://images.unsplash.com/photo-1621961458348-f013d219b50c?w=800', 'piece'],
        ['p_b8', 'دقيق الضحى 1كجم', 'دقيق فاخر لكافة الأغراض.', 28.00, 24.50, 'cat_basic', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', 'piece'],
        ['p_b9', 'سمن كريستال أبيض 700جم', 'رائحة وطعم البلدي.', 62.00, 56.00, 'cat_basic', 'https://images.unsplash.com/photo-1631709497146-a239ef373cf1?w=800', 'piece'],
        ['p_b10', 'سمن روابي 1.5كجم', 'نكهة القشطة المميزة.', 125.00, 114.00, 'cat_basic', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800', 'piece'],
        
        // بقوليات ومعلبات (10)
        ['p_s1', 'فول أمريكانا سادة', 'فول مدمس درجة أولى.', 14.00, 11.50, 'cat_supermarket', 'https://images.unsplash.com/photo-1547050605-2f268cd5e3ab?w=800', 'piece'],
        ['p_s2', 'صلصة هاينز 360جم', 'معجون طماطم نقي.', 24.00, 20.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1601050690597-df056fb1d99a?w=800', 'piece'],
        ['p_s3', 'تونة صن شاين قطع', 'لحم تونة خفيف.', 55.00, 48.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=800', 'piece'],
        ['p_s4', 'مايونيز هاينز 285جم', 'قوام كريمي رائع.', 38.00, 33.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1585325701165-351af916e581?w=800', 'piece'],
        ['p_s5', 'عدس أصفر الضحى 500جم', 'عدس منقى عالي الجودة.', 35.00, 30.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=800', 'piece'],
        ['p_s6', 'لوبيا الضحى 500جم', 'لوبيا درجة أولى.', 42.00, 36.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=800', 'piece'],
        ['p_s7', 'فاصوليا بيضاء الضحى 500جم', 'فاصوليا جافة فاخرة.', 45.00, 38.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=800', 'piece'],
        ['p_s8', 'خل هاينز طبيعي 1لتر', 'خل أبيض نقي.', 15.00, 12.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1585325701165-351af916e581?w=800', 'piece'],
        ['p_s9', 'مشروم قعوار قطع', 'فطر معلب عالي الجودة.', 48.00, 41.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1601050690597-df056fb1d99a?w=800', 'piece'],
        ['p_s10', 'ذرة حلوة هارفست', 'ذرة سكرية معلبة.', 28.00, 23.00, 'cat_supermarket', 'https://images.unsplash.com/photo-1601050690597-df056fb1d99a?w=800', 'piece'],

        // خضروات (10)
        ['p_v1', 'طماطم بلدي طازجة', 'طماطم حمراء من المزرعة.', 15.00, 10.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800', 'kg'],
        ['p_v2', 'بطاطس تحمير جبلية', 'بطاطس رملية ممتازة.', 20.00, 15.00, 'cat_veggies', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800', 'kg'],
        ['p_v3', 'بصل أحمر وسط', 'بصل قوي النكهة.', 22.00, 16.00, 'cat_veggies', 'https://images.unsplash.com/photo-1508747703725-7197771375a0?w=800', 'kg'],
        ['p_v4', 'خيار بلدي طازج', 'خيار مقرمش صغير.', 15.00, 11.00, 'cat_veggies', 'https://images.unsplash.com/photo-1449333255014-24e0da978f91?w=800', 'kg'],
        ['p_v5', 'فلفل رومي أخضر', 'فلفل بارد طازج.', 18.00, 14.00, 'cat_veggies', 'https://images.unsplash.com/photo-1566232392379-afd9298e6a46?w=800', 'kg'],
        ['p_v6', 'باذنجان عروس أسود', 'مثالي للمحشي والقلي.', 12.00, 8.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800', 'kg'],
        ['p_v7', 'كوسة وسط طازجة', 'كوسة من المزرعة يومياً.', 25.00, 18.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800', 'kg'],
        ['p_v8', 'جزر سكري أحمر', 'جزر طازج للطبخ.', 15.00, 10.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800', 'kg'],
        ['p_v9', 'ليمون بلدي أصفر', 'ليمون حامض طازج.', 20.00, 14.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800', 'kg'],
        ['p_v10', 'ثوم بلدي أحمر', 'ثوم قوي الرائحة.', 45.00, 35.00, 'cat_veggies', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800', 'kg'],

        // فواكه (10)
        ['p_f1', 'موز بلدي سكري', 'موز طازج ومذاق حلو.', 25.00, 19.00, 'cat_fruits', 'https://images.unsplash.com/photo-1571771894821-ad99026a0947?w=800', 'kg'],
        ['p_f2', 'تفاح أحمر إيطالي', 'تفاح مقرمش مستورد.', 75.00, 65.00, 'cat_fruits', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=800', 'kg'],
        ['p_f3', 'برتقال صيفي', 'برتقال عصير منعش.', 12.00, 8.00, 'cat_fruits', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=800', 'kg'],
        ['p_f4', 'عنب أحمر بناتي', 'عنب سكري بدون بذور.', 45.00, 35.00, 'cat_fruits', 'https://images.unsplash.com/photo-1537640538966-79f369b41e8f?w=800', 'kg'],
        ['p_f5', 'مانجو عويسي فاخرة', 'أفضل أنواع المانجو.', 85.00, 72.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800', 'kg'],
        ['p_f6', 'بطيخ جيزاوي أحمر', 'بطيخة كبيرة ومحونة.', 60.00, 45.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800', 'piece'],
        ['p_f7', 'خوخ سيناوي سكري', 'خوخ طازج رائحة رائعة.', 35.00, 28.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800', 'kg'],
        ['p_f8', 'كانتلوب بلدي', 'كانتلوب مسكر ومنعش.', 20.00, 15.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800', 'kg'],
        ['p_f9', 'جوافة بلدي بيضاء', 'جوافة بنكهة قوية.', 25.00, 18.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800', 'kg'],
        ['p_f10', 'برقوق أحمر فاخر', 'برقوق طازج سكري.', 55.00, 45.00, 'cat_fruits', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800', 'kg'],

        // ألبان وأجبان (10)
        ['p_d1', 'لبن جهينة 1لتر', 'حليب طبيعي 100%.', 45.00, 38.50, 'cat_dairy', 'https://images.unsplash.com/photo-1550583724-125581fe2f8a?w=800', 'piece'],
        ['p_d2', 'لبن المراعي 1لتر', 'طعم طازج وجودة المراعي.', 48.00, 41.00, 'cat_dairy', 'https://images.unsplash.com/photo-1563636619-e9107da8a1bb?w=800', 'piece'],
        ['p_d3', 'جبنة دومتي 500جم', 'جبنة فيتا نباتية الدهن.', 42.00, 36.00, 'cat_dairy', 'https://images.unsplash.com/photo-1528284724614-e054b11964bc?w=800', 'piece'],
        ['p_d4', 'جبنة عبور لاند 500جم', 'جبنة إسطنبولي حادقة.', 38.00, 33.00, 'cat_dairy', 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=800', 'piece'],
        ['p_d5', 'جبنة رومي قديمة 250جم', 'جبنة معتقة طعم أصيل.', 75.00, 65.00, 'cat_dairy', 'https://images.unsplash.com/photo-1486297678162-ad2a19b05844?w=800', 'piece'],
        ['p_d6', 'زبادي جهينة طبيعي', 'زبادي طازج ناعم.', 8.50, 7.00, 'cat_dairy', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', 'piece'],
        ['p_d7', 'زبادي المراعي لايت', 'زبادي خفيف قليل الدسم.', 9.00, 7.50, 'cat_dairy', 'https://images.unsplash.com/photo-1571275227758-2e25456b9fd9?w=800', 'piece'],
        ['p_d8', 'جبنة كيري 6 قطع', 'جبنة كريمية للأطفال.', 35.00, 29.00, 'cat_dairy', 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=800', 'piece'],
        ['p_d9', 'زبدة فيرن خليط 1كجم', 'مثالية للحلويات.', 130.00, 118.00, 'cat_dairy', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800', 'piece'],
        ['p_d10', 'قشطة بوك 170جم', 'قشطة قيمر غنية.', 32.00, 27.00, 'cat_dairy', 'https://images.unsplash.com/photo-1610450519183-b7df36599723?w=800', 'piece'],

        // تسالي وحلويات (10)
        ['p_n1', 'شيبسي عائلي طماطم', 'بطاطس مقرمشة طعم رائع.', 15.00, 12.00, 'cat_snacks', 'https://images.unsplash.com/photo-1566478431375-704332ca523f?w=800', 'piece'],
        ['p_n2', 'كرانشي جبنة كبير', 'مقرمشات ذرة بالجبنة.', 12.00, 9.50, 'cat_snacks', 'https://images.unsplash.com/photo-1621447509323-570a162b9914?w=800', 'piece'],
        ['p_n3', 'بسكويت أولكر تمر', 'بسكويت محشو بعجوة.', 7.00, 5.50, 'cat_snacks', 'https://images.unsplash.com/photo-1558961359-1d9c298a08c2?w=800', 'piece'],
        ['p_n4', 'شوكولاتة جالاكسي', 'طعم النعومة الحقيقي.', 25.00, 21.00, 'cat_snacks', 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800', 'piece'],
        ['p_n5', 'حلاوة طحينية الرشيدي', 'حلاوة سادة أصلية.', 35.00, 30.00, 'cat_snacks', 'https://images.unsplash.com/photo-1590080876251-132a741a3a7b?w=800', 'piece'],
        ['p_n6', 'عسل نحل امتنان 450جم', 'عسل طبيعي نقي.', 95.00, 85.00, 'cat_snacks', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800', 'piece'],
        ['p_n7', 'مربى فيتراك فراولة', 'مربى قطع فاكهة.', 38.00, 32.00, 'cat_snacks', 'https://images.unsplash.com/photo-1589135340847-477f1a30421e?w=800', 'piece'],
        ['p_n8', 'لب أبيض سوبر 250جم', 'تسالي مصرية محمصة.', 45.00, 38.00, 'cat_snacks', 'https://images.unsplash.com/photo-1536620239019-35444936d2ff?w=800', 'piece'],
        ['p_n9', 'كيك نايتي فراولة', 'كيك إسفنجي محشو.', 5.00, 3.80, 'cat_snacks', 'https://images.unsplash.com/photo-1566478431375-704332ca523f?w=800', 'piece'],
        ['p_n10', 'كروكودايل ذرة مملحة', 'سناكس ذرة بالملح.', 5.00, 4.00, 'cat_snacks', 'https://images.unsplash.com/photo-1566478431375-704332ca523f?w=800', 'piece'],

        // مشروبات وعصائر (10)
        ['p_r1', 'شاي ليبتون 250جم', 'شاي أسود منقى.', 55.00, 48.00, 'cat_drinks', 'https://images.unsplash.com/photo-1544787210-2213d4b39353?w=800', 'piece'],
        ['p_r2', 'شاي العروسة 250جم', 'شاي المصريين الأول.', 48.00, 42.00, 'cat_drinks', 'https://images.unsplash.com/photo-1594631252845-29fc4586d517?w=800', 'piece'],
        ['p_r3', 'نسكافيه بلاك 100جم', 'قهوة سريعة التحضير.', 85.00, 75.00, 'cat_drinks', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800', 'piece'],
        ['p_r4', 'عصير جهينة بيور 1لتر', 'طبيعي بدون سكر.', 38.00, 32.00, 'cat_drinks', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800', 'piece'],
        ['p_r5', 'بيبسي كانز 330مل', 'مشروب غازي منعش.', 12.00, 9.50, 'cat_drinks', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800', 'piece'],
        ['p_r6', 'مياه أكوافينا 1.5لتر', 'مياه شرب نقية.', 8.00, 6.50, 'cat_drinks', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800', 'piece'],
        ['p_r7', 'كاكاو نسكويك 250جم', 'مشروب شوكولاتة مغذي.', 55.00, 49.00, 'cat_drinks', 'https://images.unsplash.com/photo-1544787210-2213d4b39353?w=800', 'piece'],
        ['p_r8', 'عصير بيتي مانجو 1لتر', 'عصير مانجو مركز.', 24.00, 20.00, 'cat_drinks', 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800', 'piece'],
        ['p_r9', 'مياه فوارة شويبس', 'صودا منعشة طعم ليمون.', 15.00, 11.00, 'cat_drinks', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800', 'piece'],
        ['p_r10', 'لبن بالشوكولاتة جهينة', 'مشروب لبن مفضل.', 10.00, 8.50, 'cat_drinks', 'https://images.unsplash.com/photo-1550583724-125581fe2f8a?w=800', 'piece'],

        // منظفات (10)
        ['p_c1', 'إريال أتوماتيك 2.5كجم', 'نظافة لا تضاهى.', 185.00, 172.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', 'piece'],
        ['p_c2', 'بريل منظف أطباق 1لتر', 'إزالة قوية للدهون.', 35.00, 30.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800', 'piece'],
        ['p_c3', 'كلوركس مبيض 1لتر', 'بياض ناصع وحماية.', 18.00, 15.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', 'piece'],
        ['p_c4', 'داوني منعم 1لتر', 'رائحة ونعومة فائقة.', 65.00, 58.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', 'piece'],
        ['p_c5', 'شامبو بانتين 400مل', 'لشعر قوي ولامع.', 75.00, 68.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800', 'piece'],
        ['p_c6', 'صابون لوكس 120جم', 'نعومة وعطر ساحر.', 15.00, 12.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800', 'piece'],
        ['p_c7', 'سيجنال معجون أسنان', 'حماية يومية من التسوس.', 32.00, 27.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1559594861-16383c8990ca?w=800', 'piece'],
        ['p_c8', 'ديتول سائل 500مل', 'حماية من الجراثيم.', 110.00, 98.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', 'piece'],
        ['p_c9', 'مناديل فاين 500 منديل', 'امتصاص ونعومة فائقة.', 28.00, 24.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800', 'piece'],
        ['p_c10', 'هاربيك منظف تواليت', 'نظافة وتطهير كامل.', 45.00, 38.00, 'cat_cleaning', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', 'piece']
    ];

    $prodStmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, images, stockQuantity, unit, createdAt, salesCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($products as $p) {
        $prodStmt->execute([$p[0], $p[1], $p[2], (float)$p[3], (float)$p[4], $p[5], json_encode([$p[6]]), 100, $p[7], $now, rand(10, 150)]);
    }

    echo json_encode(['status' => 'success', 'message' => 'تم تهيئة المتجر بـ ' . count($products) . ' منتجاً مصرياً!'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
} ?>