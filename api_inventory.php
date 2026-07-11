<?php
/**
 * Inventory & Products Module - Fix Image Library
 */
if (!defined('DB_HOST')) exit;

// ضمان وجود الجداول والأعمدة الجديدة تلقائياً (Auto-healing Schema)
try {
    $q = $pdo->query("SHOW COLUMNS FROM products LIKE 'reorderLevel'");
    if (!$q->fetch()) {
        $pdo->exec("ALTER TABLE products ADD COLUMN reorderLevel DECIMAL(10,2) DEFAULT 5.00");
    }
} catch (Exception $e) {}

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS product_units (
        id VARCHAR(50) PRIMARY KEY,
        productId VARCHAR(50) NOT NULL,
        unitName VARCHAR(100) NOT NULL,
        barcode VARCHAR(100) UNIQUE NULL,
        purchasePrice DECIMAL(10,2) DEFAULT 0.00,
        salePrice DECIMAL(10,2) DEFAULT 0.00,
        conversionFactor DECIMAL(10,2) DEFAULT 1.00,
        isDefault TINYINT(1) DEFAULT 0,
        isActive TINYINT(1) DEFAULT 1,
        INDEX idx_productId (productId),
        INDEX idx_barcode (barcode)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    $pdo->exec("ALTER TABLE product_units MODIFY COLUMN barcode VARCHAR(100) UNIQUE NULL");
} catch (Exception $e) {}


function isUnitUsedInDB($pdo, $unitId) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE items LIKE ?");
    $stmt->execute(['%"selectedUnitId":"' . $unitId . '"%']);
    if ((int)$stmt->fetchColumn() > 0) return true;

    $stmtLog = $pdo->prepare("SELECT COUNT(*) FROM audit_logs WHERE details LIKE ?");
    $stmtLog->execute(['%"selectedUnitId":"' . $unitId . '"%']);
    if ((int)$stmtLog->fetchColumn() > 0) return true;

    return false;
}

function getFormattedProduct($pdo, $productId) {
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $p = $stmt->fetch();
    if (!$p) return null;

    $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
    $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
    $p['price'] = (float)$p['price'];
    $p['stockQuantity'] = (float)$p['stockQuantity'];
    $p['wholesalePrice'] = (float)$p['wholesalePrice'];
    $p['reorderLevel'] = (float)$p['reorderLevel'];

    $unitsStmt = $pdo->prepare("SELECT * FROM product_units WHERE productId = ?");
    $unitsStmt->execute([$productId]);
    $units = $unitsStmt->fetchAll();
    $p['units'] = [];

    $defaultUnit = null;
    foreach ($units as $u) {
        $unitObj = [
            'id' => $u['id'],
            'productId' => $u['productId'],
            'unitName' => $u['unitName'],
            'barcode' => $u['barcode'],
            'purchasePrice' => (float)$u['purchasePrice'],
            'salePrice' => (float)$u['salePrice'],
            'conversionFactor' => (float)$u['conversionFactor'],
            'isDefault' => (int)$u['isDefault'],
            'isActive' => (int)$u['isActive']
        ];
        $p['units'][] = $unitObj;

        if ($unitObj['isDefault'] == 1 || $unitObj['conversionFactor'] == 1) {
            if (!$defaultUnit || $unitObj['isDefault'] == 1) {
                $defaultUnit = $unitObj;
            }
        }
    }

    $p['baseUnit'] = $p['unit'];
    if ($defaultUnit) {
        $p['price'] = $defaultUnit['salePrice'];
        $p['wholesalePrice'] = $defaultUnit['purchasePrice'];
        $p['unit'] = $defaultUnit['unitName'];
        $p['barcode'] = $defaultUnit['barcode'];
    }
    return $p;
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

function saveBase64Image($base64Str, $subfolder) {
    if (empty($base64Str)) return '';
    
    if (strpos($base64Str, 'data:image/') !== 0) {
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

    $maxSize = 10 * 1024 * 1024;
    if (strlen($data) > $maxSize) {
        return null;
    }

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

function deleteImageFile($path) {
    if (empty($path)) return;
    if (!is_dir('uploads')) {
        mkdir('uploads', 0755, true);
    }
    $realUploadsPath = realpath('uploads');
    $realPath = realpath($path);
    if ($realPath && $realUploadsPath && strpos($realPath, $realUploadsPath) === 0 && is_file($realPath)) {
        unlink($realPath);
    }
}

switch ($action) {
    case 'get_products':
        $prods = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC")->fetchAll();
        $unitsStmt = $pdo->prepare("SELECT * FROM product_units WHERE productId = ?");
        
        foreach ($prods as &$p) {
            $p['images'] = json_decode($p['images'] ?? '[]', true) ?: [];
            $p['batches'] = json_decode($p['batches'] ?? '[]', true) ?: [];
            $p['price'] = (float)$p['price'];
            $p['stockQuantity'] = (float)$p['stockQuantity'];
            
            $unitsStmt->execute([$p['id']]);
            $units = $unitsStmt->fetchAll();
            $p['units'] = [];
            
            $defaultUnit = null;
            foreach ($units as $u) {
                $unitObj = [
                    'id' => $u['id'],
                    'productId' => $u['productId'],
                    'unitName' => $u['unitName'],
                    'barcode' => $u['barcode'],
                    'purchasePrice' => (float)$u['purchasePrice'],
                    'salePrice' => (float)$u['salePrice'],
                    'conversionFactor' => (float)$u['conversionFactor'],
                    'isDefault' => (int)$u['isDefault'],
                    'isActive' => (int)$u['isActive']
                ];
                $p['units'][] = $unitObj;
                
                if ($unitObj['isDefault'] == 1 || $unitObj['conversionFactor'] == 1) {
                    if (!$defaultUnit || $unitObj['isDefault'] == 1) {
                        $defaultUnit = $unitObj;
                    }
                }
            }
            
            $p['baseUnit'] = $p['unit'];
            if ($defaultUnit) {
                $p['price'] = $defaultUnit['salePrice'];
                $p['wholesalePrice'] = $defaultUnit['purchasePrice'];
                $p['unit'] = $defaultUnit['unitName'];
                $p['barcode'] = $defaultUnit['barcode'];
            }
        }
        sendRes($prods);
        break;

    case 'get_all_images':
        // جلب الصور من كافة المنتجات لعرضها في المكتبة
        $prods = $pdo->query("SELECT name, images FROM products")->fetchAll();
        $res = [];
        foreach ($prods as $p) {
            $imgs = json_decode($p['images'] ?? '[]', true);
            if ($imgs && count($imgs) > 0) {
                // نأخذ الصورة الأولى فقط كمعاينة لكل منتج
                $res[] = ['url' => $imgs[0], 'productName' => $p['name']];
            }
        }
        sendRes($res);
        break;

    case 'add_product':
        $userId = $_SESSION['user']['id'] ?? '';
        $role = $_SESSION['user']['role'] ?? '';
        $hasPerm = false;
        if ($role === 'admin') {
            $hasPerm = true;
        } else if (!empty($userId)) {
            $uPerms = $pdo->prepare("SELECT permissions FROM users WHERE id = ?");
            $uPerms->execute([$userId]);
            $permsList = $uPerms->fetchColumn();
            if ($permsList) {
                $perms = array_map('trim', explode(',', $permsList));
                if (in_array('add_products', $perms)) {
                    $hasPerm = true;
                }
            }
        }
        if (!$hasPerm) {
            sendErr('عذراً، لا تملك الصلاحيات الكافية لإضافة منتجات جديدة.');
        }

        $barcode = !empty($input['barcode']) ? trim($input['barcode']) : null;
        if ($barcode) {
            $checkBarcode = $pdo->prepare("SELECT productId FROM product_units WHERE barcode = ? AND isActive = 1");
            $checkBarcode->execute([$barcode]);
            $existingUnit = $checkBarcode->fetch();
            if ($existingUnit) {
                $stmtProd = $pdo->prepare("SELECT * FROM products WHERE id = ?");
                $stmtProd->execute([$existingUnit['productId']]);
                $existingProduct = $stmtProd->fetch();
                if ($existingProduct) {
                    $existingProduct['images'] = json_decode($existingProduct['images'] ?? '[]', true) ?: [];
                    $existingProduct['batches'] = json_decode($existingProduct['batches'] ?? '[]', true) ?: [];
                    $existingProduct['price'] = (float)$existingProduct['price'];
                    $existingProduct['stockQuantity'] = (float)$existingProduct['stockQuantity'];
                    sendRes([
                        'status' => 'barcode_exists',
                        'message' => 'هذا الباركود مسجل بالفعل لوحدة منتج آخر.',
                        'product' => $existingProduct
                    ]);
                }
            }
        }

        $productId = $input['id'] ?? ('prod_' . time() . '_' . rand(100, 999));
        $reorderLevel = isset($input['reorderLevel']) ? (float)$input['reorderLevel'] : 5.00;
        
        $images = [];
        if (isset($input['images']) && is_array($input['images'])) {
            foreach ($input['images'] as $img) {
                $saved = saveBase64Image($img, 'products');
                if ($saved) {
                    $images[] = $saved;
                }
            }
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, batches, reorderLevel, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $productId, $input['name'], $input['description'] ?? '', $input['price'] ?? 0.00, $input['wholesalePrice'] ?? 0.00,
                $input['categoryId'], $input['supplierId'] ?? null, json_encode($images),
                $input['stockQuantity'] ?? 0, $input['unit'] ?? 'piece', $barcode, '[]', $reorderLevel, time()*1000
            ]);
            
            if (!empty($input['units']) && is_array($input['units'])) {
                $insertUnit = $pdo->prepare("INSERT INTO product_units (id, productId, unitName, barcode, purchasePrice, salePrice, conversionFactor, isDefault, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)");
                foreach ($input['units'] as $u) {
                    $uId = !empty($u['id']) ? $u['id'] : ('unit_' . time() . '_' . rand(100, 999));
                    $uBarcode = !empty($u['barcode']) ? trim($u['barcode']) : null;
                    $insertUnit->execute([
                        $uId,
                        $productId,
                        $u['unitName'],
                        $uBarcode,
                        $u['purchasePrice'] ?: 0.00,
                        $u['salePrice'] ?: 0.00,
                        $u['conversionFactor'] ?: 1.00,
                        $u['isDefault'] ? 1 : 0
                    ]);
                }
            } else {
                $unitName = !empty($input['unit']) ? $input['unit'] : 'قطعة';
                $insertUnit = $pdo->prepare("INSERT INTO product_units (id, productId, unitName, barcode, purchasePrice, salePrice, conversionFactor, isDefault, isActive) VALUES (?, ?, ?, ?, ?, ?, 1.00, 1, 1)");
                $insertUnit->execute([
                    'unit_' . $productId . '_base',
                    $productId,
                    $unitName,
                    $barcode,
                    $input['wholesalePrice'] ?: 0.00,
                    $input['price'] ?: 0.00
                ]);
            }
            
            $activeShift = $pdo->query("SELECT id FROM shifts WHERE status = 'open' LIMIT 1")->fetch();
            $shiftId = $activeShift ? $activeShift['id'] : null;
            
            $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'ADD_PRODUCT_QUICK', ?, ?)");
            $stmtLog->execute([
                $userId,
                $shiftId,
                json_encode([
                    'productId' => $productId,
                    'name' => $input['name'],
                    'barcode' => $barcode,
                    'stockQuantity' => $input['stockQuantity'] ?? 0,
                    'price' => $input['price'] ?? 0.00
                ], JSON_UNESCAPED_UNICODE),
                time() * 1000
            ]);
            
            $pdo->commit();
            sendRes(['status' => 'success', 'product' => getFormattedProduct($pdo, $productId)]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل في حفظ المنتج الجديد: ' . $e->getMessage());
        }
        break;

    case 'update_product':
        if (!isAdmin()) sendErr('غير مصرح');
        $productId = $input['id'];
        $reorderLevel = isset($input['reorderLevel']) ? (float)$input['reorderLevel'] : 5.00;
        
        $stmtOld = $pdo->prepare("SELECT images FROM products WHERE id = ?");
        $stmtOld->execute([$productId]);
        $oldProd = $stmtOld->fetch();
        $oldImages = [];
        if ($oldProd) {
            $oldImages = json_decode($oldProd['images'] ?? '[]', true) ?: [];
        }

        $newImages = [];
        if (isset($input['images']) && is_array($input['images'])) {
            foreach ($input['images'] as $img) {
                $saved = saveBase64Image($img, 'products');
                if ($saved) {
                    $newImages[] = $saved;
                }
            }
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, wholesalePrice=?, categoryId=?, supplierId=?, images=?, stockQuantity=?, unit=?, barcode=?, batches=?, reorderLevel=? WHERE id=?");
            $stmt->execute([
                $input['name'], $input['description'], $input['price'] ?? 0.00, $input['wholesalePrice'] ?? 0.00,
                $input['categoryId'], $input['supplierId'], json_encode($newImages),
                $input['stockQuantity'], $input['unit'], $input['barcode'], json_encode($input['batches'] ?? []), $reorderLevel, $productId
            ]);
            
            $stmtExisting = $pdo->prepare("SELECT * FROM product_units WHERE productId = ?");
            $stmtExisting->execute([$productId]);
            $existingUnits = $stmtExisting->fetchAll();
            $existingUnitsMap = [];
            foreach ($existingUnits as $eu) {
                $existingUnitsMap[$eu['id']] = $eu;
            }
            
            $incomingUnitIds = [];
            
            if (!empty($input['units']) && is_array($input['units'])) {
                $insertUnit = $pdo->prepare("INSERT INTO product_units (id, productId, unitName, barcode, purchasePrice, salePrice, conversionFactor, isDefault, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $updateUnitWithFactor = $pdo->prepare("UPDATE product_units SET unitName=?, barcode=?, purchasePrice=?, salePrice=?, conversionFactor=?, isDefault=?, isActive=? WHERE id=?");
                $updateUnitWithoutFactor = $pdo->prepare("UPDATE product_units SET unitName=?, barcode=?, purchasePrice=?, salePrice=?, isDefault=?, isActive=? WHERE id=?");
                
                foreach ($input['units'] as $u) {
                    $uId = $u['id'] ?? '';
                    $uBarcode = !empty($u['barcode']) ? trim($u['barcode']) : null;
                    if (!empty($uId) && isset($existingUnitsMap[$uId])) {
                        $incomingUnitIds[] = $uId;
                        $oldUnit = $existingUnitsMap[$uId];
                        
                        $factorChanged = (abs((float)$oldUnit['conversionFactor'] - (float)$u['conversionFactor']) > 0.0001);
                        if ($factorChanged && isUnitUsedInDB($pdo, $uId)) {
                            throw new Exception("عذراً، يمنع تعديل معامل التحويل لوحدة مستخدمة سابقاً في حركات مبيعات/مخزون ({$oldUnit['unitName']}). يرجى إنشاء وحدة جديدة بدلاً منها.");
                        }
                        
                        if ($factorChanged) {
                            $updateUnitWithFactor->execute([
                                $u['unitName'],
                                $uBarcode,
                                $u['purchasePrice'] ?: 0.00,
                                $u['salePrice'] ?: 0.00,
                                $u['conversionFactor'] ?: 1.00,
                                $u['isDefault'] ? 1 : 0,
                                $u['isActive'] ? 1 : 0,
                                $uId
                            ]);
                        } else {
                            $updateUnitWithoutFactor->execute([
                                $u['unitName'],
                                $uBarcode,
                                $u['purchasePrice'] ?: 0.00,
                                $u['salePrice'] ?: 0.00,
                                $u['isDefault'] ? 1 : 0,
                                $u['isActive'] ? 1 : 0,
                                $uId
                            ]);
                        }
                    } else {
                        $newUId = 'unit_' . time() . '_' . rand(100, 999);
                        $incomingUnitIds[] = $newUId;
                        $insertUnit->execute([
                            $newUId,
                            $productId,
                            $u['unitName'],
                            $uBarcode,
                            $u['purchasePrice'] ?: 0.00,
                            $u['salePrice'] ?: 0.00,
                            $u['conversionFactor'] ?: 1.00,
                            $u['isDefault'] ? 1 : 0,
                            $u['isActive'] ? 1 : 0
                        ]);
                    }
                }
            }
            
            foreach ($existingUnits as $eu) {
                if (!in_array($eu['id'], $incomingUnitIds)) {
                    if (isUnitUsedInDB($pdo, $eu['id'])) {
                        $pdo->prepare("UPDATE product_units SET isActive = 0 WHERE id = ?")->execute([$eu['id']]);
                    } else {
                        $pdo->prepare("DELETE FROM product_units WHERE id = ?")->execute([$eu['id']]);
                    }
                }
            }
            
            $pdo->commit();

            $imagesToDelete = array_diff($oldImages, $newImages);
            foreach ($imagesToDelete as $delImg) {
                deleteImageFile($delImg);
            }

            sendRes(['status' => 'success', 'product' => getFormattedProduct($pdo, $productId)]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr($e->getMessage());
        }
        break;

    case 'delete_product':
        if (!isAdmin()) sendErr('غير مصرح');
        $productId = $_GET['id'] ?? '';
        
        $units = $pdo->prepare("SELECT id FROM product_units WHERE productId = ?");
        $units->execute([$productId]);
        foreach ($units->fetchAll() as $u) {
            if (isUnitUsedInDB($pdo, $u['id'])) {
                sendErr('عذراً، لا يمكن حذف هذا المنتج لوجود مبيعات مرتبطة بأحد وحداته.');
            }
        }
        
        $stmtOld = $pdo->prepare("SELECT images FROM products WHERE id = ?");
        $stmtOld->execute([$productId]);
        $prod = $stmtOld->fetch();
        $oldImages = [];
        if ($prod) {
            $oldImages = json_decode($prod['images'] ?? '[]', true) ?: [];
        }

        $pdo->beginTransaction();
        try {
            $pdo->prepare("DELETE FROM product_units WHERE productId = ?")->execute([$productId]);
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $pdo->commit();
            
            foreach ($oldImages as $img) {
                deleteImageFile($img);
            }

            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل حذف المنتج: ' . $e->getMessage());
        }
        break;

    case 'get_categories':
        sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC")->fetchAll());
        break;

    case 'add_category':
        if (!isAdmin()) sendErr('غير مصرح');
        $img = saveBase64Image($input['image'] ?? '', 'categories');
        $stmt = $pdo->prepare("INSERT INTO categories (id, name, image, sortOrder) VALUES (?,?,?,?)");
        $stmt->execute([$input['id'], $input['name'], $img, $input['sortOrder'] ?? 0]);
        sendRes(['status' => 'success']);
        break;

    case 'update_category':
        if (!isAdmin()) sendErr('غير مصرح');
        $stmtOld = $pdo->prepare("SELECT image FROM categories WHERE id = ?");
        $stmtOld->execute([$input['id']]);
        $oldImg = $stmtOld->fetchColumn();

        $newImg = saveBase64Image($input['image'] ?? '', 'categories');

        $stmt = $pdo->prepare("UPDATE categories SET name=?, image=?, isActive=?, sortOrder=? WHERE id=?");
        $stmt->execute([$input['name'], $newImg, $input['isActive'] ? 1 : 0, $input['sortOrder'], $input['id']]);
        
        if ($oldImg && $oldImg !== $newImg) {
            deleteImageFile($oldImg);
        }
        sendRes(['status' => 'success']);
        break;

    case 'delete_category':
        if (!isAdmin()) sendErr('غير مصرح');
        $id = $_GET['id'] ?? '';
        
        $stmtOld = $pdo->prepare("SELECT image FROM categories WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldImg = $stmtOld->fetchColumn();

        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($oldImg) {
            deleteImageFile($oldImg);
        }
        sendRes(['status' => 'success']);
        break;

    case 'adjust_stock':
        if (!isAdmin()) sendErr('غير مصرح');
        $productId = $input['productId'] ?? '';
        $adjustment = (float)($input['adjustment'] ?? 0);
        $reason = trim($input['reason'] ?? '');
        $userId = $_SESSION['user']['id'] ?? '';
        
        if (empty($productId)) sendErr('معرف المنتج مطلوب');
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("SELECT name, stockQuantity, unit FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $prod = $stmt->fetch();
            if (!$prod) throw new Exception('المنتج غير موجود');
            
            $oldStock = (float)$prod['stockQuantity'];
            $newStock = max(0, $oldStock + $adjustment);
            
            $stmtUpdate = $pdo->prepare("UPDATE products SET stockQuantity = ? WHERE id = ?");
            $stmtUpdate->execute([$newStock, $productId]);
            
            $activeShift = $pdo->query("SELECT id FROM shifts WHERE status = 'open' LIMIT 1")->fetch();
            $shiftId = $activeShift ? $activeShift['id'] : null;
            
            $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'STOCK_ADJUSTMENT', ?, ?)");
            $stmtLog->execute([
                $userId,
                $shiftId,
                json_encode([
                    'productId' => $productId,
                    'productName' => $prod['name'],
                    'oldStock' => $oldStock,
                    'adjustment' => $adjustment,
                    'newStock' => $newStock,
                    'unitName' => $prod['unit'] ?: 'قطعة',
                    'reason' => $reason
                ], JSON_UNESCAPED_UNICODE),
                time() * 1000
            ]);
            
            $pdo->commit();
            sendRes(['status' => 'success', 'newStock' => $newStock]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل تعديل المخزون: ' . $e->getMessage());
        }
        break;

    case 'get_product_history':
        $productId = $_GET['productId'] ?? '';
        if (empty($productId)) sendErr('معرف المنتج مطلوب');
        
        $stmtOrders = $pdo->prepare("SELECT id, customerName, items, status, createdAt FROM orders WHERE items LIKE ? ORDER BY createdAt DESC");
        $stmtOrders->execute(['%"id":"' . $productId . '"%']);
        $orders = $stmtOrders->fetchAll();
        
        $history = [];
        
        foreach ($orders as $o) {
            $items = json_decode($o['items'] ?? '[]', true) ?: [];
            foreach ($items as $item) {
                if ($item['id'] === $productId) {
                    $qty = (float)($item['quantity'] ?? 0);
                    $unitName = $item['selectedUnitName'] ?? $item['unit'] ?? 'قطعة';
                    
                    $type = 'SALE';
                    $label = 'بيع صنف';
                    if ($o['status'] === 'cancelled') {
                        $type = 'RETURN';
                        $label = 'مرتجع بيع';
                    }
                    
                    $history[] = [
                        'id' => $o['id'],
                        'type' => $type,
                        'label' => $label,
                        'qty' => $qty,
                        'unit' => $unitName,
                        'price' => (float)($item['price'] ?? 0),
                        'total' => $qty * (float)($item['price'] ?? 0),
                        'party' => $o['customerName'] ?: 'عميل نقدي',
                        'createdAt' => (int)$o['createdAt'],
                        'notes' => 'فاتورة رقم: ' . $o['id']
                    ];
                }
            }
        }
        
        $stmtLogs = $pdo->prepare("
            SELECT al.*, u.name as userName 
            FROM audit_logs al 
            LEFT JOIN users u ON al.userId = u.id 
            WHERE (al.action = 'STOCK_ADJUSTMENT' AND al.details LIKE ?) 
               OR (al.action = 'ADD_PRODUCT_QUICK' AND al.details LIKE ?) 
            ORDER BY al.createdAt DESC
        ");
        $stmtLogs->execute(['%"productId":"' . $productId . '"%', '%"productId":"' . $productId . '"%']);
        $logs = $stmtLogs->fetchAll();
        
        foreach ($logs as $l) {
            $details = json_decode($l['details'] ?? '[]', true) ?: [];
            if ($l['action'] === 'STOCK_ADJUSTMENT') {
                $adj = (float)($details['adjustment'] ?? 0);
                $type = $adj >= 0 ? 'RESTOCK' : 'ADJUSTMENT';
                $label = $adj >= 0 ? 'إمداد مخزون' : 'تعديل جرد';
                
                $history[] = [
                    'id' => 'LOG-' . $l['id'],
                    'type' => $type,
                    'label' => $label,
                    'qty' => abs($adj),
                    'unit' => $details['unitName'] ?? 'قطعة',
                    'price' => 0.0,
                    'total' => 0.0,
                    'party' => $l['userName'] ?: 'المدير',
                    'createdAt' => (int)$l['createdAt'],
                    'notes' => $details['reason'] ?: 'تعديل يدوي للمخزون'
                ];
            } else if ($l['action'] === 'ADD_PRODUCT_QUICK') {
                $qty = (float)($details['stockQuantity'] ?? 0);
                $history[] = [
                    'id' => 'LOG-' . $l['id'],
                    'type' => 'INITIAL',
                    'label' => 'إنشاء الصنف',
                    'qty' => $qty,
                    'unit' => $details['unit'] ?? 'قطعة',
                    'price' => (float)($details['price'] ?? 0),
                    'total' => $qty * (float)($details['price'] ?? 0),
                    'party' => $l['userName'] ?: 'المدير',
                    'createdAt' => (int)$l['createdAt'],
                    'notes' => 'الرصيد الافتتاحي عند التسجيل'
                ];
            }
        }
        
        usort($history, function($a, $b) {
            return $b['createdAt'] <=> $a['createdAt'];
        });
        
        sendRes($history);
        break;

    case 'bulk_update_prices':
        if (!isAdmin()) sendErr('غير مصرح');
        $ids = $input['ids'] ?? [];
        $priceType = $input['priceType'] ?? 'price';
        $adjustType = $input['adjustType'] ?? 'fixed';
        $value = (float)($input['value'] ?? 0);
        
        if (empty($ids) || !is_array($ids)) sendErr('يجب تحديد منتج واحد على الأقل');
        
        $pdo->beginTransaction();
        try {
            foreach ($ids as $id) {
                $stmt = $pdo->prepare("SELECT price, wholesalePrice FROM products WHERE id = ?");
                $stmt->execute([$id]);
                $prod = $stmt->fetch();
                if (!$prod) continue;
                
                $oldPrice = (float)$prod[$priceType];
                $newPrice = $oldPrice;
                if ($adjustType === 'percent') {
                    $newPrice = $oldPrice + ($oldPrice * ($value / 100));
                } else {
                    $newPrice = $oldPrice + $value;
                }
                $newPrice = max(0.00, round($newPrice, 2));
                
                if ($priceType === 'price') {
                    $pdo->prepare("UPDATE products SET price = ? WHERE id = ?")->execute([$newPrice, $id]);
                    $pdo->prepare("UPDATE product_units SET salePrice = ? WHERE productId = ? AND isDefault = 1")->execute([$newPrice, $id]);
                } else {
                    $pdo->prepare("UPDATE products SET wholesalePrice = ? WHERE id = ?")->execute([$newPrice, $id]);
                    $pdo->prepare("UPDATE product_units SET purchasePrice = ? WHERE productId = ? AND isDefault = 1")->execute([$newPrice, $id]);
                }
            }
            $pdo->commit();
            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل التعديل الجماعي للأسعار: ' . $e->getMessage());
        }
        break;

    case 'bulk_update_reorder_level':
        if (!isAdmin()) sendErr('غير مصرح');
        $ids = $input['ids'] ?? [];
        $reorderLevel = (float)($input['reorderLevel'] ?? 5.00);
        
        if (empty($ids) || !is_array($ids)) sendErr('يجب تحديد منتج واحد على الأقل');
        
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("UPDATE products SET reorderLevel = ? WHERE id IN ($placeholders)");
        $stmt->execute(array_merge([$reorderLevel], $ids));
        sendRes(['status' => 'success']);
        break;

    case 'bulk_update_category':
        if (!isAdmin()) sendErr('غير مصرح');
        $ids = $input['ids'] ?? [];
        $categoryId = $input['categoryId'] ?? '';
        
        if (empty($ids) || !is_array($ids)) sendErr('يجب تحديد منتج واحد على الأقل');
        if (empty($categoryId)) sendErr('القسم مطلوب');
        
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("UPDATE products SET categoryId = ? WHERE id IN ($placeholders)");
        $stmt->execute(array_merge([$categoryId], $ids));
        sendRes(['status' => 'success']);
        break;

    case 'bulk_update_supplier':
        if (!isAdmin()) sendErr('غير مصرح');
        $ids = $input['ids'] ?? [];
        $supplierId = !empty($input['supplierId']) ? $input['supplierId'] : null;
        
        if (empty($ids) || !is_array($ids)) sendErr('يجب تحديد منتج واحد على الأقل');
        
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("UPDATE products SET supplierId = ? WHERE id IN ($placeholders)");
        $stmt->execute(array_merge([$supplierId], $ids));
        sendRes(['status' => 'success']);
        break;

    case 'bulk_toggle_products':
        if (!isAdmin()) sendErr('غير مصرح');
        $ids = $input['ids'] ?? [];
        $active = (int)($input['active'] ?? 1);
        
        if (empty($ids) || !is_array($ids)) sendErr('يجب تحديد منتج واحد على الأقل');
        
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("UPDATE product_units SET isActive = ? WHERE productId IN ($placeholders) AND isDefault = 1");
        $stmt->execute(array_merge([$active], $ids));
        sendRes(['status' => 'success']);
        break;
}
