<?php
/**
 * سوق العصر - المحرك الخارق v8.7
 * الإصلاح الجذري والأخير لمشكلة الموديولات (Module Resolution)
 */
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

require_once 'config.php';

$gemini_key = '';
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key'");
    $stmt->execute();
    $gemini_key = $stmt->fetchColumn() ?: '';
} catch (Exception $e) {}

// ═══════════════════════════════════════════════════
// Dynamic SEO & Metadata Processor (Server-Side)
// ═══════════════════════════════════════════════════
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'] ?? 'soqelasr.com';
$request_uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($request_uri, PHP_URL_PATH);

$meta_title = 'سوق العصر فاقوس | متجر التوصيل الأول في فاقوس ومحافظة الشرقية';
$meta_desc = 'تسوق الآن من متجر سوق العصر بفاقوس. منظفات، سلع استهلاكية، ومستلزمات منزلية بأسعار منافسة مع خدمة توصيل فائقة السرعة لجميع قرى مركز فاقوس والشرقية.';
$meta_image = 'https://soqelasr.com/shopping-bag512.png';
$canonical_url = $protocol . $domainName . $path;
$custom_schemas = [];

// Load villages from settings or use defaults
$delivery_villages = [];
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'delivery_villages_json'");
    $stmt->execute();
    $raw_json = $stmt->fetchColumn();
    if ($raw_json) {
        $delivery_villages = json_decode($raw_json, true);
    }
} catch (Exception $e) {}

if (empty($delivery_villages) || !is_array($delivery_villages)) {
    $delivery_villages = [
        ['name' => 'مدينة فاقوس بالكامل', 'center' => 'فاقوس (المدينة)', 'status' => 'متاح فوراً (خلال ساعة إلى ساعتين)', 'fee' => 10, 'desc' => 'الخدمة الفورية لجميع أحياء وشوارع فاقوس بالكامل.'],
        ['name' => 'الديدامون', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 2-4 ساعات)', 'fee' => 15, 'desc' => 'تغطية كاملة لجميع شوارع وأنحاء قرية الديدامون الكبرى.'],
        ['name' => 'جهينة', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 2-4 ساعات)', 'fee' => 15, 'desc' => 'شحن يومي سريع لقرية جهينة والمناطق التابعة لها.'],
        ['name' => 'الصوالح', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 3-5 ساعات)', 'fee' => 20, 'desc' => 'توصيل لباب المنزل لقرية الصوالح.'],
        ['name' => 'السماعنة', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 3-5 ساعات)', 'fee' => 20, 'desc' => 'توصيل يومي لكافة مستلزمات البيوت بقرية السماعنة.'],
        ['name' => 'الغزالي', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 4-6 ساعات)', 'fee' => 25, 'desc' => 'تغطية التوصيل لقرية الغزالي وتوابعها.'],
        ['name' => 'ميت العز', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 4-6 ساعات)', 'fee' => 25, 'desc' => 'توصيل للمنازل بقرية ميت العز.'],
        ['name' => 'سوادة', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 2-4 ساعات)', 'fee' => 15, 'desc' => 'شحن مباشر وسريع لمنطقة سوادة.'],
        ['name' => 'السلاطنة', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 3-5 ساعات)', 'fee' => 20, 'desc' => 'تغطية لقرية السلاطنة والمناطق المجاورة.'],
        ['name' => 'أكياد', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 4-6 ساعات)', 'fee' => 25, 'desc' => 'توصيل مجدول مرتين يومياً لقرية أكياد.'],
        ['name' => 'الخطارة', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 4-6 ساعات)', 'fee' => 25, 'desc' => 'شحن لقرية الخطارة وما حولها.'],
        ['name' => 'الدميين', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 3-5 ساعات)', 'fee' => 20, 'desc' => 'خدمة التوصيل السريع لقرية الدميين.'],
        ['name' => 'النوافعة', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 3-5 ساعات)', 'fee' => 20, 'desc' => 'توصيل يومي للطلبات بقرية النوافعة.'],
        ['name' => 'الهيصمية', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 4-6 ساعات)', 'fee' => 25, 'desc' => 'شحن وتوصيل لقرية الهيصمية.'],
        ['name' => 'أشكر', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 3-5 ساعات)', 'fee' => 20, 'desc' => 'توصيل مباشر لقرية أشكر.'],
        ['name' => 'بني صريد', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 2-4 ساعات)', 'fee' => 15, 'desc' => 'تغطية يومية لقرية بني صريد.'],
        ['name' => 'كفر الحوت', 'center' => 'فاقوس', 'status' => 'متاح (توصيل خلال 2-4 ساعات)', 'fee' => 15, 'desc' => 'شحن سريع لقرية كفر الحوت.']
    ];
}

// Determine page type
$is_delivery_page = ($path === '/delivery-areas' || ($_GET['page'] ?? '') === 'delivery-areas');
$is_product_page = false;
$product_id = null;

if (preg_match('#^/product/([a-zA-Z0-9_-]+)#', $path, $matches)) {
    $is_product_page = true;
    $product_id = $matches[1];
} elseif (isset($_GET['productId'])) {
    $is_product_page = true;
    $product_id = $_GET['productId'];
}

// 1. Delivery Areas page metadata & pre-render
if ($is_delivery_page) {
    $meta_title = 'مناطق التوصيل والقرى المخدمة في فاقوس والشرقية | سوق العصر';
    $meta_desc = 'تعرف على القرى والمناطق المخدمة بمركز فاقوس ومحافظة الشرقية من متجر سوق العصر. نوصل لباب بيتك في الديدامون، جهينة، الصوالح، السماعنة، الغزالي وكافة الأنحاء خلال ساعات.';
} 
// 2. Product details page metadata & pre-render
elseif ($is_product_page && $product_id) {
    try {
        $stmt = $pdo->prepare("SELECT name, description, price, image FROM products WHERE id = ? AND isArchived = 0 AND isDeleted = 0");
        $stmt->execute([$product_id]);
        $prod = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($prod) {
            $meta_title = htmlspecialchars($prod['name']) . ' | متجر سوق العصر فاقوس';
            $meta_desc = htmlspecialchars(mb_substr(strip_tags($prod['description']), 0, 160)) . ' - اشتري الآن بأفضل سعر وتوصيل فوري لفاقوس والشرقية.';
            if (!empty($prod['image'])) {
                $meta_image = $prod['image'];
            }
            
            // Build Product Schema (JSON-LD)
            $custom_schemas[] = [
                "@context" => "https://schema.org/",
                "@type" => "Product",
                "name" => $prod['name'],
                "image" => $meta_image,
                "description" => strip_tags($prod['description']),
                "offers" => [
                    "@type" => "Offer",
                    "url" => $canonical_url,
                    "priceCurrency" => "EGP",
                    "price" => $prod['price'],
                    "availability" => "https://schema.org/InStock",
                    "itemCondition" => "https://schema.org/NewCondition"
                ]
            ];
            
            // Build Breadcrumb for Product
            $custom_schemas[] = [
                "@context" => "https://schema.org",
                "@type" => "BreadcrumbList",
                "itemListElement" => [
                    [
                        "@type" => "ListItem",
                        "position" => 1,
                        "name" => "الرئيسية",
                        "item" => $protocol . $domainName . "/"
                    ],
                    [
                        "@type" => "ListItem",
                        "position" => 2,
                        "name" => "المنتجات",
                        "item" => $protocol . $domainName . "/#store"
                    ],
                    [
                        "@type" => "ListItem",
                        "position" => 3,
                        "name" => $prod['name'],
                        "item" => $canonical_url
                    ]
                ]
            ];
        }
    } catch (Exception $e) {}
}

// 3. Add default Breadcrumbs for main/delivery pages
if (!$is_product_page) {
    $crumbs = [
        [
            "@type" => "ListItem",
            "position" => 1,
            "name" => "الرئيسية",
            "item" => $protocol . $domainName . "/"
        ]
    ];
    if ($is_delivery_page) {
        $crumbs[] = [
            "@type" => "ListItem",
            "position" => 2,
            "name" => "مناطق التوصيل",
            "item" => $canonical_url
        ];
    }
    $custom_schemas[] = [
        "@context" => "https://schema.org",
        "@type" => "BreadcrumbList",
        "itemListElement" => $crumbs
    ];
}

// 4. Global Schemas: Website, Organization, LocalBusiness
$global_schemas = [
    // Website SearchAction
    [
        "@context" => "https://schema.org",
        "@type" => "WebSite",
        "name" => "سوق العصر",
        "url" => $protocol . $domainName . "/",
        "potentialAction" => [
            "@type" => "SearchAction",
            "target" => $protocol . $domainName . "/?q={search_term_string}",
            "query-input" => "required name=search_term_string"
        ]
    ],
    // Organization Info
    [
        "@context" => "https://schema.org",
        "@type" => "Organization",
        "name" => "سوق العصر فاقوس",
        "url" => $protocol . $domainName . "/",
        "logo" => "https://soqelasr.com/shopping-bag512.png",
        "contactPoint" => [
            "@type" => "ContactPoint",
            "telephone" => "+201026034170",
            "contactType" => "customer service",
            "areaServed" => "EG",
            "availableLanguage" => "Arabic"
        ]
    ],
    // LocalBusiness geo coordinates & area served
    [
        "@context" => "https://schema.org",
        "@type" => "LocalBusiness",
        "name" => "سوق العصر فاقوس",
        "image" => "https://soqelasr.com/shopping-bag512.png",
        "telephone" => "+201026034170",
        "url" => $protocol . $domainName . "/",
        "address" => [
            "@type" => "PostalAddress",
            "streetAddress" => "شارع الإنتاج, مركز فاقوس",
            "addressLocality" => "فاقوس",
            "addressRegion" => "محافظة الشرقية",
            "addressCountry" => "EG"
        ],
        "geo" => [
            "@type" => "GeoCoordinates",
            "latitude" => 30.7303,
            "longitude" => 31.8016
        ],
        "openingHoursSpecification" => [
            "@type" => "OpeningHoursSpecification",
            "dayOfWeek" => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens" => "08:00",
            "closes" => "23:59"
        ],
        "areaServed" => array_merge(
            [["@type" => "AdministrativeArea", "name" => "محافظة الشرقية"]],
            array_map(function($v) {
                return ["@type" => "AdministrativeArea", "name" => $v['name']];
            }, $delivery_villages)
        )
    ]
];
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl" class="notranslate" translate="no">
<head>
    <meta charset="UTF-8">
    <meta name="google" content="notranslate">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title><?php echo $meta_title; ?></title>
    <meta name="description" content="<?php echo $meta_desc; ?>">
    <link rel="canonical" href="<?php echo $canonical_url; ?>">

    <!-- OpenGraph Social Metadata -->
    <meta property="og:title" content="<?php echo $meta_title; ?>">
    <meta property="og:description" content="<?php echo $meta_desc; ?>">
    <meta property="og:image" content="<?php echo $meta_image; ?>">
    <meta property="og:url" content="<?php echo $canonical_url; ?>">
    <meta property="og:type" content="website">
    
    <!-- Render JSON-LD Schemas -->
    <?php
    foreach (array_merge($global_schemas, $custom_schemas) as $schema) {
        echo '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '</script>' . "\n";
    }
    ?>

    
    <link rel="icon" type="image/png" href="https://soqelasr.com/shopping-bag512.png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#10b981">

    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    
    <?php
    // جلب ملفات التنسيق الذكية: نحاول القراءة من dist/index.html أولاً لمعرفة الملف النشط بدقة
    // وإلا سنقوم بالبحث في المجلد واختيار الملف الأحدث فقط لتجنب التكرار
    $cssUrl = '';
    $jsUrl = '';
    $indexHtmlPath = __DIR__ . '/dist/index.html';
    if (file_exists($indexHtmlPath)) {
        $indexHtml = file_get_contents($indexHtmlPath);
        if (preg_match('/href="([^"]+\.css)"/', $indexHtml, $m)) {
            $cssUrl = 'dist/' . ltrim($m[1], './');
        }
        if (preg_match('/src="([^"]+\.js)"/', $indexHtml, $m)) {
            $jsUrl = 'dist/' . ltrim($m[1], './');
        }
    }

    if (!$cssUrl) {
        $cssFiles = glob(__DIR__ . '/dist/assets/index-*.css');
        if ($cssFiles && count($cssFiles) > 0) {
            usort($cssFiles, function($a, $b) { return filemtime($b) - filemtime($a); });
            $cssUrl = 'dist/assets/' . basename($cssFiles[0]);
        }
    }

    if ($cssUrl && file_exists(__DIR__ . '/' . strtok($cssUrl, '?'))) {
        echo '<link rel="stylesheet" crossorigin href="' . $cssUrl . '?v=' . filemtime(__DIR__ . '/' . strtok($cssUrl, '?')) . '">';
    }
    ?>

    <style>
        :root { --primary: #10b981; }
        * { font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background: #f8fafc; margin: 0; overflow-x: hidden; }
        .skeleton { background: #edf2f7; background-image: linear-gradient(90deg, #edf2f7 0px, #f7fafc 40px, #edf2f7 80px); background-size: 600px; animation: shine-lines 1.6s infinite linear; }
        @keyframes shine-lines { 0% { background-position: -100px; } 40%, 100% { background-position: 140px; } }
    </style>
</head>
<body>
    <div id="root">
        <?php if ($is_delivery_page): ?>
            <!-- Pre-rendered Local SEO content for search engine crawlers and JavaScript-disabled users -->
            <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; line-height: 1.8;">
                <h1 style="font-size: 32px; font-weight: 900; color: #1e293b; margin-bottom: 20px;">مناطق التوصيل والخدمة المحلية في مركز فاقوس ومحافظة الشرقية</h1>
                <p style="font-size: 16px; font-weight: 700; color: #64748b; margin-bottom: 30px;">
                    يرحب بكم متجر <strong>سوق العصر</strong>، ويسرنا تزويدكم بتفاصيل تغطية التوصيل والشحن المحلي لجميع طلباتكم. نحن ملتزمون بتقديم أسرع خدمة توصيل للمنظفات، والسلع الاستهلاكية، والمستلزمات المنزلية مباشرة لباب بيتك في فاقوس وكافة القرى المجاورة.
                </p>
                
                <h2 style="font-size: 20px; font-weight: 900; color: #10b981; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 30px;">🏡 قرى ومناطق مركز فاقوس المخدمة بالتوصيل المنزلي ورسومها:</h2>
                <p style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 10px;">
                    نفخر بخدمة أهالينا وتوصيل احتياجاتهم اليومية للقرى والنجوع التالية التابعة لمركز فاقوس ورسومات التوصيل الفعلي المحددة:
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
                    <?php foreach ($delivery_villages as $v): ?>
                        <div style="background: #ffffff; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-weight: 700;">
                            📍 <?php echo htmlspecialchars($v['name']); ?> 
                            <span style="color: #10b981; float: left;"><?php echo htmlspecialchars($v['fee']); ?> ج.م</span>
                        </div>
                    <?php endforeach; ?>
                </div>

                <h2 style="font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 40px;">🛒 كيف تطلب منتجاتك من سوق العصر؟</h2>
                <p style="font-size: 14px; font-weight: 700; color: #475569;">
                    يمكنك تصفح متجرنا بالكامل واختيار منتجاتك المفضلة وإضافتها للسلة، ثم الانتقال لصفحة الدفع وإدخال عنوانك وهاتفك للتوصيل الفوري. تفضل بزيارة <a href="/" style="color: #10b981; font-weight: 900; text-decoration: underline;">الصفحة الرئيسية للمتجر للبدء بالتسوق الآن</a>.
                </p>
            </div>
        <?php else: ?>
            <div id="initial-skeleton" style="padding: 10px;">
                <div class="skeleton" style="height: 60px; border-radius: 20px; margin-bottom: 20px;"></div>
                <div class="skeleton" style="height: 200px; border-radius: 30px; margin-bottom: 20px;"></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="skeleton" style="height: 250px; border-radius: 20px;"></div>
                    <div class="skeleton" style="height: 250px; border-radius: 20px;"></div>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <script>
        window.process = { env: { API_KEY: '<?php echo addslashes($gemini_key); ?>' } };
    </script>

    <?php
    if (!$jsUrl) {
        $jsFiles = glob(__DIR__ . '/dist/assets/index-*.js');
        if ($jsFiles && count($jsFiles) > 0) {
            usort($jsFiles, function($a, $b) { return filemtime($b) - filemtime($a); });
            $jsUrl = 'dist/assets/' . basename($jsFiles[0]);
        }
    }

    if ($jsUrl && file_exists(__DIR__ . '/' . strtok($jsUrl, '?'))) {
        $realJsPath = __DIR__ . '/' . strtok($jsUrl, '?');
        $ver = filemtime($realJsPath);
        echo '<script type="module" crossorigin src="' . strtok($jsUrl, '?') . '?v=' . $ver . '"></script>';
    } else {
        echo '<div style="padding:40px;color:#d32f2f;font-family:sans-serif;direction:rtl;text-align:center;">
                <div style="font-size:60px">⚠️</div>
                <h2 style="margin:20px 0">واجهة المستخدم قيد المعالجة</h2>
                <p>يرجى تشغيل أمر بناء المشروع <b>npm run build</b> في مجلد الخادم لتوليد ملفات العرض الجاهزة.</p>
              </div>';
    }
    ?>
</body>
</html>