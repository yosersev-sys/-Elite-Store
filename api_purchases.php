<?php
/**
 * Purchase Invoices & Suppliers Accounting Module - Soq Al-Asr POS
 */
if (!defined('DB_HOST')) exit;

if (!isset($_SESSION['user']) || (($_SESSION['user']['role'] ?? '') !== 'admin' && ($_SESSION['user']['role'] ?? '') !== 'cashier')) {
    sendErr('غير مصرح لك بالقيام بهذه العملية', 403);
}

$userId = $_SESSION['user']['id'];
$now = time() * 1000;

switch ($action) {
    case 'get_purchase_invoices':
        $supplierIdFilter = trim($_GET['supplierId'] ?? '');
        
        $sql = "
            SELECT i.*, s.name as supplierName, s.phone as supplierPhone, u.name as userName
            FROM purchase_invoices i
            LEFT JOIN suppliers s ON i.supplierId = s.id
            LEFT JOIN users u ON i.userId = u.id
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

        // Calculate total amount
        $totalAmount = 0;
        $processedItems = [];

        if (is_array($items) && count($items) > 0) {
            foreach ($items as $item) {
                $pName = trim($item['productName'] ?? '');
                $pId = trim($item['productId'] ?? '');
                $qty = max(0.01, (float)($item['quantity'] ?? 1));
                $cost = max(0, (float)($item['unitCost'] ?? 0));
                $upStock = isset($item['updateStock']) ? ($item['updateStock'] ? 1 : 0) : 1;
                $itemTotal = round($qty * $cost, 2);

                if (!empty($pName)) {
                    $totalAmount += $itemTotal;
                    $processedItems[] = [
                        'productId' => !empty($pId) ? $pId : null,
                        'productName' => $pName,
                        'quantity' => $qty,
                        'unitCost' => $cost,
                        'totalCost' => $itemTotal,
                        'updateStock' => $upStock
                    ];
                }
            }
        }

        // Direct total specified if no line items
        if (count($processedItems) === 0 && isset($input['totalAmount'])) {
            $totalAmount = max(0, (float)$input['totalAmount']);
        }

        if ($totalAmount <= 0) {
            sendErr('يجب إدخال إجمالي فاتورة صحيح أكبر من الصفر.');
        }

        if ($paidAmount > $totalAmount) {
            sendErr('المبلغ المدفوع كاش لا يمكن أن يتجاوز إجمالي الفاتورة.');
        }

        $remainingAmount = round($totalAmount - $paidAmount, 2);

        // Handle Image Upload if Base64 provided
        $invoiceImagePath = null;
        if (!empty($rawImageBase64) && strpos($rawImageBase64, 'data:image') === 0) {
            if (preg_match('/^data:image\/(\w+);base64,/', $rawImageBase64, $type)) {
                $data = substr($rawImageBase64, strpos($rawImageBase64, ',') + 1);
                $ext = strtolower($type[1]);
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
                    $data = base64_decode($data);
                    if ($data !== false) {
                        $filename = 'inv_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
                        $uploadPath = __DIR__ . '/uploads/invoices/' . $filename;
                        if (file_put_contents($uploadPath, $data)) {
                            $invoiceImagePath = 'uploads/invoices/' . $filename;
                        }
                    }
                }
            }
        } elseif (!empty($rawImageBase64) && strpos($rawImageBase64, 'uploads/') === 0) {
            $invoiceImagePath = $rawImageBase64;
        }

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
                INSERT INTO purchase_invoices (invoiceNumber, supplierId, totalAmount, paidAmount, remainingAmount, status, invoiceImagePath, notes, shiftId, userId, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtInv->execute([
                $invoiceNumber,
                $supplierId,
                $totalAmount,
                $paidAmount,
                $remainingAmount,
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
                INSERT INTO purchase_invoice_items (invoiceId, productId, productName, quantity, unitCost, totalCost, updateStock)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($processedItems as $it) {
                $stmtItem->execute([
                    $invoiceId,
                    $it['productId'],
                    $it['productName'],
                    $it['quantity'],
                    $it['unitCost'],
                    $it['totalCost'],
                    $it['updateStock']
                ]);
            }

            // If status is 'confirmed', execute accounting & inventory actions
            if ($status === 'confirmed') {

                // A. Record Payment if paidAmount > 0
                if ($paidAmount > 0) {
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
                    $newSupplierBalance = (float)$supplier['balance'] + $remainingAmount;
                    $pdo->prepare("UPDATE suppliers SET balance = ? WHERE id = ?")->execute([$newSupplierBalance, $supplierId]);
                }

                // C. Update Inventory & Movements
                $stmtMov = $pdo->prepare("
                    INSERT INTO inventory_movements (productId, type, quantity, unitCost, referenceType, referenceId, notes, userId, createdAt)
                    VALUES (?, 'purchase', ?, ?, 'purchase_invoice', ?, ?, ?, ?)
                ");

                foreach ($processedItems as $it) {
                    if ($it['updateStock'] && !empty($it['productId'])) {
                        // Increase Product Stock
                        $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ? WHERE id = ?")
                            ->execute([$it['quantity'], $it['productId']]);

                        // Record Movement
                        $stmtMov->execute([
                            $it['productId'],
                            $it['quantity'],
                            $it['unitCost'],
                            (string)$invoiceId,
                            "إضافة مخزن عبر فاتورة شراء #{$invoiceNumber}",
                            $userId,
                            $now
                        ]);
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
