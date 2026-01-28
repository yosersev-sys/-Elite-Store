
<?php
// إعدادات الـ API
header('Content-Type: application/json');
$dataFile = 'database.json';

// إنشاء الملف إذا لم يكن موجوداً
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([
        ["id" => 1, "name" => "ساعة ذكية برو", "price" => 250, "images" => ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600"]]
    ]));
}

$action = $_GET['action'] ?? '';

if ($action == 'get_products') {
    echo file_get_contents($dataFile);
}

if ($action == 'add_product') {
    $newProduct = json_decode(file_get_contents('php://input'), true);
    $currentData = json_decode(file_get_contents($dataFile), true);
    $currentData[] = $newProduct;
    file_put_contents($dataFile, json_encode($currentData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['status' => 'success']);
}
?>
