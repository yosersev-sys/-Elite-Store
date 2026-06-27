<?php
/**
 * Sales & Orders Module
 */
if (!defined('DB_HOST')) exit;

// التحقق وإضافة أعمدة التأكيد والاعتماد ديناميكياً لجدول الطلبات إذا لم تكن موجودة
try {
    $checkCols = $pdo->query("SHOW COLUMNS FROM orders LIKE 'confirmedAt'")->fetch();
    if (!$checkCols) {
        $pdo->exec("ALTER TABLE orders 
            ADD COLUMN confirmedAt BIGINT NULL, 
            ADD COLUMN confirmedById VARCHAR(50) NULL,
            ADD COLUMN confirmedShiftId INT NULL");
    }
} catch (Exception $e) {
    // تجاهل أي خطأ مؤقت لتفادي التوقف
}

// التحقق وإضافة أعمدة المرتجعات التفصيلية لجدول الطلبات إذا لم تكن موجودة
try {
    $checkReturnCols = $pdo->query("SHOW COLUMNS FROM orders LIKE 'returnShiftId'")->fetch();
    if (!$checkReturnCols) {
        $pdo->exec("ALTER TABLE orders 
            ADD COLUMN returnShiftId INT NULL,
            ADD COLUMN returnedAt BIGINT NULL,
            ADD COLUMN returnedAmount DECIMAL(10,2) DEFAULT 0.00,
            ADD COLUMN returnStatus VARCHAR(20) DEFAULT 'none',
            ADD COLUMN returnedById VARCHAR(50) NULL,
            ADD COLUMN returnReason TEXT NULL");
    }
} catch (Exception $e) {
    // تجاهل
}

// التحقق وإضافة عمود lastOrderAt ديناميكياً لجدول المستخدمين إذا لم يكن موجوداً
try {
    $checkUserCols = $pdo->query("SHOW COLUMNS FROM users LIKE 'lastOrderAt'")->fetch();
    if (!$checkUserCols) {
        $pdo->exec("ALTER TABLE users ADD COLUMN lastOrderAt BIGINT NULL");
    }
} catch (Exception $e) {
    // تجاهل أي خطأ
}

// التحقق وإنشاء جدول كشف حساب العميل ديناميكياً
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS customer_ledger (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        orderId VARCHAR(50) NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        balanceAfter DECIMAL(10,2) NOT NULL,
        paymentMethod VARCHAR(50) NULL,
        shiftId INT NULL,
        notes TEXT NULL,
        createdAt BIGINT NOT NULL,
        createdById VARCHAR(50) NOT NULL,
        KEY idx_userId (userId),
        KEY idx_createdAt (createdAt),
        KEY idx_orderId (orderId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (Exception $e) {
    // تجاهل
}

// التحقق وإضافة عمود paymentStatus لجدول الطلبات ديناميكياً
try {
    $checkPayCol = $pdo->query("SHOW COLUMNS FROM orders LIKE 'paymentStatus'")->fetch();
    if (!$checkPayCol) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN paymentStatus VARCHAR(50) DEFAULT 'unpaid'");
        // تعيين الطلبات النقدية المكتملة السابقة كمكتملة الدفع
        $pdo->exec("UPDATE orders SET paymentStatus = 'paid' WHERE paymentMethod NOT LIKE '%آجل%' AND status = 'completed'");
    }
} catch (Exception $e) {
    // تجاهل
}

// التحقق وإضافة عمود outstandingAmount لجدول الطلبات ديناميكياً
try {
    $checkOutstanding = $pdo->query("SHOW COLUMNS FROM orders LIKE 'outstandingAmount'")->fetch();
    if (!$checkOutstanding) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN outstandingAmount DECIMAL(10,2) DEFAULT 0.00");
    }
} catch (Exception $e) {
    // تجاهل
}
// التحقق وإضافة أعمدة الخصومات والتوصيل لجدول الطلبات ديناميكياً
$discountCols = [
    'discount' => "DECIMAL(10,2) DEFAULT 0.00",
    'discountType' => "VARCHAR(20) DEFAULT 'fixed'",
    'discountValue' => "DECIMAL(10,2) DEFAULT 0.00",
    'deliveryFee' => "DECIMAL(10,2) DEFAULT 0.00",
    'totalItemDiscounts' => "DECIMAL(10,2) DEFAULT 0.00",
    'subtotalBeforeDiscount' => "DECIMAL(10,2) DEFAULT 0.00",
    'finalTotal' => "DECIMAL(10,2) DEFAULT 0.00",
    'discountsMetadata' => "LONGTEXT NULL"
];
foreach ($discountCols as $col => $definition) {
    try {
        $checkCol = $pdo->query("SHOW COLUMNS FROM orders LIKE '$col'")->fetch();
        if (!$checkCol) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN `$col` $definition");
        }
    } catch (Exception $e) {
        // تجاهل
    }
}

// التحقق وإضافة عمود dueDate لجدول كشف حساب العميل ديناميكياً
try {
    $checkLedgerDueDate = $pdo->query("SHOW COLUMNS FROM customer_ledger LIKE 'dueDate'")->fetch();
    if (!$checkLedgerDueDate) {
        $pdo->exec("ALTER TABLE customer_ledger ADD COLUMN dueDate BIGINT NULL");
    }
} catch (Exception $e) {
    // تجاهل
}

// التحقق وإنشاء جدول وسائل الدفع ديناميكياً
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        icon VARCHAR(50) NULL,
        isSystem TINYINT DEFAULT 0,
        isActive TINYINT DEFAULT 1,
        sortOrder INT DEFAULT 0,
        createdAt BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // إدراج الوسائل الافتراضية
    $countMethods = $pdo->query("SELECT COUNT(*) FROM payment_methods")->fetchColumn();
    if ($countMethods == 0) {
        $now = time() * 1000;
        $insert = $pdo->prepare("INSERT INTO payment_methods (id, name, type, icon, isSystem, isActive, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $insert->execute(['cash', 'نقدي', 'cash', '💰', 1, 1, 0, $now]);
        $insert->execute(['vodafone', 'فودافون كاش', 'digital', '📱', 1, 1, 1, $now]);
        $insert->execute(['instapay', 'انستا باي', 'digital', '💸', 1, 1, 2, $now]);
        $insert->execute(['visa', 'فيزا / بطاقة بنكية', 'digital', '💳', 1, 1, 3, $now]);
    }
} catch (Exception $e) {
    // تجاهل
}

// التحقق وإنشاء جدول سجل مدفوعات الفاتورة ديناميكياً
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS order_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId VARCHAR(50) NOT NULL,
        paymentMethodId VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        reference VARCHAR(100) NULL,
        createdAt BIGINT NOT NULL,
        createdBy VARCHAR(50) NOT NULL,
        KEY idx_orderId (orderId),
        KEY idx_paymentMethodId (paymentMethodId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (Exception $e) {
    // تجاهل
}
// دالة لتطهير وتوحيد رقم الهاتف
if (!function_exists('normalizePhone')) {
    function normalizePhone($phone) {
        $cleaned = preg_replace('/\D/', '', $phone);
        if (strlen($cleaned) > 11 && substr($cleaned, 0, 2) === '20') {
            $cleaned = substr($cleaned, 2);
        }
        if (strlen($cleaned) == 10 && substr($cleaned, 0, 1) !== '0') {
            $cleaned = '0' . $cleaned;
        }
        return $cleaned;
    }
}

// دالة لإعادة احتساب كشف الحساب المتراكم لعميل معين لضمان اتساق رصيد balanceAfter
if (!function_exists('recalculateCustomerLedger')) {
    function recalculateCustomerLedger($pdo, $userId) {
        if (empty($userId)) return;
        $stmt = $pdo->prepare("SELECT id, amount FROM customer_ledger WHERE userId = ? ORDER BY createdAt ASC, id ASC FOR UPDATE");
        $stmt->execute([$userId]);
        $entries = $stmt->fetchAll();

        $currentBalance = 0.00;
        $stmtUpdate = $pdo->prepare("UPDATE customer_ledger SET balanceAfter = ? WHERE id = ?");
        foreach ($entries as $entry) {
            $currentBalance += (float)$entry['amount'];
            $stmtUpdate->execute([$currentBalance, $entry['id']]);
        }
    }
}

// دالة لتحديث حالة دفع الفاتورة (paymentStatus) لضمان اتساقها مع السداد
if (!function_exists('updateOrderPaymentStatus')) {
    function updateOrderPaymentStatus($pdo, $orderId) {
        if (empty($orderId)) return;
        $stmtOrder = $pdo->prepare("SELECT total, status FROM orders WHERE id = ?");
        $stmtOrder->execute([$orderId]);
        $order = $stmtOrder->fetch();
        if (!$order) return;

        if ($order['status'] === 'cancelled') {
            $pdo->prepare("UPDATE orders SET paymentStatus = 'paid', outstandingAmount = 0.00 WHERE id = ?")->execute([$orderId]);
            return;
        }

        // Sum of all paid amounts from order_payments
        $stmtSum = $pdo->prepare("SELECT IFNULL(SUM(amount), 0) FROM order_payments WHERE orderId = ?");
        $stmtSum->execute([$orderId]);
        $paymentsSum = (float)$stmtSum->fetchColumn();

        // Sum of payments made later on ledger
        $stmtLedgerPaid = $pdo->prepare("SELECT IFNULL(SUM(ABS(amount)), 0) FROM customer_ledger WHERE orderId = ? AND type = 'PAYMENT'");
        $stmtLedgerPaid->execute([$orderId]);
        $ledgerPaidSum = (float)$stmtLedgerPaid->fetchColumn();

        $totalPaid = $paymentsSum + $ledgerPaidSum;
        $totalOrder = (float)$order['total'];
        $outstanding = max(0.00, $totalOrder - $totalPaid);

        $paymentStatus = 'unpaid';
        if ($outstanding <= 0.00) {
            $paymentStatus = 'paid';
        } elseif ($totalPaid > 0.00) {
            $paymentStatus = 'partially_paid';
        }

        $pdo->prepare("UPDATE orders SET paymentStatus = ?, outstandingAmount = ? WHERE id = ?")->execute([$paymentStatus, $outstanding, $orderId]);
    }
}

switch ($action) {
    case 'get_orders':
        if (isAdmin()) {
            $stmt = $pdo->query("SELECT o.*, u.name AS confirmedByName FROM orders o LEFT JOIN users u ON o.confirmedById = u.id ORDER BY o.createdAt DESC LIMIT 500");
        } else if (isset($_SESSION['user'])) {
            $stmt = $pdo->prepare("SELECT o.*, u.name AS confirmedByName FROM orders o LEFT JOIN users u ON o.confirmedById = u.id WHERE o.userId = ? OR o.phone = ? ORDER BY o.createdAt DESC LIMIT 50");
            $stmt->execute([$_SESSION['user']['id'], $_SESSION['user']['phone']]);
        } else sendRes([]);
        $orders = $stmt->fetchAll();
        foreach ($orders as &$o) {
            $o['items'] = json_decode($o['items'], true) ?: [];
            $o['total'] = (float)$o['total'];
            $o['outstandingAmount'] = (float)($o['outstandingAmount'] ?? 0.00);

            // Fetch actual payments
            $payStmt = $pdo->prepare("SELECT paymentMethodId AS method, amount, reference FROM order_payments WHERE orderId = ?");
            $payStmt->execute([$o['id']]);
            $o['payments'] = $payStmt->fetchAll();
        }
        sendRes($orders);
        break;

    case 'save_order':
        // التحقق من وجود وردية مفتوحة لبدء البيع (فقط للفواتير الصادرة من الكاشير/الإدارة وليس لطلبات العملاء من المتجر)
        $activeShift = $pdo->query("SELECT id, currentCashBalance FROM shifts WHERE status = 'open'")->fetch();
        
        $orderId = $input['id'] ?? '';
        if (!empty($orderId)) {
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE id = ?");
            $checkStmt->execute([$orderId]);
            if ($checkStmt->fetchColumn() > 0) {
                sendRes(['status' => 'success', 'message' => 'الطلب مسجل بالفعل في قاعدة البيانات']);
            }
        }
        $isCashierInvoice = (strpos($orderId, 'INV-') === 0 || strpos($orderId, 'OFF-') === 0);
        
        if ($isCashierInvoice && !$activeShift) {
            sendErr('يجب فتح وردية أولاً لتسجيل المبيعات.');
        }
        
        $shiftId = $activeShift ? $activeShift['id'] : null;

        $pdo->beginTransaction();
        try {
            $phone = isset($input['phone']) ? normalizePhone($input['phone']) : '';
            $userId = $input['userId'] ?? null;

            if (!empty($phone)) {
                $userStmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
                $userStmt->execute([$phone]);
                $existingUser = $userStmt->fetch();
                
                if ($existingUser) {
                    $userId = $existingUser['id'];
                    $pdo->prepare("UPDATE users SET lastOrderAt = ? WHERE id = ?")->execute([time() * 1000, $userId]);
                } else {
                    try {
                        $userId = 'u_' . time() . '_' . rand(100, 999);
                        $randomPass = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
                        $insertUser = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt, lastOrderAt) VALUES (?, ?, ?, ?, 'user', ?, ?)");
                        $insertUser->execute([
                            $userId,
                            $input['customerName'] ?: 'عميل',
                            $phone,
                            $randomPass,
                            time() * 1000,
                            time() * 1000
                        ]);
                    } catch (PDOException $e) {
                        // التعامل مع إدخال متزامن لنفس الهاتف
                        $getUser = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
                        $getUser->execute([$phone]);
                        $existingUser = $getUser->fetch();
                        if ($existingUser) {
                            $userId = $existingUser['id'];
                            $pdo->prepare("UPDATE users SET lastOrderAt = ? WHERE id = ?")->execute([time() * 1000, $userId]);
                        } else {
                            throw $e;
                        }
                    }
                }
            }

            // التحقق من صحة وقيم الخصومات لمنع التلاعب بالقيمة
            $subtotalBeforeDiscount = 0.00;
            $totalItemDiscounts = 0.00;
            
            if (empty($input['items'])) {
                sendErr('خطأ: لا يمكن حفظ فاتورة فارغة.');
            }
            
            foreach ($input['items'] as $item) {
                $qty = (float)$item['quantity'];
                $price = (float)$item['price'];
                $discVal = (float)($item['discountValue'] ?? 0);
                $discType = $item['discountType'] ?? 'fixed';
                
                if ($discVal < 0 || $qty < 0 || $price < 0) {
                    sendErr('خطأ: لا يمكن استخدام قيم سالبة في الكميات أو الأسعار أو الخصومات.');
                }
                
                $itemDisc = $discType === 'percent' ? ($price * $discVal / 100) : $discVal;
                if ($itemDisc > $price) {
                    sendErr("خطأ: خصم الصنف ({$item['name']}) يتجاوز سعر بيعه.");
                }
                
                $subtotalBeforeDiscount += $price * $qty;
                $totalItemDiscounts += $itemDisc * $qty;
            }
            
            $subtotalAfterItems = $subtotalBeforeDiscount - $totalItemDiscounts;
            
            $invDiscVal = (float)($input['discountValue'] ?? 0);
            $invDiscType = $input['discountType'] ?? 'fixed';
            if ($invDiscVal < 0) {
                sendErr('خطأ: لا يمكن استخدام قيم سالبة لخصم الفاتورة.');
            }
            
            $invoiceDiscount = $invDiscType === 'percent' ? ($subtotalAfterItems * $invDiscVal / 100) : $invDiscVal;
            if ($invoiceDiscount > $subtotalAfterItems) {
                sendErr('خطأ: قيمة خصم الفاتورة الإجمالي تتجاوز إجمالي المنتجات بعد خصوماتها.');
            }
            
            $deliveryFee = (float)($input['deliveryFee'] ?? 0);
            if ($deliveryFee < 0) {
                sendErr('خطأ: لا يمكن استخدام رسوم توصيل سالبة.');
            }
            
            $finalTotal = $subtotalAfterItems - $invoiceDiscount + $deliveryFee;
            if ($finalTotal < 0) {
                sendErr('خطأ: المجموع النهائي للفاتورة لا يمكن أن يكون سالباً.');
            }

            $payments = $input['payments'] ?? [];
            $totalInvoiceAmount = (float)$finalTotal;
            
            // Backward compatibility fallback for store orders or simple saves
            if (empty($payments)) {
                $methodStr = $input['paymentMethod'] ?? 'نقدي';
                if (mb_strpos($methodStr, 'آجل') !== false) {
                    $payments = [];
                } elseif (mb_strpos($methodStr, 'فودافون') !== false) {
                    $payments = [['method' => 'vodafone', 'amount' => $totalInvoiceAmount]];
                } elseif (mb_strpos($methodStr, 'انستا') !== false || mb_strpos($methodStr, 'Insta') !== false) {
                    $payments = [['method' => 'instapay', 'amount' => $totalInvoiceAmount]];
                } elseif (mb_strpos($methodStr, 'فيزا') !== false || mb_strpos($methodStr, 'كارت') !== false || mb_strpos($methodStr, 'Visa') !== false) {
                    $payments = [['method' => 'visa', 'amount' => $totalInvoiceAmount]];
                } else {
                    $payments = [['method' => 'cash', 'amount' => $totalInvoiceAmount]];
                }
            }

            // Validate payments
            $sumOfPayments = 0.00;
            foreach ($payments as $pay) {
                $payAmt = (float)$pay['amount'];
                if ($payAmt < 0) {
                    sendErr('خطأ: لا يمكن استخدام مبالغ دفع سالبة.');
                }
                $sumOfPayments += $payAmt;
            }

            if ($sumOfPayments > $totalInvoiceAmount + 0.01) {
                sendErr('خطأ: إجمالي المدفوعات يتجاوز قيمة الفاتورة.');
            }

            $outstandingAmount = max(0.00, $totalInvoiceAmount - $sumOfPayments);

            $paymentStatus = 'unpaid';
            if ($outstandingAmount <= 0.00) {
                $paymentStatus = 'paid';
            } elseif ($sumOfPayments > 0.00) {
                $paymentStatus = 'partially_paid';
            }

            // Create backward-compatible payment method name summary
            $methodStrSummary = '';
            if (count($payments) === 0) {
                $methodStrSummary = 'آجل بالكامل';
            } elseif (count($payments) === 1) {
                $stmtMethodName = $pdo->prepare("SELECT name FROM payment_methods WHERE id = ?");
                $stmtMethodName->execute([$payments[0]['method']]);
                $methodStrSummary = $stmtMethodName->fetchColumn() ?: $payments[0]['method'];
                if ($outstandingAmount > 0) {
                    $methodStrSummary .= ' + آجل';
                }
            } else {
                $methodStrSummary = 'دفع مشترك';
                if ($outstandingAmount > 0) {
                    $methodStrSummary .= ' + آجل';
                }
            }

            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt, shiftId, confirmedAt, confirmedById, confirmedShiftId, paymentStatus, discount, discountType, discountValue, deliveryFee, totalItemDiscounts, subtotalBeforeDiscount, finalTotal, discountsMetadata, outstandingAmount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['id'], $input['customerName'], $phone, $input['city'] ?? 'سوق العصر', $input['address'],
                $subtotalBeforeDiscount, $finalTotal, json_encode($input['items']),
                $methodStrSummary, $input['status'], $userId, time() * 1000,
                $shiftId,
                $input['status'] === 'completed' ? time() * 1000 : null,
                $input['status'] === 'completed' ? ($_SESSION['user']['id'] ?? 'admin') : null,
                $input['status'] === 'completed' ? $shiftId : null,
                $paymentStatus,
                $invoiceDiscount,
                $invDiscType,
                $invDiscVal,
                $deliveryFee,
                $totalItemDiscounts,
                $subtotalBeforeDiscount,
                $finalTotal,
                $input['discountsMetadata'] ?? null,
                $outstandingAmount
            ]);

            // Save payments in order_payments table
            foreach ($payments as $pay) {
                if ((float)$pay['amount'] > 0) {
                    $stmtPay = $pdo->prepare("INSERT INTO order_payments (orderId, paymentMethodId, amount, reference, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmtPay->execute([
                        $input['id'],
                        $pay['method'],
                        (float)$pay['amount'],
                        $pay['reference'] ?? null,
                        time() * 1000,
                        $_SESSION['user']['id'] ?? 'admin'
                    ]);
                }
            }

            // جلب الإعدادات والسياسة المطبقة
            $settings = [];
            foreach ($pdo->query("SELECT * FROM settings")->fetchAll() as $s) {
                $settings[$s['setting_key']] = $s['setting_value'];
            }
            $policy = $settings['out_of_stock_policy'] ?? 'prevent';
            $negativeLimit = (float)($settings['negative_stock_limit'] ?? 0);
            
            // التحقق من الصلاحيات والمستخدم
            $curUserId = $_SESSION['user']['id'] ?? '';
            $curRole = $_SESSION['user']['role'] ?? '';
            $curName = $_SESSION['user']['name'] ?? 'غير معروف';
            $isAdminUser = ($curRole === 'admin');
            $hasOverridePerm = false;
            
            if (!$isAdminUser && !empty($curUserId)) {
                $uPerms = $pdo->prepare("SELECT permissions, name FROM users WHERE id = ?");
                $uPerms->execute([$curUserId]);
                $userRow = $uPerms->fetch();
                if ($userRow) {
                    $curName = $userRow['name'] ?: $curName;
                    $permsList = $userRow['permissions'];
                    if ($permsList) {
                        $perms = array_map('trim', explode(',', $permsList));
                        if (in_array('sell_without_stock', $perms) || in_array('override_stock_policy', $perms)) {
                            $hasOverridePerm = true;
                        }
                    }
                }
            }

            // تجميع وتلخيص الكميات المطلوبة بالوحدة الأساسية لكل منتج
            $requestedBaseQuantities = [];
            foreach ($input['items'] as $item) {
                $pId = $item['id'];
                $unitFactor = isset($item['conversionFactor']) ? (float)$item['conversionFactor'] : 1.00;
                $qtyInBase = (float)$item['quantity'] * $unitFactor;
                
                if (!isset($requestedBaseQuantities[$pId])) {
                    $requestedBaseQuantities[$pId] = 0.00;
                }
                $requestedBaseQuantities[$pId] += $qtyInBase;
            }

            foreach ($requestedBaseQuantities as $pId => $totalBaseQtyRequested) {
                // قفل السطر الخاص بالمنتج الأساسي (FOR UPDATE) لضمان اتساق مستويات المخزون ومنع التعارض
                $stmtStock = $pdo->prepare("SELECT stockQuantity, name, barcode FROM products WHERE id = ? FOR UPDATE");
                $stmtStock->execute([$pId]);
                $prod = $stmtStock->fetch();
                if ($prod) {
                    $currentStock = (float)$prod['stockQuantity'];
                    $newStock = $currentStock - $totalBaseQtyRequested;
                    if ($newStock < 0) {
                        // المخزون غير كافٍ، نتحقق من السياسة
                        if ($policy === 'prevent') {
                            sendErr("عذراً، المخزون غير كافٍ للمنتج ({$prod['name']}). المتاح بالوحدة الأساسية: {$currentStock}.");
                        } else if ($policy === 'admin_only' && !$isAdminUser && !$hasOverridePerm) {
                            sendErr("عذراً، البيع بدون مخزون مسموح للمدير فقط. المنتج ({$prod['name']}) المتاح منه بالوحدة الأساسية: {$currentStock}.");
                        } else if ($policy === 'allow_negative') {
                            if ($newStock < -$negativeLimit) {
                                sendErr("عذراً، تجاوز الحد الأقصى للمخزون السالب للمنتج ({$prod['name']}). الحد المسموح: -{$negativeLimit} قطعة، بينما المطلوب سيصل إلى {$newStock} قطعة.");
                            }
                        }
                        
                        // تسجيل تجاوز المخزون في سجل التدقيق والمراجعة
                        $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'SELL_OUT_OF_STOCK', ?, ?)");
                        $stmtLog->execute([
                            $curUserId ?: 'admin',
                            $shiftId,
                            json_encode([
                                'userName' => $curName,
                                'userRole' => $curRole ?: 'admin',
                                'productId' => $pId,
                                'productName' => $prod['name'],
                                'barcode' => $prod['barcode'],
                                'requestedQty' => $totalBaseQtyRequested,
                                'availableStock' => $currentStock,
                                'remainingStockAfter' => $newStock,
                                'policyUsed' => $policy,
                                'negativeLimit' => $negativeLimit,
                                'orderId' => $input['id']
                            ], JSON_UNESCAPED_UNICODE),
                            time() * 1000
                        ]);
                    }
                }
            }

            foreach ($requestedBaseQuantities as $pId => $totalBaseQtyRequested) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")->execute([$totalBaseQtyRequested, $totalBaseQtyRequested, $pId]);
            }

            // إذا كانت الفاتورة مكتملة وآجل، يتم ربطها بالعميل مع إنشاء حركة مديونية في كشف الحساب
            if ($input['status'] === 'completed' && $outstandingAmount > 0.00) {
                if (empty($userId)) {
                    sendErr('يرجى تحديد عميل لتسجيل المتبقي الآجل بقيمة ' . $outstandingAmount . ' ج.م');
                }
                
                // الحصول على آخر رصيد متراكم للعميل باستخدام قفل القراءة لمنع تعارض التزامن
                $stmtBal = $pdo->prepare("SELECT balanceAfter FROM customer_ledger WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1 FOR UPDATE");
                $stmtBal->execute([$userId]);
                $prevBalance = (float)($stmtBal->fetchColumn() ?: 0.00);
                $balanceAfter = $prevBalance + $outstandingAmount;

                $dueDate = isset($input['dueDate']) ? (int)$input['dueDate'] : null;

                // إدراج حركة مديونية
                $stmtLedger = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById, dueDate) VALUES (?, ?, 'SALE_ON_CREDIT', ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmtLedger->execute([
                    $userId,
                    $input['id'],
                    $outstandingAmount,
                    $balanceAfter,
                    'آجل (متبقي)',
                    $shiftId,
                    'مديونية متبقية من فاتورة مبيعات',
                    time() * 1000,
                    $_SESSION['user']['id'] ?? 'admin',
                    $dueDate
                ]);
                
                recalculateCustomerLedger($pdo, $userId);
            }
            
            updateOrderPaymentStatus($pdo, $input['id']);

            // زيادة نقدية الدرج بالمدفوعات النقدية الفعلية فقط
            if ($input['status'] === 'completed' && $shiftId) {
                $cashAmount = 0.00;
                foreach ($payments as $pay) {
                    $stmtMethod = $pdo->prepare("SELECT type FROM payment_methods WHERE id = ?");
                    $stmtMethod->execute([$pay['method']]);
                    $methodType = $stmtMethod->fetchColumn() ?: 'digital';
                    if ($methodType === 'cash') {
                        $cashAmount += (float)$pay['amount'];
                    }
                }
                if ($cashAmount > 0) {
                    $newBalance = (float)$activeShift['currentCashBalance'] + $cashAmount;
                    $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $shiftId]);
                }
            }

            $pdo->commit();
            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل في حفظ الفاتورة: ' . $e->getMessage(), 400, $e->getMessage());
        }
        break;

    case 'update_order':
        if (!isAdmin()) sendErr('غير مصرح');
        
        // التحقق من الوردية النشطة قبل بدء المعاملة
        $activeShift = $pdo->query("SELECT id, currentCashBalance FROM shifts WHERE status = 'open'")->fetch();
        if (!$activeShift) {
            sendErr('يجب فتح وردية أولاً لتأكيد واستلام النقدية.');
        }
        
        $pdo->beginTransaction();
        try {
            $id = $input['id'] ?? '';
            
            // قفل السجل باستخدام FOR UPDATE لحماية التزامن
            $stmtOld = $pdo->prepare("SELECT * FROM orders WHERE id = ? FOR UPDATE");
            $stmtOld->execute([$id]);
            $oldOrder = $stmtOld->fetch();
            if (!$oldOrder) {
                sendErr('الطلب غير موجود');
            }

            $newStatus = $input['status'] ?? 'pending';

            // حماية: منع تحويل الفواتير المكتملة إلى معلقة
            if ($oldOrder['status'] === 'completed' && $newStatus === 'pending') {
                sendErr('لا يمكن تحويل فاتورة مكتملة إلى حالة معلق.');
            }

            // استخلاص/إنشاء العميل بناءً على رقم الهاتف
            $phone = isset($input['phone']) ? normalizePhone($input['phone']) : '';
            $userId = $oldOrder['userId']; // الافتراضي هو العميل القديم

            if (!empty($phone)) {
                $userStmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
                $userStmt->execute([$phone]);
                $existingUser = $userStmt->fetch();
                
                if ($existingUser) {
                    $userId = $existingUser['id'];
                    $pdo->prepare("UPDATE users SET lastOrderAt = ? WHERE id = ?")->execute([time() * 1000, $userId]);
                } else {
                    try {
                        $userId = 'u_' . time() . '_' . rand(100, 999);
                        $randomPass = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
                        $insertUser = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt, lastOrderAt) VALUES (?, ?, ?, ?, 'user', ?, ?)");
                        $insertUser->execute([
                            $userId,
                            $input['customerName'] ?: 'عميل',
                            $phone,
                            $randomPass,
                            time() * 1000,
                            time() * 1000
                        ]);
                    } catch (PDOException $e) {
                        $getUser = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
                        $getUser->execute([$phone]);
                        $existingUser = $getUser->fetch();
                        if ($existingUser) {
                            $userId = $existingUser['id'];
                            $pdo->prepare("UPDATE users SET lastOrderAt = ? WHERE id = ?")->execute([time() * 1000, $userId]);
                        } else {
                            throw $e;
                        }
                    }
                }
            }

            // حذف أي حركة سابقة لهذه الفاتورة من كشف الحساب وإعادة احتساب رصيد العميل القديم
            $pdo->prepare("DELETE FROM customer_ledger WHERE orderId = ?")->execute([$id]);
            if (!empty($oldOrder['userId'])) {
                recalculateCustomerLedger($pdo, $oldOrder['userId']);
            }

            // إرجاع كميات المنتجات القديمة للمخزن أولاً بالاعتماد على معاملات التحويل التاريخية المحفوظة
            $oldItems = json_decode($oldOrder['items'], true) ?: [];
            foreach ($oldItems as $item) {
                $oldFactor = isset($item['conversionFactor']) ? (float)$item['conversionFactor'] : 1.00;
                $oldQtyInBase = (float)$item['quantity'] * $oldFactor;
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?")
                    ->execute([$oldQtyInBase, $oldQtyInBase, $item['id']]);
            }

            // جلب تفاصيل المدفوعات القديمة لخصم النقدية من الوردية السابقة
            $oldPayments = $pdo->prepare("SELECT p.*, m.type FROM order_payments p JOIN payment_methods m ON p.paymentMethodId = m.id WHERE p.orderId = ?");
            $oldPayments->execute([$id]);
            $oldCashAmount = 0.00;
            foreach ($oldPayments->fetchAll() as $op) {
                if ($op['type'] === 'cash') {
                    $oldCashAmount += (float)$op['amount'];
                }
            }

            // حذف سجلات الدفع القديمة
            $pdo->prepare("DELETE FROM order_payments WHERE orderId = ?")->execute([$id]);

            // خصم نقدية الدرج القديمة إذا كان الطلب مكتملاً
            $oldConfirmedShiftId = $oldOrder['confirmedShiftId'] ?: $oldOrder['shiftId'];
            if ($oldOrder['status'] === 'completed' && $oldConfirmedShiftId && $oldCashAmount > 0) {
                $stmtShift = $pdo->prepare("SELECT id, status, currentCashBalance FROM shifts WHERE id = ?");
                $stmtShift->execute([$oldConfirmedShiftId]);
                $orderShift = $stmtShift->fetch();
                if ($orderShift && $orderShift['status'] === 'open') {
                    $newBalance = (float)$orderShift['currentCashBalance'] - $oldCashAmount;
                    $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $orderShift['id']]);
                }
            }

            // تحديد قيم الأعمدة للتأكيد والاعتماد
            $confirmedAt = $oldOrder['confirmedAt'];
            $confirmedById = $oldOrder['confirmedById'];
            $confirmedShiftId = $oldOrder['confirmedShiftId'];

            if ($oldOrder['status'] === 'pending' && $newStatus === 'completed') {
                $confirmedAt = time() * 1000;
                $confirmedById = $_SESSION['user']['id'] ?? 'admin';
                $confirmedShiftId = $activeShift['id'];

                // تسجيل في سجل المراجعة
                $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'CONFIRM_ORDER', ?, ?)");
                $stmtLog->execute([
                    $_SESSION['user']['id'] ?? 'admin',
                    $activeShift['id'],
                    "تم تأكيد وتعديل الطلب من المتجر: " . $id,
                    time() * 1000
                ]);
            }

            // التحقق من صحة وقيم الخصومات لمنع التلاعب بالقيمة
            $subtotalBeforeDiscount = 0.00;
            $totalItemDiscounts = 0.00;
            
            if (empty($input['items'])) {
                sendErr('خطأ: لا يمكن حفظ فاتورة فارغة.');
            }
            
            foreach ($input['items'] as $item) {
                $qty = (float)$item['quantity'];
                $price = (float)$item['price'];
                $discVal = (float)($item['discountValue'] ?? 0);
                $discType = $item['discountType'] ?? 'fixed';
                
                if ($discVal < 0 || $qty < 0 || $price < 0) {
                    sendErr('خطأ: لا يمكن استخدام قيم سالبة في الكميات أو الأسعار أو الخصومات.');
                }
                
                $itemDisc = $discType === 'percent' ? ($price * $discVal / 100) : $discVal;
                if ($itemDisc > $price) {
                    sendErr("خطأ: خصم الصنف ({$item['name']}) يتجاوز سعر بيعه.");
                }
                
                $subtotalBeforeDiscount += $price * $qty;
                $totalItemDiscounts += $itemDisc * $qty;
            }
            
            $subtotalAfterItems = $subtotalBeforeDiscount - $totalItemDiscounts;
            
            $invDiscVal = (float)($input['discountValue'] ?? 0);
            $invDiscType = $input['discountType'] ?? 'fixed';
            if ($invDiscVal < 0) {
                sendErr('خطأ: لا يمكن استخدام قيم سالبة لخصم الفاتورة.');
            }
            
            $invoiceDiscount = $invDiscType === 'percent' ? ($subtotalAfterItems * $invDiscVal / 100) : $invDiscVal;
            if ($invoiceDiscount > $subtotalAfterItems) {
                sendErr('خطأ: قيمة خصم الفاتورة الإجمالي تتجاوز إجمالي المنتجات بعد خصوماتها.');
            }
            
            $deliveryFee = (float)($input['deliveryFee'] ?? 0);
            if ($deliveryFee < 0) {
                sendErr('خطأ: لا يمكن استخدام رسوم توصيل سالبة.');
            }
            
            $finalTotal = $subtotalAfterItems - $invoiceDiscount + $deliveryFee;
            if ($finalTotal < 0) {
                sendErr('خطأ: المجموع النهائي للفاتورة لا يمكن أن يكون سالباً.');
            }

            // لو كان الطلب مكتمل والخصومات تغيرت، نسجل ذلك في سجل المراجعة والتدقيق
            if ($oldOrder['status'] === 'completed') {
                $oldDisc = (float)($oldOrder['discount'] ?? 0);
                $newDisc = (float)$invoiceDiscount;
                $oldItemDisc = (float)($oldOrder['totalItemDiscounts'] ?? 0);
                $newItemDisc = (float)$totalItemDiscounts;
                
                if (abs($oldDisc - $newDisc) > 0.001 || abs($oldItemDisc - $newItemDisc) > 0.001) {
                    $reason = trim($input['editReason'] ?? 'تم تعديل الخصومات');
                    $details = "تعديل الخصومات في فاتورة مكتملة #{$id}. خصم الفاتورة القديم: {$oldDisc} ج.م، الجديد: {$newDisc} ج.م. خصم الأصناف القديم: {$oldItemDisc} ج.م، الجديد: {$newItemDisc} ج.م. السبب: {$reason}";
                    $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'UPDATE_DISCOUNTS', ?, ?)");
                    $stmtLog->execute([
                        $_SESSION['user']['id'] ?? 'admin',
                        $activeShift['id'],
                        $details,
                        time() * 1000
                    ]);
                }
            }

            // تحديث الطلب
            $shiftId = $oldOrder['shiftId'] ?: $activeShift['id'];
            
            $paymentStatus = 'unpaid';
            if ($newStatus === 'completed') {
                if (mb_strpos($input['paymentMethod'], 'آجل') !== false) {
                    $paymentStatus = 'unpaid';
                } else {
                    $paymentStatus = 'paid';
                }
            }

            $stmtUpdate = $pdo->prepare("UPDATE orders SET customerName = ?, phone = ?, city = ?, address = ?, subtotal = ?, total = ?, items = ?, paymentMethod = ?, status = ?, shiftId = ?, confirmedAt = ?, confirmedById = ?, confirmedShiftId = ?, userId = ?, paymentStatus = ?, discount = ?, discountType = ?, discountValue = ?, deliveryFee = ?, totalItemDiscounts = ?, subtotalBeforeDiscount = ?, finalTotal = ?, discountsMetadata = ? WHERE id = ?");
            $stmtUpdate->execute([
                $input['customerName'], $phone, $input['city'] ?? 'سوق العصر', $input['address'],
                $subtotalBeforeDiscount, $finalTotal, json_encode($input['items']),
                $input['paymentMethod'], $newStatus, $shiftId, $confirmedAt, $confirmedById, $confirmedShiftId, $userId, $paymentStatus,
                $invoiceDiscount,
                $invDiscType,
                $invDiscVal,
                $deliveryFee,
                $totalItemDiscounts,
                $subtotalBeforeDiscount,
                $finalTotal,
                $input['discountsMetadata'] ?? null,
                $id
            ]);

            // جلب الإعدادات والسياسة المطبقة
            $settings = [];
            foreach ($pdo->query("SELECT * FROM settings")->fetchAll() as $s) {
                $settings[$s['setting_key']] = $s['setting_value'];
            }
            $policy = $settings['out_of_stock_policy'] ?? 'prevent';
            $negativeLimit = (float)($settings['negative_stock_limit'] ?? 0);
            
            // التحقق من الصلاحيات والمستخدم
            $curUserId = $_SESSION['user']['id'] ?? '';
            $curRole = $_SESSION['user']['role'] ?? '';
            $curName = $_SESSION['user']['name'] ?? 'غير معروف';
            $isAdminUser = ($curRole === 'admin');
            $hasOverridePerm = false;
            
            if (!$isAdminUser && !empty($curUserId)) {
                $uPerms = $pdo->prepare("SELECT permissions, name FROM users WHERE id = ?");
                $uPerms->execute([$curUserId]);
                $userRow = $uPerms->fetch();
                if ($userRow) {
                    $curName = $userRow['name'] ?: $curName;
                    $permsList = $userRow['permissions'];
                    if ($permsList) {
                        $perms = array_map('trim', explode(',', $permsList));
                        if (in_array('sell_without_stock', $perms) || in_array('override_stock_policy', $perms)) {
                            $hasOverridePerm = true;
                        }
                    }
                }
            }

            // تجميع وتلخيص الكميات المطلوبة بالوحدة الأساسية لكل منتج للفاتورة المعدلة
            $requestedBaseQuantities = [];
            foreach ($input['items'] as $item) {
                $pId = $item['id'];
                $unitFactor = isset($item['conversionFactor']) ? (float)$item['conversionFactor'] : 1.00;
                $qtyInBase = (float)$item['quantity'] * $unitFactor;
                
                if (!isset($requestedBaseQuantities[$pId])) {
                    $requestedBaseQuantities[$pId] = 0.00;
                }
                $requestedBaseQuantities[$pId] += $qtyInBase;
            }

            foreach ($requestedBaseQuantities as $pId => $totalBaseQtyRequested) {
                // قفل السطر الخاص بالمنتج الأساسي (FOR UPDATE) لضمان اتساق مستويات المخزون ومنع التعارض
                $stmtStock = $pdo->prepare("SELECT stockQuantity, name, barcode FROM products WHERE id = ? FOR UPDATE");
                $stmtStock->execute([$pId]);
                $prod = $stmtStock->fetch();
                if ($prod) {
                    $currentStock = (float)$prod['stockQuantity'];
                    $newStock = $currentStock - $totalBaseQtyRequested;
                    if ($newStock < 0) {
                        // المخزون غير كافٍ، نتحقق من السياسة
                        if ($policy === 'prevent') {
                            sendErr("عذراً، المخزون غير كافٍ للمنتج ({$prod['name']}). المتاح بالوحدة الأساسية: {$currentStock}.");
                        } else if ($policy === 'admin_only' && !$isAdminUser && !$hasOverridePerm) {
                            sendErr("عذراً، البيع بدون مخزون مسموح للمدير فقط. المنتج ({$prod['name']}) المتاح منه بالوحدة الأساسية: {$currentStock}.");
                        } else if ($policy === 'allow_negative') {
                            if ($newStock < -$negativeLimit) {
                                sendErr("عذراً، تجاوز الحد الأقصى للمخزون السالب للمنتج ({$prod['name']}). الحد المسموح: -{$negativeLimit} قطعة، بينما المطلوب سيصل إلى {$newStock} قطعة.");
                            }
                        }
                        
                        // تسجيل تجاوز المخزون في سجل التدقيق والمراجعة
                        $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'SELL_OUT_OF_STOCK', ?, ?)");
                        $stmtLog->execute([
                            $curUserId ?: 'admin',
                            $shiftId,
                            json_encode([
                                'userName' => $curName,
                                'userRole' => $curRole ?: 'admin',
                                'productId' => $pId,
                                'productName' => $prod['name'],
                                'barcode' => $prod['barcode'],
                                'requestedQty' => $totalBaseQtyRequested,
                                'availableStock' => $currentStock,
                                'remainingStockAfter' => $newStock,
                                'policyUsed' => $policy,
                                'negativeLimit' => $negativeLimit,
                                'orderId' => $id
                            ], JSON_UNESCAPED_UNICODE),
                            time() * 1000
                        ]);
                    }
                }
            }

            // خصم الكميات الجديدة بالوحدة الأساسية من المخزن
            foreach ($requestedBaseQuantities as $pId => $totalBaseQtyRequested) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")
                    ->execute([$totalBaseQtyRequested, $totalBaseQtyRequested, $pId]);
            }

            // [NEW PAYMENTS UPDATE LOGIC START]
            $payments = $input['payments'] ?? [];
            $totalInvoiceAmount = (float)$finalTotal;
            
            // Backward compatibility fallback
            if (empty($payments)) {
                $methodStr = $input['paymentMethod'] ?? 'نقدي';
                if (mb_strpos($methodStr, 'آجل') !== false) {
                    $payments = [];
                } elseif (mb_strpos($methodStr, 'فودافون') !== false) {
                    $payments = [['method' => 'vodafone', 'amount' => $totalInvoiceAmount]];
                } elseif (mb_strpos($methodStr, 'انستا') !== false || mb_strpos($methodStr, 'Insta') !== false) {
                    $payments = [['method' => 'instapay', 'amount' => $totalInvoiceAmount]];
                } elseif (mb_strpos($methodStr, 'فيزا') !== false || mb_strpos($methodStr, 'كارت') !== false || mb_strpos($methodStr, 'Visa') !== false) {
                    $payments = [['method' => 'visa', 'amount' => $totalInvoiceAmount]];
                } else {
                    $payments = [['method' => 'cash', 'amount' => $totalInvoiceAmount]];
                }
            }

            // Validate payments
            $sumOfPayments = 0.00;
            foreach ($payments as $pay) {
                $payAmt = (float)$pay['amount'];
                if ($payAmt < 0) {
                    sendErr('خطأ: لا يمكن استخدام مبالغ دفع سالبة.');
                }
                $sumOfPayments += $payAmt;
            }

            if ($sumOfPayments > $totalInvoiceAmount + 0.01) {
                sendErr('خطأ: إجمالي المدفوعات يتجاوز قيمة الفاتورة.');
            }

            $outstandingAmount = max(0.00, $totalInvoiceAmount - $sumOfPayments);

            $paymentStatus = 'unpaid';
            if ($outstandingAmount <= 0.00) {
                $paymentStatus = 'paid';
            } elseif ($sumOfPayments > 0.00) {
                $paymentStatus = 'partially_paid';
            }

            // Create backward-compatible payment method name summary
            $methodStrSummary = '';
            if (count($payments) === 0) {
                $methodStrSummary = 'آجل بالكامل';
            } elseif (count($payments) === 1) {
                $stmtMethodName = $pdo->prepare("SELECT name FROM payment_methods WHERE id = ?");
                $stmtMethodName->execute([$payments[0]['method']]);
                $methodStrSummary = $stmtMethodName->fetchColumn() ?: $payments[0]['method'];
                if ($outstandingAmount > 0) {
                    $methodStrSummary .= ' + آجل';
                }
            } else {
                $methodStrSummary = 'دفع مشترك';
                if ($outstandingAmount > 0) {
                    $methodStrSummary .= ' + آجل';
                }
            }

            // Save payments in order_payments table
            foreach ($payments as $pay) {
                if ((float)$pay['amount'] > 0) {
                    $stmtPay = $pdo->prepare("INSERT INTO order_payments (orderId, paymentMethodId, amount, reference, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmtPay->execute([
                        $id,
                        $pay['method'],
                        (float)$pay['amount'],
                        $pay['reference'] ?? null,
                        time() * 1000,
                        $_SESSION['user']['id'] ?? 'admin'
                    ]);
                }
            }

            // Update order record fields
            $pdo->prepare("UPDATE orders SET paymentMethod = ?, paymentStatus = ?, outstandingAmount = ? WHERE id = ?")
                ->execute([$methodStrSummary, $paymentStatus, $outstandingAmount, $id]);

            // إذا أصبحت الفاتورة مكتملة وآجل، ننشئ حركة المديونية الجديدة ونعيد احتساب الرصيد
            if ($newStatus === 'completed' && $outstandingAmount > 0.00) {
                if (empty($userId)) {
                    sendErr('يرجى تحديد عميل لتسجيل المتبقي الآجل بقيمة ' . $outstandingAmount . ' ج.م');
                }

                $stmtBal = $pdo->prepare("SELECT balanceAfter FROM customer_ledger WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1 FOR UPDATE");
                $stmtBal->execute([$userId]);
                $prevBalance = (float)($stmtBal->fetchColumn() ?: 0.00);
                $balanceAfter = $prevBalance + $outstandingAmount;

                $dueDate = isset($input['dueDate']) ? (int)$input['dueDate'] : null;

                $stmtLedger = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById, dueDate) VALUES (?, ?, 'SALE_ON_CREDIT', ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmtLedger->execute([
                    $userId,
                    $id,
                    $outstandingAmount,
                    $balanceAfter,
                    'آجل (متبقي)',
                    $confirmedShiftId ?: $shiftId,
                    'تعديل فاتورة مبيعات آجل تلقائي',
                    time() * 1000,
                    $_SESSION['user']['id'] ?? 'admin',
                    $dueDate
                ]);

                recalculateCustomerLedger($pdo, $userId);
            }

            updateOrderPaymentStatus($pdo, $id);

            // إضافة نقدية الدرج الجديدة للوردية النشطة بالمدفوعات النقدية فقط
            if ($newStatus === 'completed') {
                $cashAmount = 0.00;
                foreach ($payments as $pay) {
                    $stmtMethod = $pdo->prepare("SELECT type FROM payment_methods WHERE id = ?");
                    $stmtMethod->execute([$pay['method']]);
                    $methodType = $stmtMethod->fetchColumn() ?: 'digital';
                    if ($methodType === 'cash') {
                        $cashAmount += (float)$pay['amount'];
                    }
                }
                if ($cashAmount > 0) {
                    $currentShift = $pdo->prepare("SELECT currentCashBalance FROM shifts WHERE id = ?");
                    $currentShift->execute([$activeShift['id']]);
                    $freshBalance = (float)$currentShift->fetchColumn();

                    $newBalance = $freshBalance + $cashAmount;
                    $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $activeShift['id']]);
                }
            }
            // [NEW PAYMENTS UPDATE LOGIC END]

            $pdo->commit();
            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('حدث خطأ أثناء تحديث الطلب', 500, $e->getMessage());
        }
        break;

    case 'update_order_payment':
        if (!isAdmin()) sendErr('غير مصرح');
        
        // التحقق من وجود وردية نشطة
        $activeShift = $pdo->query("SELECT id, currentCashBalance FROM shifts WHERE status = 'open'")->fetch();
        if (!$activeShift) {
            sendErr('يجب فتح وردية أولاً لتأكيد واستلام النقدية.');
        }

        $id = $input['id'] ?? '';
        $method = $input['paymentMethod'] ?? '';

        $pdo->beginTransaction();
        try {
            // قفل السجل FOR UPDATE لحماية التزامن
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? FOR UPDATE");
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            if (!$order) {
                sendErr('الطلب غير موجود');
            }
            
            $oldStatus = $order['status'] ?? 'pending';
            
            // حماية التزامن (Double Confirmation)
            if ($oldStatus !== 'pending') {
                sendErr('الطلب تم تأكيده أو إلغاؤه بالفعل مسبقاً.');
            }

            // حذف أي حركة سابقة لهذه الفاتورة من كشف الحساب وإعادة احتساب رصيد العميل القديم
            $pdo->prepare("DELETE FROM customer_ledger WHERE orderId = ?")->execute([$id]);
            if (!empty($order['userId'])) {
                recalculateCustomerLedger($pdo, $order['userId']);
            }

            $newMethod = !empty($method) ? $method : ($order['paymentMethod'] ?? 'نقدي (تم الدفع)');
            $shiftId = $order['shiftId'] ?: $activeShift['id'];
            
            $confirmedAt = time() * 1000;
            $confirmedById = $_SESSION['user']['id'] ?? 'admin';
            $confirmedShiftId = $activeShift['id'];
            
            // تسجيل في سجل المراجعة
            $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'CONFIRM_ORDER', ?, ?)");
            $stmtLog->execute([
                $_SESSION['user']['id'] ?? 'admin',
                $activeShift['id'],
                "تم تأكيد ودفع الطلب من المتجر: " . $id,
                time() * 1000
            ]);
            
            $paymentStatus = 'unpaid';
            if (mb_strpos($newMethod, 'آجل') !== false) {
                $paymentStatus = 'unpaid';
            } else {
                $paymentStatus = 'paid';
            }

            $stmtUpdate = $pdo->prepare("UPDATE orders SET paymentMethod = ?, status = 'completed', shiftId = ?, confirmedAt = ?, confirmedById = ?, confirmedShiftId = ?, paymentStatus = ? WHERE id = ?");
            $stmtUpdate->execute([$newMethod, $shiftId, $confirmedAt, $confirmedById, $confirmedShiftId, $paymentStatus, $id]);
            
            // إذا كانت الطريقة آجلة، نقوم بإضافة حركة المديونية لكشف الحساب
            if (mb_strpos($newMethod, 'آجل') !== false && !empty($order['userId'])) {
                $stmtBal = $pdo->prepare("SELECT balanceAfter FROM customer_ledger WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1 FOR UPDATE");
                $stmtBal->execute([$order['userId']]);
                $prevBalance = (float)($stmtBal->fetchColumn() ?: 0.00);
                $balanceAfter = $prevBalance + (float)$order['total'];

                $stmtLedger = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById) VALUES (?, ?, 'SALE_ON_CREDIT', ?, ?, ?, ?, ?, ?, ?)");
                $stmtLedger->execute([
                    $order['userId'],
                    $id,
                    (float)$order['total'],
                    $balanceAfter,
                    $newMethod,
                    $confirmedShiftId,
                    'تأكيد الدفع آجل تلقائي',
                    time() * 1000,
                    $_SESSION['user']['id'] ?? 'admin'
                ]);

                recalculateCustomerLedger($pdo, $order['userId']);
            }

            updateOrderPaymentStatus($pdo, $id);

            // إضافة نقدية الدرج إذا كانت نقداً
            if (mb_strpos($newMethod, 'نقدي') !== false || mb_strpos($newMethod, 'عند الاستلام') !== false) {
                // جلب رصيد الدرج الأحدث للوردية النشطة
                $currentShift = $pdo->prepare("SELECT currentCashBalance FROM shifts WHERE id = ?");
                $currentShift->execute([$activeShift['id']]);
                $freshBalance = (float)$currentShift->fetchColumn();

                $newBalance = $freshBalance + (float)$order['total'];
                $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $activeShift['id']]);
            }
            
            $pdo->commit();
            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('حدث خطأ أثناء تحديث حالة الدفع', 500, $e->getMessage());
        }
        break;

    case 'return_order':
        if (!isAdmin()) sendErr('غير مصرح');
        
        // التحقق من وجود وردية نشطة مفتوحة حالياً لتسجيل المرتجع فيها
        $activeOpenShift = $pdo->query("SELECT id, currentCashBalance FROM shifts WHERE status = 'open'")->fetch();
        if (!$activeOpenShift) {
            sendErr('يرجى فتح وردية أولاً لتتمكن من تسجيل المرتجع فيها.');
        }

        $pdo->beginTransaction();
        try {
            $id = $input['id'] ?? $_GET['id'] ?? '';
            
            // قفل السجل باستخدام FOR UPDATE لحماية التزامن ومنع المرتجع المكرر
            $stmt = $pdo->prepare("SELECT items, status, total, paymentMethod, shiftId, confirmedShiftId, userId, returnStatus FROM orders WHERE id = ? FOR UPDATE");
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            
            if ($order) {
                // منع المرتجع المكرر
                if ($order['status'] === 'cancelled' || $order['returnStatus'] === 'full') {
                    sendErr('هذه الفاتورة تم استرجاعها بالفعل مسبقاً.');
                }

                $items = json_decode($order['items'], true);
                
                // إرجاع كميات المنتجات إلى المخزن
                foreach ($items as $item) {
                    $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?")
                        ->execute([$item['quantity'], $item['quantity'], $item['id']]);
                }
                
                $now = time() * 1000;
                $currentUserId = $_SESSION['user']['id'] ?? 'admin';
                $reason = trim($input['reason'] ?? 'إلغاء واسترجاع كامل للفاتورة');
                
                // تحديث بيانات المرتجع في الفاتورة
                $stmtUpdateOrder = $pdo->prepare("UPDATE orders SET status = 'cancelled', returnShiftId = ?, returnedAt = ?, returnedAmount = ?, returnStatus = 'full', returnedById = ?, returnReason = ? WHERE id = ?");
                $stmtUpdateOrder->execute([
                    $activeOpenShift['id'],
                    $now,
                    (float)$order['total'],
                    $currentUserId,
                    $reason,
                    $id
                ]);

                // إذا كانت الفاتورة مكتملة، نتعامل مع المردود المالي بناءً على تفاصيل المدفوعات المسجلة بـ order_payments
                $refundSummary = '';
                if ($order['status'] === 'completed') {
                    // جلب تفاصيل المدفوعات المسجلة
                    $paymentsQuery = $pdo->prepare("SELECT p.*, m.type, m.name AS methodName FROM order_payments p JOIN payment_methods m ON p.paymentMethodId = m.id WHERE p.orderId = ?");
                    $paymentsQuery->execute([$id]);
                    $paymentsList = $paymentsQuery->fetchAll();

                    $cashRefundAmount = 0.00;
                    $refundSummaryParts = [];

                    foreach ($paymentsList as $pay) {
                        $payAmt = (float)$pay['amount'];
                        if ($pay['type'] === 'cash') {
                            $cashRefundAmount += $payAmt;
                        }
                        $refundSummaryParts[] = "{$pay['methodName']}: {$payAmt} ج.م";
                    }

                    // خصم النقدية المستردة من الوردية الجارية النشطة
                    if ($cashRefundAmount > 0) {
                        $newBalance = (float)$activeOpenShift['currentCashBalance'] - $cashRefundAmount;
                        $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $activeOpenShift['id']]);
                        
                        // إدراج حركة سحب تلقائية للمرتجع النقدي
                        $txStmt = $pdo->prepare("INSERT INTO drawer_transactions (shiftId, type, amount, reason, createdAt, userId) VALUES (?, 'withdrawal_refund', ?, ?, ?, ?)");
                        $txStmt->execute([
                            $activeOpenShift['id'],
                            $cashRefundAmount,
                            "مرتجع نقدي للفاتورة #{$id}: {$reason}",
                            $now,
                            $currentUserId
                        ]);
                    }

                    // قراءة المتبقي الآجل للعميل (outstandingAmount) من الفاتورة نفسها وتصفيره
                    $stmtGetOutstanding = $pdo->prepare("SELECT outstandingAmount, userId FROM orders WHERE id = ?");
                    $stmtGetOutstanding->execute([$id]);
                    $orderOutstanding = $stmtGetOutstanding->fetch();
                    $outstandingAmt = 0.00;
                    
                    if ($orderOutstanding && (float)$orderOutstanding['outstandingAmount'] > 0 && !empty($orderOutstanding['userId'])) {
                        $custUserId = $orderOutstanding['userId'];
                        $outstandingAmt = (float)$orderOutstanding['outstandingAmount'];

                        $stmtBal = $pdo->prepare("SELECT balanceAfter FROM customer_ledger WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1 FOR UPDATE");
                        $stmtBal->execute([$custUserId]);
                        $prevBalance = (float)($stmtBal->fetchColumn() ?: 0.00);
                        $balanceAfter = $prevBalance - $outstandingAmt;

                        // إدراج حركة تصفير مديونية
                        $stmtLedger = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById) VALUES (?, ?, 'RETURN', ?, ?, ?, ?, ?, ?, ?)");
                        $stmtLedger->execute([
                            $custUserId,
                            $id,
                            -$outstandingAmt,
                            $balanceAfter,
                            'آجل (مرتجع)',
                            $activeOpenShift['id'],
                            "مرتجع مديونية فاتورة #{$id}: {$reason}",
                            $now,
                            $currentUserId
                        ]);

                        recalculateCustomerLedger($pdo, $custUserId);
                    }
                    
                    $refundSummary = implode(' | ', $refundSummaryParts);
                    if ($outstandingAmt > 0) {
                        $refundSummary .= " | مديونية ملغاة: {$outstandingAmt} ج.م";
                    }
                }

                updateOrderPaymentStatus($pdo, $id);

                // تسجيل في سجل التدقيق (Audit Log)
                $auditDetails = "تم استرجاع الفاتورة #{$id} بالكامل بقيمة " . $order['total'] . " ج.م. السبب: {$reason} بواسطة " . ($_SESSION['user']['name'] ?? $currentUserId);
                $auditStmt = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'RETURN_ORDER', ?, ?)");
                $auditStmt->execute([
                    $currentUserId,
                    $activeOpenShift['id'],
                    $auditDetails,
                    $now
                ]);

                $pdo->commit();
                sendRes(['status' => 'success']);
            } else {
                sendErr('الطلب غير موجود');
            }
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('خطأ في الاسترجاع: ' . $e->getMessage());
        }
        break;

    case 'get_customer_ledger':
        $userId = $_GET['userId'] ?? $input['userId'] ?? '';
        if (empty($userId)) {
            sendErr('معرف المستخدم مطلوب');
        }
        
        // التحقق من الصلاحية: يجب أن يكون أدمن أو صاحب الحساب
        if (!isAdmin() && ($_SESSION['user']['id'] ?? '') !== $userId) {
            sendErr('غير مصرح');
        }

        // جلب حركات الحساب
        $stmtLedger = $pdo->prepare("SELECT cl.*, u.name AS createdByName FROM customer_ledger cl LEFT JOIN users u ON cl.createdById = u.id WHERE cl.userId = ? ORDER BY cl.createdAt DESC, cl.id DESC");
        $stmtLedger->execute([$userId]);
        $ledger = $stmtLedger->fetchAll();
        foreach ($ledger as &$item) {
            $item['amount'] = (float)$item['amount'];
            $item['balanceAfter'] = (float)$item['balanceAfter'];
        }

        // جلب الفواتير الآجلة للعميل
        $stmtOrders = $pdo->prepare("SELECT id, total, paymentMethod, status, paymentStatus, createdAt FROM orders WHERE userId = ? AND status = 'completed' AND paymentMethod LIKE '%آجل%' ORDER BY createdAt DESC");
        $stmtOrders->execute([$userId]);
        $creditOrders = $stmtOrders->fetchAll();
        foreach ($creditOrders as &$o) {
            $o['total'] = (float)$o['total'];
        }

        sendRes([
            'ledger' => $ledger,
            'creditOrders' => $creditOrders
        ]);
        break;

    case 'collect_customer_payment':
        // التحصيل المالي والتسويات
        $userId = $input['userId'] ?? '';
        $amount = (float)($input['amount'] ?? 0);
        $type = $input['type'] ?? 'PAYMENT'; // PAYMENT (تحصيل) أو ADJUSTMENT (تسوية)
        $paymentMethod = $input['paymentMethod'] ?? 'نقدي';
        $notes = trim($input['notes'] ?? '');
        $orderId = $input['orderId'] ?? null; // الفاتورة المرتبطة بالتحصيل (اختياري)

        if (empty($userId)) {
            sendErr('معرف المستخدم مطلوب');
        }

        if ($type === 'ADJUSTMENT') {
            if (!isAdmin()) {
                sendErr('غير مصرح لإجراء التسويات الحسابية.');
            }
            if (empty($notes)) {
                sendErr('يجب كتابة سبب التسوية في الملاحظات.');
            }
        } else {
            if ($amount <= 0) {
                sendErr('يجب إدخال قيمة صحيحة أكبر من الصفر للتحصيل.');
            }
        }

        // التحقق من وجود المستخدم
        $stmtUser = $pdo->prepare("SELECT name FROM users WHERE id = ?");
        $stmtUser->execute([$userId]);
        $user = $stmtUser->fetch();
        if (!$user) {
            sendErr('العميل غير موجود.');
        }

        $activeShift = null;
        if ($type === 'PAYMENT' && mb_strpos($paymentMethod, 'نقدي') !== false) {
            $activeShift = $pdo->query("SELECT id, currentCashBalance FROM shifts WHERE status = 'open'")->fetch();
            if (!$activeShift) {
                sendErr('يجب فتح وردية أولاً لتسجيل واستلام النقدية.');
            }
        }

        $pdo->beginTransaction();
        try {
            // قفل وحساب balanceAfter
            $stmtBal = $pdo->prepare("SELECT balanceAfter FROM customer_ledger WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1 FOR UPDATE");
            $stmtBal->execute([$userId]);
            $prevBalance = (float)($stmtBal->fetchColumn() ?: 0.00);

            $ledgerAmount = 0;
            if ($type === 'PAYMENT') {
                $ledgerAmount = -$amount; // السداد يخصم من المديونية
            } else { // ADJUSTMENT
                $ledgerAmount = (float)($input['amount'] ?? 0); // التسوية يمكن أن تكون موجبة أو سالبة
            }

            $balanceAfter = $prevBalance + $ledgerAmount;
            $shiftId = $activeShift ? $activeShift['id'] : null;
            $createdById = $_SESSION['user']['id'] ?? 'admin';
            $now = time() * 1000;

            // إذا كان تحصيلاً نقدياً، نقوم بتحديث نقدية الوردية النشطة
            if ($type === 'PAYMENT' && mb_strpos($paymentMethod, 'نقدي') !== false && $activeShift) {
                $newBalance = (float)$activeShift['currentCashBalance'] + $amount;
                $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $activeShift['id']]);
            }

            // تحديث حالة سداد الفواتير الآجلة للعميل وإنشاء حركات كشف الحساب
            if ($type === 'PAYMENT') {
                if (!empty($orderId)) {
                    // تحصيل مربوط بفاتورة محددة
                    $ledgerAmount = -$amount;
                    $balanceAfter = $prevBalance + $ledgerAmount;
                    $stmtInsert = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmtInsert->execute([
                        $userId,
                        $orderId,
                        $type,
                        $ledgerAmount,
                        $balanceAfter,
                        $paymentMethod,
                        $shiftId,
                        $notes ?: "سداد مديونية للفاتورة #{$orderId}",
                        $now,
                        $createdById
                    ]);
                    
                    updateOrderPaymentStatus($pdo, $orderId);
                } else {
                    // توزيع الدفعة على أقدم الفواتير الآجلة غير المسددة (FIFO)
                    $stmtUnpaid = $pdo->prepare("SELECT id, total FROM orders WHERE userId = ? AND status = 'completed' AND paymentMethod LIKE '%آجل%' AND paymentStatus != 'paid' ORDER BY createdAt ASC");
                    $stmtUnpaid->execute([$userId]);
                    $unpaidOrders = $stmtUnpaid->fetchAll();
                    
                    $remainingPayment = $amount;
                    $currentBalance = $prevBalance;
                    $insertedAny = false;
                    $stmtInsert = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    
                    foreach ($unpaidOrders as $uo) {
                        if ($remainingPayment <= 0) break;
                        
                        // جلب المبالغ المسددة مسبقاً لهذه الفاتورة
                        $stmtPaid = $pdo->prepare("SELECT IFNULL(SUM(ABS(amount)), 0) FROM customer_ledger WHERE orderId = ? AND type = 'PAYMENT'");
                        $stmtPaid->execute([$uo['id']]);
                        $alreadyPaid = (float)$stmtPaid->fetchColumn();
                        $orderRemaining = (float)$uo['total'] - $alreadyPaid;
                        
                        if ($orderRemaining <= 0) {
                            continue;
                        }
                        
                        $allocatedAmount = min($remainingPayment, $orderRemaining);
                        $remainingPayment -= $allocatedAmount;
                        
                        $ledgerAmount = -$allocatedAmount;
                        $currentBalance += $ledgerAmount;
                        
                        $stmtInsert->execute([
                            $userId,
                            $uo['id'],
                            'PAYMENT',
                            $ledgerAmount,
                            $currentBalance,
                            $paymentMethod,
                            $shiftId,
                            $notes ?: "سداد للفاتورة #" . $uo['id'],
                            $now,
                            $createdById
                        ]);
                        $insertedAny = true;
                        
                        updateOrderPaymentStatus($pdo, $uo['id']);
                    }
                    
                    // إذا كان هناك متبقي من الدفعة أو لم يكن للعميل أي فواتير غير مسددة
                    if ($remainingPayment > 0) {
                        $ledgerAmount = -$remainingPayment;
                        $currentBalance += $ledgerAmount;
                        $stmtInsert->execute([
                            $userId,
                            null,
                            'PAYMENT',
                            $ledgerAmount,
                            $currentBalance,
                            $paymentMethod,
                            $shiftId,
                            $notes ?: "سداد مديونية عامة (رصيد دائن)",
                            $now,
                            $createdById
                        ]);
                        $insertedAny = true;
                    }
                    
                    if (!$insertedAny) {
                        $ledgerAmount = -$amount;
                        $currentBalance += $ledgerAmount;
                        $stmtInsert->execute([
                            $userId,
                            null,
                            'PAYMENT',
                            $ledgerAmount,
                            $currentBalance,
                            $paymentMethod,
                            $shiftId,
                            $notes ?: "سداد مديونية عامة",
                            $now,
                            $createdById
                        ]);
                    }
                }
            } else {
                // ADJUSTMENT
                $ledgerAmount = (float)($input['amount'] ?? 0);
                $balanceAfter = $prevBalance + $ledgerAmount;
                $stmtInsert = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmtInsert->execute([
                    $userId,
                    null,
                    $type,
                    $ledgerAmount,
                    $balanceAfter,
                    $paymentMethod,
                    $shiftId,
                    $notes,
                    $now,
                    $createdById
                ]);
            }

            recalculateCustomerLedger($pdo, $userId);

            // كتابة سجل المراجعة (Audit Log)
            $logAction = ($type === 'PAYMENT') ? 'CUSTOMER_PAYMENT' : 'CUSTOMER_ADJUSTMENT';
            $logDetails = ($type === 'PAYMENT') 
                ? "تم تحصيل دفعة مديونية بقيمة {$amount} ج.م ({$paymentMethod}) من العميل {$user['name']}. ملاحظات: {$notes}"
                : "تم إجراء تسوية حسابية بقيمة {$ledgerAmount} ج.م للعميل {$user['name']}. السبب: {$notes}";
            
            $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, ?, ?, ?)");
            $stmtLog->execute([
                $createdById,
                $shiftId,
                $logAction,
                $logDetails,
                $now
            ]);

            // بعد التوزيع والتسوية، نعيد تشغيل تحديث الحالات لجميع الفواتير الآجلة للعميل للتأكيد
            $stmtAllOrders = $pdo->prepare("SELECT id FROM orders WHERE userId = ? AND status = 'completed' AND paymentMethod LIKE '%آجل%'");
            $stmtAllOrders->execute([$userId]);
            foreach ($stmtAllOrders->fetchAll() as $ao) {
                updateOrderPaymentStatus($pdo, $ao['id']);
            }

            $pdo->commit();
            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('حدث خطأ أثناء تسجيل الدفعة الحسابية', 500, $e->getMessage());
        }
        break;

    case 'get_payment_methods':
        $stmt = $pdo->query("SELECT * FROM payment_methods ORDER BY sortOrder ASC");
        sendRes($stmt->fetchAll());
        break;

    case 'add_payment_method':
        if (!isAdmin()) sendErr('غير مصرح');
        $id = $input['id'] ?? '';
        $name = $input['name'] ?? '';
        $type = $input['type'] ?? 'digital';
        $icon = $input['icon'] ?? '';
        $sortOrder = (int)($input['sortOrder'] ?? 0);
        
        if (empty($id) || empty($name)) {
            sendErr('معرف وسيلة الدفع والاسم مطلوبان.');
        }
        
        // Check if exists
        $exists = $pdo->prepare("SELECT COUNT(*) FROM payment_methods WHERE id = ?");
        $exists->execute([$id]);
        if ($exists->fetchColumn() > 0) {
            sendErr('معرف وسيلة الدفع مسجل بالفعل.');
        }

        $stmt = $pdo->prepare("INSERT INTO payment_methods (id, name, type, icon, isSystem, isActive, sortOrder, createdAt) VALUES (?, ?, ?, ?, 0, 1, ?, ?)");
        $stmt->execute([$id, $name, $type, $icon, $sortOrder, time() * 1000]);
        sendRes(['status' => 'success']);
        break;

    case 'update_payment_method':
        if (!isAdmin()) sendErr('غير مصرح');
        $id = $input['id'] ?? '';
        $name = $input['name'] ?? '';
        $type = $input['type'] ?? 'digital';
        $icon = $input['icon'] ?? '';
        $isActive = (int)($input['isActive'] ?? 1);
        $sortOrder = (int)($input['sortOrder'] ?? 0);
        
        if (empty($id) || empty($name)) {
            sendErr('المعرف والاسم مطلوبان للتحديث.');
        }

        $stmt = $pdo->prepare("UPDATE payment_methods SET name = ?, type = ?, icon = ?, isActive = ?, sortOrder = ? WHERE id = ?");
        $stmt->execute([$name, $type, $icon, $isActive, $sortOrder, $id]);
        sendRes(['status' => 'success']);
        break;

    case 'delete_payment_method':
        if (!isAdmin()) sendErr('غير مصرح');
        $id = $input['id'] ?? $_GET['id'] ?? '';
        
        if (empty($id)) {
            sendErr('يرجى تحديد المعرف.');
        }
        
        // Prevent deleting system methods
        $stmtCheck = $pdo->prepare("SELECT isSystem FROM payment_methods WHERE id = ?");
        $stmtCheck->execute([$id]);
        $method = $stmtCheck->fetch();
        if ($method && $method['isSystem']) {
            sendErr('لا يمكن حذف وسائل الدفع الأساسية للنظام.');
        }

        $stmt = $pdo->prepare("DELETE FROM payment_methods WHERE id = ?");
        $stmt->execute([$id]);
        sendRes(['status' => 'success']);
        break;
}
