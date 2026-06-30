<?php
/**
 * سكربت ترحيل الصور - سوق العصر
 * يقوم بتحويل كافة الصور الحالية المخزنة بصيغة Base64 إلى ملفات حقيقية داخل مجلد uploads/
 * السكربت آمن وقابل لإعادة التشغيل (Idempotent)
 */
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// السماح بالتشغيل من سطر الأوامر أو للمشرف فقط
if (php_sapi_name() !== 'cli') {
    session_start();
    if (($_SESSION['user']['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'غير مصرح للتشغيل. يجب أن تكون مسجلاً كمسؤول لتشغيل هذا السكربت.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function migrateBase64Image($base64Str, $subfolder) {
    // 1. إذا كانت الصورة ليست Base64 (أي مسار ملف بالفعل)، نتخطاها
    if (empty($base64Str) || strpos($base64Str, 'data:image/') !== 0) {
        return $base64Str;
    }

    if (!preg_match('/^data:image\/(\w+);base64,(.+)$/is', $base64Str, $matches)) {
        return null;
    }

    $ext = strtolower($matches[1]);
    $data = base64_decode($matches[2]);
    if (!$data) return null;

    $allowedTypes = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
    if (!in_array($ext, $allowedTypes)) {
        return null;
    }
    if ($ext === 'jpeg') {
        $ext = 'jpg';
    }

    // توليد اسم عشوائي آمن
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    $dir = 'uploads/' . $subfolder;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $relativePath = $dir . '/' . $filename;
    if (file_put_contents($relativePath, $data) !== false) {
        return $relativePath;
    }

    return null;
}

$migratedProducts = 0;
$migratedCategories = 0;
$totalImagesSaved = 0;
$errors = [];

try {
    $pdo->beginTransaction();

    // 1. ترحيل صور المنتجات
    $products = $pdo->query("SELECT id, name, images FROM products")->fetchAll();
    foreach ($products as $p) {
        $imgs = json_decode($p['images'] ?? '[]', true) ?: [];
        if (!is_array($imgs)) continue;
        
        $newImgs = [];
        $changed = false;
        foreach ($imgs as $img) {
            if (strpos($img, 'data:image/') === 0) {
                $filePath = migrateBase64Image($img, 'products');
                if ($filePath) {
                    $newImgs[] = $filePath;
                    $totalImagesSaved++;
                    $changed = true;
                } else {
                    $errors[] = "فشل ترحيل صورة للمنتج: " . $p['name'];
                    $newImgs[] = $img; // الاحتفاظ بالقيمة في حال الفشل
                }
            } else {
                $newImgs[] = $img; // مسار ملف بالفعل، تخطي الترحيل
            }
        }

        if ($changed) {
            $stmt = $pdo->prepare("UPDATE products SET images = ? WHERE id = ?");
            $stmt->execute([json_encode($newImgs), $p['id']]);
            $migratedProducts++;
        }
    }

    // 2. ترحيل صور الأقسام
    $categories = $pdo->query("SELECT id, name, image FROM categories")->fetchAll();
    foreach ($categories as $c) {
        $img = $c['image'] ?? '';
        if (strpos($img, 'data:image/') === 0) {
            $filePath = migrateBase64Image($img, 'categories');
            if ($filePath) {
                $stmt = $pdo->prepare("UPDATE categories SET image = ? WHERE id = ?");
                $stmt->execute([$filePath, $c['id']]);
                $totalImagesSaved++;
                $migratedCategories++;
            } else {
                $errors[] = "فشل ترحيل صورة القسم: " . $c['name'];
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        'status' => 'success',
        'migrated_products' => $migratedProducts,
        'migrated_categories' => $migratedCategories,
        'total_images_saved' => $totalImagesSaved,
        'errors' => $errors,
        'message' => 'تمت عملية ترحيل الصور وتحويلها لملفات بنجاح!'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'فشلت عملية الترحيل: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
