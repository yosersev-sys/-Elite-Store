<?php
/**
 * System & Settings Module - Enhanced Image Optimizer v2.0
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
        // استعلام أكثر قوة يبحث عن أي منتج يحتوي على صور لا تبدأ بـ image/webp
        $sql = "SELECT COUNT(*) FROM products 
                WHERE images IS NOT NULL 
                AND images != '[]' 
                AND (images LIKE '%image/jpeg%' OR images LIKE '%image/png%' OR images LIKE '%image/jpg%' OR images LIKE '%base64%') 
                AND images NOT LIKE '%image/webp;base64%'";
        
        $count = (int)$pdo->query($sql)->fetchColumn();
        
        sendRes([
            'count' => $count,
            'gd_enabled' => function_exists('imagecreatefromstring'),
            'webp_supported' => function_exists('imagewebp')
        ]);
        break;

    case 'optimize_images_batch':
        if (!isAdmin()) sendErr('غير مصرح');
        if (!function_exists('imagecreatefromstring')) sendErr('مكتبة GD غير مفعلة على هذا السيرفر. يرجى تفعيلها من لوحة تحكم الاستضافة (PHP Extensions).');

        // جلب أول 3 منتجات (تقليل العدد لضمان عدم تجاوز وقت السيرفر)
        $sql = "SELECT id, name, images FROM products 
                WHERE images IS NOT NULL 
                AND (images LIKE '%image/jpeg%' OR images LIKE '%image/png%' OR images LIKE '%image/jpg%') 
                LIMIT 3";
                
        $products = $pdo->query($sql)->fetchAll();
        $processedCount = 0;

        foreach ($products as $p) {
            $imgs = json_decode($p['images'], true);
            if (!$imgs || !is_array($imgs)) continue;

            $newImgs = [];
            $hasChanged = false;

            foreach ($imgs as $base64) {
                // إذا كانت الصورة ويب بي فعلاً نتخطاها
                if (strpos($base64, 'image/webp') !== false) {
                    $newImgs[] = $base64;
                    continue;
                }

                try {
                    $parts = explode(',', $base64);
                    if (count($parts) < 2) { $newImgs[] = $base64; continue; }
                    
                    $data = base64_decode($parts[1]);
                    $source = @imagecreatefromstring($data);
                    
                    if ($source) {
                        ob_start();
                        // تحويل مع ضغط جيد 80%
                        imagewebp($source, null, 80);
                        $webpData = ob_get_clean();
                        imagedestroy($source);
                        
                        $newImgs[] = 'data:image/webp;base64,' . base64_encode($webpData);
                        $hasChanged = true;
                    } else {
                        $newImgs[] = $base64;
                    }
                } catch (Exception $e) {
                    $newImgs[] = $base64;
                }
            }

            if ($hasChanged) {
                $upd = $pdo->prepare("UPDATE products SET images = ? WHERE id = ?");
                $upd->execute([json_encode($newImgs), $p['id']]);
                $processedCount++;
            }
        }

        // تحديث العدد المتبقي
        $remaining = (int)$pdo->query("SELECT COUNT(*) FROM products WHERE (images LIKE '%image/jpeg%' OR images LIKE '%image/png%' OR images LIKE '%image/jpg%')")->fetchColumn();
        
        sendRes([
            'status' => 'success', 
            'processed' => $processedCount, 
            'remaining' => $remaining
        ]);
        break;

    case 'generate_sitemap':
        if (!isAdmin()) sendErr('غير مصرح');
        // ... sitemap logic
        sendRes(['status' => 'success']);
        break;
}