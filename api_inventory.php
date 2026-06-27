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

switch ($action) {
    case 'get_products':
        $prods = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC")->fetchAll();
        $unitsStmt = $pdo->prepare("SELECT * FROM product_units WHERE productId = ? AND isActive = 1");
        
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
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO products (id, name, description, price, wholesalePrice, categoryId, supplierId, images, stockQuantity, unit, barcode, batches, reorderLevel, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $productId, $input['name'], $input['description'] ?? '', $input['price'] ?? 0.00, $input['wholesalePrice'] ?? 0.00,
                $input['categoryId'], $input['supplierId'] ?? null, json_encode($input['images'] ?? []),
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
            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل في حفظ المنتج الجديد: ' . $e->getMessage());
        }
        break;

    case 'update_product':
        if (!isAdmin()) sendErr('غير مصرح');
        $productId = $input['id'];
        $reorderLevel = isset($input['reorderLevel']) ? (float)$input['reorderLevel'] : 5.00;
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, wholesalePrice=?, categoryId=?, supplierId=?, images=?, stockQuantity=?, unit=?, barcode=?, batches=?, reorderLevel=? WHERE id=?");
            $stmt->execute([
                $input['name'], $input['description'], $input['price'] ?? 0.00, $input['wholesalePrice'] ?? 0.00,
                $input['categoryId'], $input['supplierId'], json_encode($input['images']),
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
            sendRes(['status' => 'success']);
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
        
        $pdo->beginTransaction();
        try {
            $pdo->prepare("DELETE FROM product_units WHERE productId = ?")->execute([$productId]);
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $pdo->commit();
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
        $stmt = $pdo->prepare("INSERT INTO categories (id, name, image, sortOrder) VALUES (?,?,?,?)");
        $stmt->execute([$input['id'], $input['name'], $input['image'] ?? '', $input['sortOrder'] ?? 0]);
        sendRes(['status' => 'success']);
        break;

    case 'update_category':
        if (!isAdmin()) sendErr('غير مصرح');
        $stmt = $pdo->prepare("UPDATE categories SET name=?, image=?, isActive=?, sortOrder=? WHERE id=?");
        $stmt->execute([$input['name'], $input['image'], $input['isActive'] ? 1 : 0, $input['sortOrder'], $input['id']]);
        sendRes(['status' => 'success']);
        break;

    case 'delete_category':
        if (!isAdmin()) sendErr('غير مصرح');
        $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$_GET['id']]);
        sendRes(['status' => 'success']);
        break;
}
