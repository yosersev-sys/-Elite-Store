<?php
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'get_store_settings':
        $rows = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
        $res = [];
        foreach ($rows as $r) $res[$r['setting_key']] = $r['setting_value'];
        sendRes($res);
        break;

    case 'update_store_settings':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        foreach ($input as $k => $v) {
            $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?")->execute([$k, $v, $v]);
        }
        sendRes(['status' => 'success']);
        break;

    case 'generate_sitemap':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $prods = $pdo->query("SELECT id FROM products")->fetchAll();
        $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        $baseUrl = "https://" . $_SERVER['HTTP_HOST'];
        $xml .= "<url><loc>$baseUrl/</loc><priority>1.0</priority></url>";
        foreach ($prods as $p) $xml .= "<url><loc>$baseUrl/#product-details?id={$p['id']}</loc><priority>0.8</priority></url>";
        $xml .= '</urlset>';
        file_put_contents('../sitemap.xml', $xml);
        sendRes(['status' => 'success']);
        break;
}
?>