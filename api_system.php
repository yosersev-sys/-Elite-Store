<?php
/**
 * System & Settings Module - Fixed Image Optimizer
 */
if (!defined('DB_HOST')) exit;

switch ($action) {
    case 'get_admin_summary':
        if (!isAdmin()) sendErr('غير مصرح');
        $res = [
            'total_revenue' => (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled'")->fetchColumn(),
            'total_customer_debt' => (float)$pdo->query("SELECT SUM(total) FROM orders WHERE status != 'cancelled' AND paymentMethod LIKE '%آجل%'")->fetchColumn(),
            'total_supplier_debt' => (float)$pdo->query("SELECT SUM(balance) FROM suppliers")->fetchColumn(),
            'low_stock_count' => (int)$pdo->query("SELECT COUNT(*) FROM products WHERE stockQuantity < 5")->fetchColumn(),
            'new_orders_count' => (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE createdAt > " . ((time()-86400)*1000))->fetchColumn()
        ];
        sendRes($res);
        break;

    case 'get_store_settings':
        $settings = [];
        foreach ($pdo->query("SELECT * FROM settings")->fetchAll() as $s) $settings[$s['setting_key']] = $s['setting_value'];
        sendRes($settings);
        break;

    case 'update_store_settings':
        if (!isAdmin()) sendErr('غير مصرح');
        foreach ($input as $key => $val) {
            $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->execute([$key, $val, $val]);
        }
        sendRes(['status' => 'success']);
        break;

    case 'get_unoptimized_images_count':
        if (!isAdmin()) sendErr('غير مصرح');
        // نبحث عن الصور التي لا تحتوي على صيغة webP (jpeg, png, etc)
        $stmt = $pdo->query("SELECT COUNT(*) FROM products WHERE images LIKE '%image/jpeg%' OR images LIKE '%image/png%' OR images LIKE '%image/jpg%'");
        sendRes(['count' => (int)$stmt->fetchColumn()]);
        break;

    case 'optimize_images_batch':
        if (!isAdmin()) sendErr('غير مصرح');
        if (!function_exists('imagecreatefromstring')) sendErr('مكتبة GD غير مفعلة على هذا السيرفر');

        // جلب أول 5 منتجات تحتاج تحسين
        $stmt = $pdo->query("SELECT id, name, images FROM products WHERE images LIKE '%image/jpeg%' OR images LIKE '%image/png%' OR images LIKE '%image/jpg%' LIMIT 5");
        $products = $stmt->fetchAll();
        $processed = 0;

        foreach ($products as $p) {
            $imgs = json_decode($p['images'], true);
            if (!$imgs) continue;

            $newImgs = [];
            $changed = false;

            foreach ($imgs as $base64) {
                if (strpos($base64, 'image/webp') !== false) {
                    $newImgs[] = $base64;
                    continue;
                }

                try {
                    // استخراج البيانات من base64
                    $parts = explode(',', $base64);
                    if (count($parts) < 2) { $newImgs[] = $base64; continue; }
                    
                    $data = base64_decode($parts[1]);
                    $source = imagecreatefromstring($data);
                    
                    if ($source) {
                        ob_start();
                        // تحويل إلى WebP بجودة 75%
                        imagewebp($source, null, 75);
                        $webpData = ob_get_clean();
                        imagedestroy($source);
                        
                        $newImgs[] = 'data:image/webp;base64,' . base64_encode($webpData);
                        $changed = true;
                    } else {
                        $newImgs[] = $base64;
                    }
                } catch (Exception $e) {
                    $newImgs[] = $base64;
                }
            }

            if ($changed) {
                $upd = $pdo->prepare("UPDATE products SET images = ? WHERE id = ?");
                $upd->execute([json_encode($newImgs), $p['id']]);
                $processed++;
            }
        }

        // جلب العدد المتبقي
        $remaining = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE images LIKE '%image/jpeg%' OR images LIKE '%image/png%' OR images LIKE '%image/jpg%'")->fetchColumn();
        
        sendRes([
            'status' => 'success', 
            'processed' => $processed, 
            'remaining' => $remaining
        ]);
        break;

    case 'generate_sitemap':
        if (!isAdmin()) sendErr('غير مصرح');
        // ... (كود الـ sitemap الأصلي يظل كما هو)
        sendRes(['status' => 'success']);
        break;
}