<?php
/**
 * سكربت ترحيل الصور - سوق العصر
 * يقوم بتحويل كافة الصور الحالية المخزنة بصيغة Base64 إلى ملفات حقيقية داخل مجلد uploads/
 * السكربت آمن وقابل لإعادة التشغيل (Idempotent)
 */
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

// السماح بالتشغيل من سطر الأوامر أو للمشرف أو بمفتاح سري
if (php_sapi_name() !== 'cli') {
    session_start();
    $secret = $_GET['secret'] ?? '';
    if ($secret !== 'souq_migration_12345' && ($_SESSION['user']['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'غير مصرح للتشغيل. يجب أن تكون مسجلاً كمسؤول أو تستخدم المفتاح السري لتشغيل هذا السكربت.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function compressAndResizeImage($data, $ext, $relativePath) {
    if (!extension_loaded('gd')) {
        return file_put_contents($relativePath, $data) !== false;
    }

    $srcImg = imagecreatefromstring($data);
    if (!$srcImg) {
        return file_put_contents($relativePath, $data) !== false;
    }

    $width = imagesx($srcImg);
    $height = imagesy($srcImg);
    $maxDim = 600; // Limit image dimensions to 600px max for extreme bandwidth savings

    if ($width > $maxDim || $height > $maxDim) {
        if ($width > $height) {
            $newWidth = $maxDim;
            $newHeight = (int)($height * ($maxDim / $width));
        } else {
            $newHeight = $maxDim;
            $newWidth = (int)($width * ($maxDim / $height));
        }

        $dstImg = imagecreatetruecolor($newWidth, $newHeight);
        
        // Preserve transparency for PNG/WebP
        if ($ext === 'png' || $ext === 'webp') {
            imagealphablending($dstImg, false);
            imagesavealpha($dstImg, true);
            $transparent = imagecolorallocatealpha($dstImg, 255, 255, 255, 127);
            imagefilledrectangle($dstImg, 0, 0, $newWidth, $newHeight, $transparent);
        }

        imagecopyresampled($dstImg, $srcImg, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($srcImg);
        $srcImg = $dstImg;
    }

    // Save with compression (quality 75%)
    $success = false;
    if ($ext === 'jpg' || $ext === 'jpeg') {
        $success = imagejpeg($srcImg, $relativePath, 75);
    } elseif ($ext === 'png') {
        $success = imagepng($srcImg, $relativePath, 6);
    } elseif ($ext === 'webp') {
        $success = imagewebp($srcImg, $relativePath, 75);
    } elseif ($ext === 'gif') {
        $success = imagegif($srcImg, $relativePath);
    } else {
        $success = imagejpeg($srcImg, $relativePath, 75);
    }

    imagedestroy($srcImg);
    return $success;
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
    if (compressAndResizeImage($data, $ext, $relativePath)) {
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
