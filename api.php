
<?php
// إعدادات الـ API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$productsFile = 'products.json';
$catsFile = 'categories.json';

// تهيئة البيانات إذا لم توجد
if (!file_exists($productsFile)) {
    file_put_contents($productsFile, json_encode([
        ["id" => 1, "name" => "سماعة بلوتوث لاسلكية", "price" => 120, "categoryId" => "cat_1", "description" => "سماعة عالية الجودة مع عزل للضجيج وبطارية تدوم طويلاً.", "images" => ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600"]],
        ["id" => 2, "name" => "ساعة رياضية ذكية", "price" => 280, "categoryId" => "cat_1", "description" => "تتبع نبضات القلب والنشاط البدني مع شاشة ملونة.", "images" => ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600"]]
    ], JSON_UNESCAPED_UNICODE));
}

if (!file_exists($catsFile)) {
    file_put_contents($catsFile, json_encode([
        ["id" => "cat_1", "name" => "إلكترونيات"],
        ["id" => "cat_2", "name" => "أزياء"],
        ["id" => "cat_3", "name" => "منزل"]
    ], JSON_UNESCAPED_UNICODE));
}

$action = $_GET['action'] ?? '';

switch($action) {
    case 'get_products':
        echo file_get_contents($productsFile);
        break;
        
    case 'get_categories':
        echo file_get_contents($catsFile);
        break;
        
    case 'add_product':
        $new = json_decode(file_get_contents('php://input'), true);
        if ($new) {
            $data = json_decode(file_get_contents($productsFile), true);
            $data[] = $new;
            file_put_contents($productsFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode(['status' => 'success']);
        }
        break;
        
    case 'delete_product':
        $req = json_decode(file_get_contents('php://input'), true);
        if (isset($req['id'])) {
            $data = json_decode(file_get_contents($productsFile), true);
            $newData = array_filter($data, function($p) use ($req) {
                return (string)$p['id'] !== (string)$req['id'];
            });
            file_put_contents($productsFile, json_encode(array_values($newData), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode(['status' => 'success']);
        }
        break;
}
?>
