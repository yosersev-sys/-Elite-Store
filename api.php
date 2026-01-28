
<?php
header('Content-Type: application/json');
$productsFile = 'products.json';
$catsFile = 'categories.json';

// تهيئة البيانات الافتراضية إذا لم توجد
if (!file_exists($productsFile)) {
    file_put_contents($productsFile, json_encode([
        ["id" => 1, "name" => "ساعة ذكية ألترا", "price" => 450, "description" => "شاشة أموليد متطورة مع تتبع للنشاط الرياضي والقلب.", "images" => ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600"]]
    ], JSON_UNESCAPED_UNICODE));
}
if (!file_exists($catsFile)) {
    file_put_contents($catsFile, json_encode([
        ["id" => "cat_1", "name" => "إلكترونيات"],
        ["id" => "cat_2", "name" => "أزياء"]
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
        $data = json_decode(file_get_contents($productsFile), true);
        $data[] = $new;
        file_put_contents($productsFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['status' => 'success']);
        break;
    case 'delete_product':
        $req = json_decode(file_get_contents('php://input'), true);
        $data = json_decode(file_get_contents($productsFile), true);
        $newData = array_filter($data, function($p) use ($req) { return $p['id'] != $req['id']; });
        file_put_contents($productsFile, json_encode(array_values($newData), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['status' => 'success']);
        break;
}
?>
