<?php
/**
 * Purchase Invoices & Suppliers Accounting Module - Soq Al-Asr POS
 */
if (!defined('DB_HOST')) exit;

if (!isset($_SESSION['user']) || (($_SESSION['user']['role'] ?? '') !== 'admin' && ($_SESSION['user']['role'] ?? '') !== 'cashier')) {
    sendErr('غير مصرح لك بالقيام بهذه العملية', 403);
}

// ═══════════════════════════════════════════════════════════════════
// الترقية الذاتية والتنفيئ التلقائي لجدول فواتير الشراء والمدفوعات بالخلفية
// ═══════════════════════════════════════════════════════════════════
try {
    $uploadDir = __DIR__ . '/uploads/invoices';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS purchase_invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoiceNumber VARCHAR(100) NULL,
            supplierId VARCHAR(100) NOT NULL,
            totalAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            paidAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            remainingAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            discountAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            freightAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            invoiceImagePath VARCHAR(255) NULL,
            notes TEXT NULL,
            shiftId INT NULL,
            userId VARCHAR(100) NULL,
            createdAt BIGINT NOT NULL,
            updatedAt BIGINT NOT NULL,
            INDEX idx_pur_supplier (supplierId),
            INDEX idx_pur_status (status),
            INDEX idx_pur_created (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    try {
        $chkDis = $pdo->query("SHOW COLUMNS FROM purchase_invoices LIKE 'discountAmount'")->fetch();
        if (!$chkDis) {
            $pdo->exec("ALTER TABLE purchase_invoices ADD COLUMN discountAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00");
        }
        $chkFre = $pdo->query("SHOW COLUMNS FROM purchase_invoices LIKE 'freightAmount'")->fetch();
        if (!$chkFre) {
            $pdo->exec("ALTER TABLE purchase_invoices ADD COLUMN freightAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00");
        }
        $chkImgCol = $pdo->query("SHOW COLUMNS FROM purchase_invoices LIKE 'invoiceImagePath'")->fetch();
        if ($chkImgCol && strpos(strtolower($chkImgCol['Type']), 'varchar') !== false) {
            $pdo->exec("ALTER TABLE purchase_invoices MODIFY COLUMN invoiceImagePath TEXT NULL");
        }
    } catch (Exception $e) {}

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS purchase_invoice_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoiceId INT NOT NULL,
            productId VARCHAR(100) NULL,
            productName VARCHAR(255) NOT NULL,
            unitName VARCHAR(100) NULL,
            barcode VARCHAR(100) NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
            unitCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            totalCost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            conversionFactor DECIMAL(10,2) NOT NULL DEFAULT 1.00,
            newSalePrice DECIMAL(10,2) NULL,
            lastCostPrice DECIMAL(10,2) NULL,
            updateStock TINYINT(1) NOT NULL DEFAULT 1,
            INDEX idx_item_invoice (invoiceId),
            INDEX idx_item_product (productId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    try {
        $cols = ['unitName' => 'VARCHAR(100) NULL', 'barcode' => 'VARCHAR(100) NULL', 'conversionFactor' => 'DECIMAL(10,2) NOT NULL DEFAULT 1.00', 'newSalePrice' => 'DECIMAL(10,2) NULL', 'lastCostPrice' => 'DECIMAL(10,2) NULL'];
        foreach ($cols as $colName => $colDef) {
            $chkCol = $pdo->query("SHOW COLUMNS FROM purchase_invoice_items LIKE '$colName'")->fetch();
            if (!$chkCol) {
                $pdo->exec("ALTER TABLE purchase_invoice_items ADD COLUMN $colName $colDef");
            }
        }
    } catch (Exception $e) {}

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS supplier_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            supplierId VARCHAR(100) NOT NULL,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            paymentMethod VARCHAR(50) NOT NULL DEFAULT 'cash',
            referenceNumber VARCHAR(100) NULL,
            notes TEXT NULL,
            invoiceId INT NULL,
            createdAt BIGINT NOT NULL,
            userId VARCHAR(100) NULL,
            INDEX idx_pay_supplier (supplierId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
} catch (Exception $e) {}

$userId = $_SESSION['user']['id'];
$now = time() * 1000;

function processInvoiceImages($input, $existingPath = null) {
    $rawImages = [];
    if (isset($input['invoiceImagePaths']) && is_array($input['invoiceImagePaths'])) {
        $rawImages = $input['invoiceImagePaths'];
    } elseif (isset($input['invoiceImages']) && is_array($input['invoiceImages'])) {
        $rawImages = $input['invoiceImages'];
    } elseif (!empty($input['invoiceImage'])) {
        if (is_array($input['invoiceImage'])) {
            $rawImages = $input['invoiceImage'];
        } else {
            $rawImages = [$input['invoiceImage']];
        }
    }

    if (empty($rawImages)) {
        return $existingPath;
    }

    $savedPaths = [];
    foreach ($rawImages as $raw) {
        if (!is_string($raw)) continue;
        $raw = trim($raw);
        if (empty($raw)) continue;

        if (strpos($raw, 'data:image') === 0) {
            if (preg_match('/^data:image\/(\w+);base64,(.+)$/is', $raw, $matches)) {
                $ext = strtolower($matches[1]);
                $data = base64_decode($matches[2]);
                if ($data !== false && in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
                    $filename = 'inv_' . time() . '_' . rand(10000, 99999) . '.' . $ext;
                    $uploadPath = __DIR__ . '/uploads/invoices/' . $filename;
                    if (file_put_contents($uploadPath, $data)) {
                        $savedPaths[] = 'uploads/invoices/' . $filename;
                        usleep(1000);
                    }
                }
            }
        } elseif (strpos($raw, 'uploads/') === 0) {
            $savedPaths[] = $raw;
        }
    }

    if (count($savedPaths) === 0) {
        return null;
    }
    return json_encode($savedPaths);
}

switch ($action) {
    case 'get_purchase_invoices':
        $supplierIdFilter = trim($_GET['supplierId'] ?? '');
        
        $sql = "
            SELECT i.*, s.name as supplierName, s.phone as supplierPhone, u.name as userName
            FROM purchase_invoices i
            LEFT JOIN suppliers s ON CAST(i.supplierId AS CHAR) = CAST(s.id AS CHAR)
            LEFT JOIN users u ON CAST(i.userId AS CHAR) = CAST(u.id AS CHAR)
        ";
        $params = [];

        if (!empty($supplierIdFilter)) {
            $sql .= " WHERE i.supplierId = ?";
            $params[] = $supplierIdFilter;
        }

        $sql .= " ORDER BY i.createdAt DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch items and payments for each invoice
        foreach ($invoices as &$inv) {
            $inv['totalAmount'] = round((float)$inv['totalAmount'], 2);
            $inv['paidAmount'] = round((float)$inv['paidAmount'], 2);
            $inv['remainingAmount'] = round((float)$inv['remainingAmount'], 2);

            // Images
            $rawPath = $inv['invoiceImagePath'] ?? '';
            $paths = [];
            if (!empty($rawPath)) {
                if (strpos($rawPath, '[') === 0) {
                    $decoded = json_decode($rawPath, true);
                    if (is_array($decoded)) {
                        $paths = $decoded;
                    }
                } else {
                    $paths = [$rawPath];
                }
            }
            $inv['invoiceImagePaths'] = $paths;
            $inv['invoiceImagePath'] = count($paths) > 0 ? $paths[0] : null;

            // Items
            $itemsStmt = $pdo->prepare("SELECT * FROM purchase_invoice_items WHERE invoiceId = ?");
            $itemsStmt->execute([$inv['id']]);
            $inv['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($inv['items'] as &$it) {
                $it['quantity'] = (float)$it['quantity'];
                $it['unitCost'] = (float)$it['unitCost'];
                $it['totalCost'] = (float)$it['totalCost'];
            }

            // Payments
            $payStmt = $pdo->prepare("SELECT p.*, u.name as userName FROM supplier_payments p LEFT JOIN users u ON p.userId = u.id WHERE p.invoiceId = ? ORDER BY p.createdAt DESC");
            $payStmt->execute([$inv['id']]);
            $inv['payments'] = $payStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($inv['payments'] as &$p) {
                $p['amount'] = (float)$p['amount'];
            }
        }

        sendRes($invoices);
        break;

    case 'add_purchase_invoice':
        $supplierId = trim($input['supplierId'] ?? '');
        $invoiceNumber = trim($input['invoiceNumber'] ?? '');
        $notes = trim($input['notes'] ?? '');
        $status = trim($input['status'] ?? 'confirmed'); // 'draft' or 'confirmed'
        $walletType = trim($input['walletType'] ?? 'drawer'); // 'drawer', 'main_safe', 'bank', etc.
        $paidAmount = max(0, (float)($input['paidAmount'] ?? 0));
        $rawImageBase64 = trim($input['invoiceImage'] ?? '');
        $items = $input['items'] ?? [];

        if (empty($supplierId)) {
            sendErr('يرجى اختيار المورد.');
        }

        // Verify Supplier
        $supStmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
        $supStmt->execute([$supplierId]);
        $supplier = $supStmt->fetch(PDO::FETCH_ASSOC);
        if (!$supplier) {
            sendErr('المورد المحدد غير موجود في قاعدة البيانات.');
        }

        $discountAmount = max(0, (float)($input['discountAmount'] ?? 0));
        $freightAmount = max(0, (float)($input['freightAmount'] ?? 0));

        // Calculate total amount
        $itemsTotal = 0;
        $processedItems = [];

        if (is_array($items) && count($items) > 0) {
            foreach ($items as $item) {
                $pName = trim($item['productName'] ?? '');
                $pId = trim($item['productId'] ?? '');
                $uName = trim($item['unitName'] ?? 'قطعة');
                $barcode = trim($item['barcode'] ?? '');
                $qty = max(0.01, (float)($item['quantity'] ?? 1));
                $cost = max(0, (float)($item['unitCost'] ?? 0));
                $factor = max(0.01, (float)($item['conversionFactor'] ?? 1));
                $newSale = isset($item['newSalePrice']) && $item['newSalePrice'] !== null ? max(0, (float)$item['newSalePrice']) : null;
                $lastCost = isset($item['lastCostPrice']) && $item['lastCostPrice'] !== null ? max(0, (float)$item['lastCostPrice']) : null;
                $upStock = isset($item['updateStock']) ? ($item['updateStock'] ? 1 : 0) : 1;
                $itemTotal = round($qty * $cost, 2);

                if (!empty($pName)) {
                    $itemsTotal += $itemTotal;
                    $processedItems[] = [
                        'productId' => !empty($pId) ? $pId : null,
                        'productName' => $pName,
                        'unitName' => $uName,
                        'barcode' => $barcode,
                        'quantity' => $qty,
                        'unitCost' => $cost,
                        'totalCost' => $itemTotal,
                        'conversionFactor' => $factor,
                        'newSalePrice' => $newSale,
                        'lastCostPrice' => $lastCost,
                        'updateStock' => $upStock
                    ];
                }
            }
        }

        // Net Total calculation: (Items Total - Discount + Freight)
        if (count($processedItems) > 0) {
            $totalAmount = round(max(0, $itemsTotal - $discountAmount + $freightAmount), 2);
        } else if (isset($input['totalAmount'])) {
            $totalAmount = max(0, (float)$input['totalAmount']);
        } else {
            $totalAmount = 0;
        }

        if ($totalAmount <= 0) {
            sendErr('يجب إدخال إجمالي فاتورة صحيح أكبر من الصفر.');
        }

        if ($paidAmount > $totalAmount) {
            sendErr('المبلغ المدفوع كاش لا يمكن أن يتجاوز إجمالي الفاتورة.');
        }

        $remainingAmount = round($totalAmount - $paidAmount, 2);

        // Handle Images Upload (supports single or multiple images)
        $invoiceImagePath = processInvoiceImages($input, null);

        // Get Active Shift
        $activeShift = $pdo->query("SELECT * FROM shifts WHERE status = 'open'")->fetch();
        $shiftId = $activeShift ? (int)$activeShift['id'] : null;

        // If paying from cash drawer, verify drawer balance & active shift
        if ($paidAmount > 0 && $walletType === 'drawer' && $status === 'confirmed') {
            if (!$activeShift) {
                sendErr('يجب فتح وردية أولاً للتمكن من الدفع نقداً من الخزينة.');
            }
            $currentCash = (float)$activeShift['currentCashBalance'];
            if ($paidAmount > $currentCash) {
                sendErr("رصيد الدرج غير كافٍ! الرصيد الحالي: {$currentCash} ج.م، المبلغ المطلوب دفعه: {$paidAmount} ج.م");
            }
        }

        $pdo->beginTransaction();

        try {
            // 1. Insert Invoice Header
            $stmtInv = $pdo->prepare("
                INSERT INTO purchase_invoices (invoiceNumber, supplierId, totalAmount, paidAmount, remainingAmount, discountAmount, freightAmount, status, invoiceImagePath, notes, shiftId, userId, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtInv->execute([
                $invoiceNumber,
                $supplierId,
                $totalAmount,
                $paidAmount,
                $remainingAmount,
                $discountAmount,
                $freightAmount,
                $status,
                $invoiceImagePath,
                $notes,
                $shiftId,
                $userId,
                $now,
                $now
            ]);
            $invoiceId = (int)$pdo->lastInsertId();

            // Auto-generate invoice number if empty
            if (empty($invoiceNumber)) {
                $generatedNumber = 'PUR-' . str_pad($invoiceId, 5, '0', STR_PAD_LEFT);
                $pdo->prepare("UPDATE purchase_invoices SET invoiceNumber = ? WHERE id = ?")->execute([$generatedNumber, $invoiceId]);
                $invoiceNumber = $generatedNumber;
            }

            // 2. Insert Items
            $stmtItem = $pdo->prepare("
                INSERT INTO purchase_invoice_items (invoiceId, productId, productName, unitName, barcode, quantity, unitCost, totalCost, conversionFactor, newSalePrice, lastCostPrice, updateStock)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($processedItems as $it) {
                $stmtItem->execute([
                    $invoiceId,
                    $it['productId'],
                    $it['productName'],
                    $it['unitName'],
                    $it['barcode'],
                    $it['quantity'],
                    $it['unitCost'],
                    $it['totalCost'],
                    $it['conversionFactor'],
                    $it['newSalePrice'],
                    $it['lastCostPrice'],
                    $it['updateStock']
                ]);
            }

            // If status is 'confirmed', execute accounting & inventory actions
            if ($status === 'confirmed') {

                // A. Record Payment if paidAmount > 0
                if ($paidAmount > 0) {
                    try {
                        $stmtPay = $pdo->prepare("
                            INSERT INTO supplier_payments (supplierId, invoiceId, amount, type, walletType, notes, shiftId, userId, createdAt)
                            VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, ?)
                        ");
                        $stmtPay->execute([
                            $supplierId,
                            $invoiceId,
                            $paidAmount,
                            $walletType,
                            "دفعة مقدماً لفاتورة شراء #{$invoiceNumber}",
                            $shiftId,
                            $userId,
                            $now
                        ]);
                    } catch (Exception $payErr) {
                        try {
                            $stmtPay = $pdo->prepare("
                                INSERT INTO supplier_payments (supplierId, invoiceId, amount, notes, createdAt)
                                VALUES (?, ?, ?, ?, ?)
                            ");
                            $stmtPay->execute([
                                $supplierId,
                                $invoiceId,
                                $paidAmount,
                                "دفعة مقدماً لفاتورة شراء #{$invoiceNumber}",
                                $now
                            ]);
                        } catch (Exception $payErr2) {}
                    }

                    // If drawer payment, deduct from drawer & insert transaction
                    if ($walletType === 'drawer' && $activeShift) {
                        $newBalance = (float)$activeShift['currentCashBalance'] - $paidAmount;
                        
                        $stmtTx = $pdo->prepare("
                            INSERT INTO drawer_transactions (shiftId, type, amount, reason, createdAt, userId, category, balanceAfter)
                            VALUES (?, 'withdrawal', ?, ?, ?, ?, 'purchase', ?)
                        ");
                        $stmtTx->execute([
                            $shiftId,
                            $paidAmount,
                            "سداد فاتورة شراء #{$invoiceNumber} للمورد: {$supplier['name']}",
                            $now,
                            $userId,
                            $newBalance
                        ]);

                        $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $shiftId]);
                    }
                }

                // B. Update Supplier Debt with remainingAmount
                if ($remainingAmount > 0) {
                    try {
                        $newSupplierBalance = (float)($supplier['balance'] ?? 0) + $remainingAmount;
                        $pdo->prepare("UPDATE suppliers SET balance = ? WHERE id = ?")->execute([$newSupplierBalance, $supplierId]);
                    } catch (Exception $supErr) {}
                }

                // C. Update Inventory & Movements
                $stmtMov = $pdo->prepare("
                    INSERT INTO inventory_movements (productId, type, quantity, unitCost, referenceType, referenceId, notes, userId, createdAt)
                    VALUES (?, 'purchase', ?, ?, 'purchase_invoice', ?, ?, ?, ?)
                ");

                foreach ($processedItems as $it) {
                    if ($it['updateStock'] && !empty($it['productId'])) {
                        $factor = max(0.01, (float)($it['conversionFactor'] ?? 1));
                        $basePiecesAdded = round($it['quantity'] * $factor, 2);

                        // Increase Product Stock (by base pieces)
                        try {
                            $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ? WHERE id = ?")
                                ->execute([$basePiecesAdded, $it['productId']]);
                        } catch (Exception $stkErr) {}

                        // Update Wholesale Cost Price & optionally Retail Sale Price if provided
                        $baseUnitCost = round($it['unitCost'] / $factor, 2);
                        try {
                            if (!empty($it['newSalePrice']) && $it['newSalePrice'] > 0) {
                                $pdo->prepare("UPDATE products SET wholesalePrice = ?, price = ? WHERE id = ?")
                                    ->execute([$baseUnitCost, $it['newSalePrice'], $it['productId']]);
                            } else {
                                $pdo->prepare("UPDATE products SET wholesalePrice = ? WHERE id = ?")
                                    ->execute([$baseUnitCost, $it['productId']]);
                            }
                        } catch (Exception $prcErr) {}

                        // Record Batch in product's batches history (تاريخ دفعات التوريد)
                        try {
                            $stmtGetB = $pdo->prepare("SELECT batches FROM products WHERE id = ?");
                            $stmtGetB->execute([$it['productId']]);
                            $prodBRow = $stmtGetB->fetch(PDO::FETCH_ASSOC);

                            $existingBatches = [];
                            if ($prodBRow && !empty($prodBRow['batches'])) {
                                $decodedB = json_decode($prodBRow['batches'], true);
                                if (is_array($decodedB)) {
                                    $existingBatches = $decodedB;
                                }
                            }

                            $newBatch = [
                                'id' => 'batch_pur_' . $invoiceId . '_' . time() . '_' . rand(100, 999),
                                'quantity' => (float)$basePiecesAdded,
                                'wholesalePrice' => (float)$baseUnitCost,
                                'createdAt' => (float)$now
                            ];

                            $existingBatches[] = $newBatch;

                            $pdo->prepare("UPDATE products SET batches = ? WHERE id = ?")
                                ->execute([json_encode($existingBatches), $it['productId']]);
                        } catch (Exception $btcErr) {}

                        // Record Movement safely
                        try {
                            $stmtMov->execute([
                                $it['productId'],
                                $basePiecesAdded,
                                $it['unitCost'],
                                (string)$invoiceId,
                                "إضافة مخزن ({$it['quantity']} {$it['unitName']}) عبر فاتورة شراء #{$invoiceNumber}",
                                $userId,
                                $now
                            ]);
                        } catch (Exception $movErr) {}
                    }
                }
            }

            $pdo->commit();
            sendRes(['status' => 'success', 'invoiceId' => $invoiceId, 'invoiceNumber' => $invoiceNumber]);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل حفظ فاتورة الشراء: ' . $e->getMessage());
        }
        break;

    case 'update_purchase_invoice':
        $invoiceId = (int)($input['id'] ?? 0);
        $supplierId = trim($input['supplierId'] ?? '');
        $invoiceNumber = trim($input['invoiceNumber'] ?? '');
        $notes = trim($input['notes'] ?? '');
        $status = trim($input['status'] ?? 'confirmed'); // 'draft' or 'confirmed'
        $walletType = trim($input['walletType'] ?? 'drawer');
        $paidAmount = max(0, (float)($input['paidAmount'] ?? 0));
        $rawImageBase64 = trim($input['invoiceImage'] ?? '');
        $items = $input['items'] ?? [];

        if ($invoiceId <= 0) {
            sendErr('معرف الفاتورة المطلوب تعديلها غير صالح.');
        }

        if (empty($supplierId)) {
            sendErr('يرجى اختيار المورد.');
        }

        // Verify Existing Invoice
        $stmtOld = $pdo->prepare("SELECT * FROM purchase_invoices WHERE id = ?");
        $stmtOld->execute([$invoiceId]);
        $oldInv = $stmtOld->fetch(PDO::FETCH_ASSOC);
        if (!$oldInv) {
            sendErr('فاتورة الشراء غير موجودة.');
        }

        // Verify Supplier
        $supStmt = $pdo->prepare("SELECT * FROM suppliers WHERE id = ?");
        $supStmt->execute([$supplierId]);
        $supplier = $supStmt->fetch(PDO::FETCH_ASSOC);
        if (!$supplier) {
            sendErr('المورد المحدد غير موجود في قاعدة البيانات.');
        }

        $discountAmount = max(0, (float)($input['discountAmount'] ?? 0));
        $freightAmount = max(0, (float)($input['freightAmount'] ?? 0));

        // Calculate total amount
        $itemsTotal = 0;
        $processedItems = [];

        if (is_array($items) && count($items) > 0) {
            foreach ($items as $item) {
                $pName = trim($item['productName'] ?? '');
                $pId = trim($item['productId'] ?? '');
                $uName = trim($item['unitName'] ?? 'قطعة');
                $barcode = trim($item['barcode'] ?? '');
                $qty = max(0.01, (float)($item['quantity'] ?? 1));
                $cost = max(0, (float)($item['unitCost'] ?? 0));
                $factor = max(0.01, (float)($item['conversionFactor'] ?? 1));
                $newSale = isset($item['newSalePrice']) && $item['newSalePrice'] !== null ? max(0, (float)$item['newSalePrice']) : null;
                $lastCost = isset($item['lastCostPrice']) && $item['lastCostPrice'] !== null ? max(0, (float)$item['lastCostPrice']) : null;
                $upStock = isset($item['updateStock']) ? ($item['updateStock'] ? 1 : 0) : 1;
                $itemTotal = round($qty * $cost, 2);

                if (!empty($pName)) {
                    $itemsTotal += $itemTotal;
                    $processedItems[] = [
                        'productId' => !empty($pId) ? $pId : null,
                        'productName' => $pName,
                        'unitName' => $uName,
                        'barcode' => $barcode,
                        'quantity' => $qty,
                        'unitCost' => $cost,
                        'totalCost' => $itemTotal,
                        'conversionFactor' => $factor,
                        'newSalePrice' => $newSale,
                        'lastCostPrice' => $lastCost,
                        'updateStock' => $upStock
                    ];
                }
            }
        }

        if (count($processedItems) > 0) {
            $totalAmount = round(max(0, $itemsTotal - $discountAmount + $freightAmount), 2);
        } else if (isset($input['totalAmount'])) {
            $totalAmount = max(0, (float)$input['totalAmount']);
        } else {
            $totalAmount = 0;
        }

        if ($totalAmount <= 0) {
            sendErr('يجب إدخال إجمالي فاتورة صحيح أكبر من الصفر.');
        }

        if ($paidAmount > $totalAmount) {
            sendErr('المبلغ المدفوع كاش لا يمكن أن يتجاوز إجمالي الفاتورة.');
        }

        $remainingAmount = round($totalAmount - $paidAmount, 2);

        // Handle Images Upload (supports single or multiple images)
        $invoiceImagePath = processInvoiceImages($input, $oldInv['invoiceImagePath']);

        $activeShift = $pdo->query("SELECT * FROM shifts WHERE status = 'open'")->fetch();
        $shiftId = $activeShift ? (int)$activeShift['id'] : null;

        $pdo->beginTransaction();

        try {
            // REVERSE OLD CONFIRMED EFFECTS IF OLD STATUS WAS 'confirmed'
            if ($oldInv['status'] === 'confirmed') {
                // 1. Reverse Supplier Debt Balance
                $oldRemaining = (float)$oldInv['remainingAmount'];
                if ($oldRemaining > 0) {
                    $pdo->prepare("UPDATE suppliers SET balance = GREATEST(0, balance - ?) WHERE id = ?")
                        ->execute([$oldRemaining, $oldInv['supplierId']]);
                }

                // 2. Reverse Stock & Batches of Old Items
                $oldItemsStmt = $pdo->prepare("SELECT * FROM purchase_invoice_items WHERE invoiceId = ?");
                $oldItemsStmt->execute([$invoiceId]);
                $oldItems = $oldItemsStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($oldItems as $oldIt) {
                    if ($oldIt['updateStock'] && !empty($oldIt['productId'])) {
                        $oldFactor = max(0.01, (float)($oldIt['conversionFactor'] ?? 1));
                        $oldBasePieces = round($oldIt['quantity'] * $oldFactor, 2);

                        // Deduct Stock
                        $pdo->prepare("UPDATE products SET stockQuantity = GREATEST(0, stockQuantity - ?) WHERE id = ?")
                            ->execute([$oldBasePieces, $oldIt['productId']]);

                        // Filter out batches matching this invoiceId prefix
                        try {
                            $stmtGetB = $pdo->prepare("SELECT batches FROM products WHERE id = ?");
                            $stmtGetB->execute([$oldIt['productId']]);
                            $prodBRow = $stmtGetB->fetch(PDO::FETCH_ASSOC);
                            if ($prodBRow && !empty($prodBRow['batches'])) {
                                $decodedB = json_decode($prodBRow['batches'], true);
                                if (is_array($decodedB)) {
                                    $filteredBatches = array_values(array_filter($decodedB, function($b) use ($invoiceId) {
                                        return strpos($b['id'] ?? '', 'batch_pur_' . $invoiceId . '_') !== 0;
                                    }));
                                    $pdo->prepare("UPDATE products SET batches = ? WHERE id = ?")
                                        ->execute([json_encode($filteredBatches), $oldIt['productId']]);
                                }
                            }
                        } catch (Exception $btcErr) {}
                    }
                }
            }

            // UPDATE INVOICE HEADER
            $stmtUpdInv = $pdo->prepare("
                UPDATE purchase_invoices 
                SET invoiceNumber = ?, supplierId = ?, totalAmount = ?, paidAmount = ?, remainingAmount = ?, discountAmount = ?, freightAmount = ?, status = ?, invoiceImagePath = ?, notes = ?, updatedAt = ?
                WHERE id = ?
            ");
            $stmtUpdInv->execute([
                $invoiceNumber,
                $supplierId,
                $totalAmount,
                $paidAmount,
                $remainingAmount,
                $discountAmount,
                $freightAmount,
                $status,
                $invoiceImagePath,
                $notes,
                $now,
                $invoiceId
            ]);

            // DELETE OLD ITEMS & RE-INSERT NEW ITEMS
            $pdo->prepare("DELETE FROM purchase_invoice_items WHERE invoiceId = ?")->execute([$invoiceId]);

            $stmtItem = $pdo->prepare("
                INSERT INTO purchase_invoice_items (invoiceId, productId, productName, unitName, barcode, quantity, unitCost, totalCost, conversionFactor, newSalePrice, lastCostPrice, updateStock)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($processedItems as $it) {
                $stmtItem->execute([
                    $invoiceId,
                    $it['productId'],
                    $it['productName'],
                    $it['unitName'],
                    $it['barcode'],
                    $it['quantity'],
                    $it['unitCost'],
                    $it['totalCost'],
                    $it['conversionFactor'],
                    $it['newSalePrice'],
                    $it['lastCostPrice'],
                    $it['updateStock']
                ]);
            }

            // APPLY NEW CONFIRMED EFFECTS IF NEW STATUS IS 'confirmed'
            if ($status === 'confirmed') {
                // Update Supplier Debt Balance
                if ($remainingAmount > 0) {
                    $pdo->prepare("UPDATE suppliers SET balance = balance + ? WHERE id = ?")
                        ->execute([$remainingAmount, $supplierId]);
                }

                // Update Products Stock, Prices, Movements, and Batches
                $stmtMov = $pdo->prepare("
                    INSERT INTO inventory_movements (productId, type, quantity, unitCost, referenceType, referenceId, notes, userId, createdAt)
                    VALUES (?, 'purchase', ?, ?, 'purchase_invoice', ?, ?, ?, ?)
                ");

                foreach ($processedItems as $it) {
                    if ($it['updateStock'] && !empty($it['productId'])) {
                        $factor = max(0.01, (float)($it['conversionFactor'] ?? 1));
                        $basePiecesAdded = round($it['quantity'] * $factor, 2);

                        // Increase Product Stock
                        $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ? WHERE id = ?")
                            ->execute([$basePiecesAdded, $it['productId']]);

                        // Update Wholesale & Sale Prices
                        $baseUnitCost = round($it['unitCost'] / $factor, 2);
                        if (!empty($it['newSalePrice']) && $it['newSalePrice'] > 0) {
                            $pdo->prepare("UPDATE products SET wholesalePrice = ?, price = ? WHERE id = ?")
                                ->execute([$baseUnitCost, $it['newSalePrice'], $it['productId']]);
                        } else {
                            $pdo->prepare("UPDATE products SET wholesalePrice = ? WHERE id = ?")
                                ->execute([$baseUnitCost, $it['productId']]);
                        }

                        // Add new batch
                        try {
                            $stmtGetB = $pdo->prepare("SELECT batches FROM products WHERE id = ?");
                            $stmtGetB->execute([$it['productId']]);
                            $prodBRow = $stmtGetB->fetch(PDO::FETCH_ASSOC);

                            $existingBatches = [];
                            if ($prodBRow && !empty($prodBRow['batches'])) {
                                $decodedB = json_decode($prodBRow['batches'], true);
                                if (is_array($decodedB)) {
                                    $existingBatches = $decodedB;
                                }
                            }

                            $newBatch = [
                                'id' => 'batch_pur_' . $invoiceId . '_' . time() . '_' . rand(100, 999),
                                'quantity' => (float)$basePiecesAdded,
                                'wholesalePrice' => (float)$baseUnitCost,
                                'createdAt' => (float)$now
                            ];

                            $existingBatches[] = $newBatch;

                            $pdo->prepare("UPDATE products SET batches = ? WHERE id = ?")
                                ->execute([json_encode($existingBatches), $it['productId']]);
                        } catch (Exception $btcErr) {}

                        // Record Movement
                        try {
                            $stmtMov->execute([
                                $it['productId'],
                                $basePiecesAdded,
                                $it['unitCost'],
                                (string)$invoiceId,
                                "تحديث مخزن ({$it['quantity']} {$it['unitName']}) عبر تعديل فاتورة شراء #{$invoiceNumber}",
                                $userId,
                                $now
                            ]);
                        } catch (Exception $movErr) {}
                    }
                }
            }

            $pdo->commit();
            sendRes(['status' => 'success', 'invoiceId' => $invoiceId, 'invoiceNumber' => $invoiceNumber]);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل تعديل فاتورة الشراء: ' . $e->getMessage());
        }
        break;

    case 'add_invoice_payment':
        $invoiceId = (int)($input['invoiceId'] ?? 0);
        $amount = max(0.01, (float)($input['amount'] ?? 0));
        $walletType = trim($input['walletType'] ?? 'drawer');
        $notes = trim($input['notes'] ?? '');

        if ($invoiceId <= 0 || $amount <= 0) {
            sendErr('بيانات الدفعة غير صحيحة.');
        }

        // Fetch invoice
        $invStmt = $pdo->prepare("SELECT i.*, s.name as supplierName, s.balance as supplierBalance FROM purchase_invoices i LEFT JOIN suppliers s ON i.supplierId = s.id WHERE i.id = ?");
        $invStmt->execute([$invoiceId]);
        $inv = $invStmt->fetch(PDO::FETCH_ASSOC);

        if (!$inv) {
            sendErr('فاتورة الشراء غير موجودة.');
        }

        if ($inv['status'] !== 'confirmed') {
            sendErr('يمكن تسديد دفعات فقط للفواتير المعتمدة (Confirmed).');
        }

        $rem = (float)$inv['remainingAmount'];
        if ($rem <= 0) {
            sendErr('هذه الفاتورة مسددة بالكامل مسبقاً.');
        }

        if ($amount > $rem) {
            sendErr("المبلغ المدفوع يتجاوز المتبقي من الفاتورة ({$rem} ج.م).");
        }

        // Get Active Shift
        $activeShift = $pdo->query("SELECT * FROM shifts WHERE status = 'open'")->fetch();
        $shiftId = $activeShift ? (int)$activeShift['id'] : null;

        if ($walletType === 'drawer') {
            if (!$activeShift) {
                sendErr('يجب فتح وردية أولاً للتمكن من الدفع نقداً من الخزينة.');
            }
            $currentCash = (float)$activeShift['currentCashBalance'];
            if ($amount > $currentCash) {
                sendErr("رصيد الدرج غير كافٍ! الرصيد الحالي: {$currentCash} ج.م، القيمة المطلوبة: {$amount} ج.م");
            }
        }

        $pdo->beginTransaction();

        try {
            $newPaid = (float)$inv['paidAmount'] + $amount;
            $newRemaining = (float)$inv['totalAmount'] - $newPaid;

            // Update Invoice
            $pdo->prepare("UPDATE purchase_invoices SET paidAmount = ?, remainingAmount = ?, updatedAt = ? WHERE id = ?")
                ->execute([$newPaid, $newRemaining, $now, $invoiceId]);

            // Record Payment
            $stmtPay = $pdo->prepare("
                INSERT INTO supplier_payments (supplierId, invoiceId, amount, type, walletType, notes, shiftId, userId, createdAt)
                VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, ?)
            ");
            $stmtPay->execute([
                $inv['supplierId'],
                $invoiceId,
                $amount,
                $walletType,
                !empty($notes) ? $notes : "دفعة مادية للفاتورة #{$inv['invoiceNumber']}",
                $shiftId,
                $userId,
                $now
            ]);

            // Update Supplier Debt Balance
            $newSupplierBalance = max(0, (float)$inv['supplierBalance'] - $amount);
            $pdo->prepare("UPDATE suppliers SET balance = ? WHERE id = ?")->execute([$newSupplierBalance, $inv['supplierId']]);

            // If Drawer Payment
            if ($walletType === 'drawer' && $activeShift) {
                $newCashBalance = (float)$activeShift['currentCashBalance'] - $amount;

                $stmtTx = $pdo->prepare("
                    INSERT INTO drawer_transactions (shiftId, type, amount, reason, createdAt, userId, category, balanceAfter)
                    VALUES (?, 'withdrawal', ?, ?, ?, ?, 'purchase', ?)
                ");
                $stmtTx->execute([
                    $shiftId,
                    $amount,
                    "سداد دفعة لفاتورة شراء #{$inv['invoiceNumber']} للمورد: {$inv['supplierName']}",
                    $now,
                    $userId,
                    $newCashBalance
                ]);

                $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newCashBalance, $shiftId]);
            }

            $pdo->commit();
            sendRes(['status' => 'success']);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل تسديد الدفعة: ' . $e->getMessage());
        }
        break;
}
