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
        $stmtOrder = $pdo->prepare("SELECT total, paymentMethod, status FROM orders WHERE id = ?");
        $stmtOrder->execute([$orderId]);
        $order = $stmtOrder->fetch();
        if (!$order) return;

        if ($order['status'] === 'cancelled') {
            $pdo->prepare("UPDATE orders SET paymentStatus = 'paid' WHERE id = ?")->execute([$orderId]);
            return;
        }

        if (mb_strpos($order['paymentMethod'], 'آجل') === false) {
            $pdo->prepare("UPDATE orders SET paymentStatus = 'paid' WHERE id = ?")->execute([$orderId]);
            return;
        }

        $stmtPaid = $pdo->prepare("SELECT IFNULL(SUM(ABS(amount)), 0) FROM customer_ledger WHERE orderId = ? AND type = 'PAYMENT'");
        $stmtPaid->execute([$orderId]);
        $totalPaid = (float)$stmtPaid->fetchColumn();

        $totalOrder = (float)$order['total'];

        $paymentStatus = 'unpaid';
        if ($totalPaid >= $totalOrder) {
            $paymentStatus = 'paid';
        } elseif ($totalPaid > 0) {
            $paymentStatus = 'partially_paid';
        }

        $pdo->prepare("UPDATE orders SET paymentStatus = ? WHERE id = ?")->execute([$paymentStatus, $orderId]);
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
        }
        sendRes($orders);
        break;

    case 'save_order':
        // التحقق من وجود وردية مفتوحة لبدء البيع (فقط للفواتير الصادرة من الكاشير/الإدارة وليس لطلبات العملاء من المتجر)
        $activeShift = $pdo->query("SELECT id, currentCashBalance FROM shifts WHERE status = 'open'")->fetch();
        
        $orderId = $input['id'] ?? '';
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

            $paymentStatus = 'unpaid';
            if ($input['status'] === 'completed') {
                if (mb_strpos($input['paymentMethod'], 'آجل') !== false) {
                    $paymentStatus = 'unpaid';
                } else {
                    $paymentStatus = 'paid';
                }
            }

            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt, shiftId, confirmedAt, confirmedById, confirmedShiftId, paymentStatus) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['id'], $input['customerName'], $phone, $input['city'] ?? 'سوق العصر', $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $input['status'], $userId, time() * 1000,
                $shiftId,
                $input['status'] === 'completed' ? time() * 1000 : null,
                $input['status'] === 'completed' ? ($_SESSION['user']['id'] ?? 'admin') : null,
                $input['status'] === 'completed' ? $shiftId : null,
                $paymentStatus
            ]);
            foreach ($input['items'] as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")->execute([$item['quantity'], $item['quantity'], $item['id']]);
            }

            // إذا كانت الفاتورة مكتملة وآجل، يتم ربطها بالعميل مع إنشاء حركة مديونية في كشف الحساب
            if ($input['status'] === 'completed' && mb_strpos($input['paymentMethod'], 'آجل') !== false && !empty($userId)) {
                // الحصول على آخر رصيد متراكم للعميل باستخدام قفل القراءة لمنع تعارض التزامن
                $stmtBal = $pdo->prepare("SELECT balanceAfter FROM customer_ledger WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1 FOR UPDATE");
                $stmtBal->execute([$userId]);
                $prevBalance = (float)($stmtBal->fetchColumn() ?: 0.00);
                $balanceAfter = $prevBalance + (float)$input['total'];

                // إدراج حركة مديونية
                $stmtLedger = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById) VALUES (?, ?, 'SALE_ON_CREDIT', ?, ?, ?, ?, ?, ?, ?)");
                $stmtLedger->execute([
                    $userId,
                    $input['id'],
                    (float)$input['total'],
                    $balanceAfter,
                    $input['paymentMethod'],
                    $shiftId,
                    'فاتورة مبيعات آجل تلقائية',
                    time() * 1000,
                    $_SESSION['user']['id'] ?? 'admin'
                ]);
                
                recalculateCustomerLedger($pdo, $userId);
            }
            
            updateOrderPaymentStatus($pdo, $input['id']);

            // زيادة نقدية الدرج في الوردية النشطة إذا كانت طريقة الدفع نقداً، الوردية مفتوحة، وحالة الطلب completed
            $method = $input['paymentMethod'] ?? '';
            $status = $input['status'] ?? 'pending';
            if ($status === 'completed' && $shiftId && (mb_strpos($method, 'نقدي') !== false || mb_strpos($method, 'عند الاستلام') !== false)) {
                $newBalance = (float)$activeShift['currentCashBalance'] + (float)$input['total'];
                $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $shiftId]);
            }

            $pdo->commit();
            sendRes(['status' => 'success']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('فشل في حفظ الفاتورة');
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

            // إرجاع كميات المنتجات القديمة للمخزن أولاً
            $oldItems = json_decode($oldOrder['items'], true) ?: [];
            foreach ($oldItems as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?")
                    ->execute([$item['quantity'], $item['quantity'], $item['id']]);
            }

            // خصم نقدية الدرج القديمة إذا كانت نقدية وكان الطلب مكتملاً
            $oldConfirmedShiftId = $oldOrder['confirmedShiftId'] ?: $oldOrder['shiftId'];
            if ($oldOrder['status'] === 'completed' && $oldConfirmedShiftId) {
                $oldMethod = $oldOrder['paymentMethod'] ?? '';
                if (mb_strpos($oldMethod, 'نقدي') !== false || mb_strpos($oldMethod, 'عند الاستلام') !== false) {
                    $stmtShift = $pdo->prepare("SELECT id, status, currentCashBalance FROM shifts WHERE id = ?");
                    $stmtShift->execute([$oldConfirmedShiftId]);
                    $orderShift = $stmtShift->fetch();
                    if ($orderShift && $orderShift['status'] === 'open') {
                        $newBalance = (float)$orderShift['currentCashBalance'] - (float)$oldOrder['total'];
                        $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $orderShift['id']]);
                    }
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

            $stmtUpdate = $pdo->prepare("UPDATE orders SET customerName = ?, phone = ?, city = ?, address = ?, subtotal = ?, total = ?, items = ?, paymentMethod = ?, status = ?, shiftId = ?, confirmedAt = ?, confirmedById = ?, confirmedShiftId = ?, userId = ?, paymentStatus = ? WHERE id = ?");
            $stmtUpdate->execute([
                $input['customerName'], $phone, $input['city'] ?? 'سوق العصر', $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $newStatus, $shiftId, $confirmedAt, $confirmedById, $confirmedShiftId, $userId, $paymentStatus, $id
            ]);

            // خصم الكميات الجديدة من المخزن
            foreach ($input['items'] as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")
                    ->execute([$item['quantity'], $item['quantity'], $item['id']]);
            }

            // إذا أصبحت الفاتورة مكتملة وآجل، ننشئ حركة المديونية الجديدة ونعيد احتساب الرصيد
            if ($newStatus === 'completed' && mb_strpos($input['paymentMethod'], 'آجل') !== false && !empty($userId)) {
                $stmtBal = $pdo->prepare("SELECT balanceAfter FROM customer_ledger WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1 FOR UPDATE");
                $stmtBal->execute([$userId]);
                $prevBalance = (float)($stmtBal->fetchColumn() ?: 0.00);
                $balanceAfter = $prevBalance + (float)$input['total'];

                $stmtLedger = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById) VALUES (?, ?, 'SALE_ON_CREDIT', ?, ?, ?, ?, ?, ?, ?)");
                $stmtLedger->execute([
                    $userId,
                    $id,
                    (float)$input['total'],
                    $balanceAfter,
                    $input['paymentMethod'],
                    $confirmedShiftId ?: $shiftId,
                    'تعديل فاتورة مبيعات آجل تلقائي',
                    time() * 1000,
                    $_SESSION['user']['id'] ?? 'admin'
                ]);

                recalculateCustomerLedger($pdo, $userId);
            }

            updateOrderPaymentStatus($pdo, $id);

            // إضافة نقدية الدرج الجديدة للوردية النشطة إذا كانت طريقة الدفع نقداً والطلب الجديد مكتمل
            $newMethod = $input['paymentMethod'] ?? '';
            if ($newStatus === 'completed' && (mb_strpos($newMethod, 'نقدي') !== false || mb_strpos($newMethod, 'عند الاستلام') !== false)) {
                // جلب رصيد الدرج الأحدث للوردية النشطة
                $currentShift = $pdo->prepare("SELECT currentCashBalance FROM shifts WHERE id = ?");
                $currentShift->execute([$activeShift['id']]);
                $freshBalance = (float)$currentShift->fetchColumn();

                $newBalance = $freshBalance + (float)$input['total'];
                $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $activeShift['id']]);
            }

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
        $pdo->beginTransaction();
        try {
            $id = $input['id'] ?? $_GET['id'] ?? '';
            $stmt = $pdo->prepare("SELECT items, status, total, paymentMethod, shiftId, confirmedShiftId, userId FROM orders WHERE id = ? FOR UPDATE");
            $stmt->execute([$id]);
            $order = $stmt->fetch();
            if ($order) {
                // منع التعديل أو الاسترجاع للفواتير التابعة لورديات مغلقة
                $checkShiftId = $order['confirmedShiftId'] ?: $order['shiftId'];
                if ($checkShiftId) {
                    $stmtShift = $pdo->prepare("SELECT status FROM shifts WHERE id = ?");
                    $stmtShift->execute([$checkShiftId]);
                    $shift = $stmtShift->fetch();
                    if ($shift && $shift['status'] === 'closed') {
                        sendErr('لا يمكن إلغاء أو استرجاع فواتير تابعة لورديات مغلقة.');
                    }
                }

                if ($order['status'] !== 'cancelled') {
                    $items = json_decode($order['items'], true);
                    foreach ($items as $item) {
                        $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity + ?, salesCount = salesCount - ? WHERE id = ?")->execute([$item['quantity'], $item['quantity'], $item['id']]);
                    }
                    $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?")->execute([$id]);

                    $activeOpenShift = $pdo->query("SELECT id, currentCashBalance FROM shifts WHERE status = 'open'")->fetch();

                    // إذا كانت الفاتورة المسترجعة مكتملة وآجل، نسجل حركة مرتجع لخفض مديونية كشف الحساب
                    if ($order['status'] === 'completed' && mb_strpos($order['paymentMethod'], 'آجل') !== false && !empty($order['userId'])) {
                        // الحصول على آخر رصيد متراكم للعميل باستخدام قفل القراءة لمنع تعارض التزامن
                        $stmtBal = $pdo->prepare("SELECT balanceAfter FROM customer_ledger WHERE userId = ? ORDER BY createdAt DESC, id DESC LIMIT 1 FOR UPDATE");
                        $stmtBal->execute([$order['userId']]);
                        $prevBalance = (float)($stmtBal->fetchColumn() ?: 0.00);
                        $balanceAfter = $prevBalance - (float)$order['total'];

                        // إدراج حركة المرتجع
                        $stmtLedger = $pdo->prepare("INSERT INTO customer_ledger (userId, orderId, type, amount, balanceAfter, paymentMethod, shiftId, notes, createdAt, createdById) VALUES (?, ?, 'RETURN', ?, ?, ?, ?, ?, ?, ?)");
                        $stmtLedger->execute([
                            $order['userId'],
                            $id,
                            -((float)$order['total']),
                            $balanceAfter,
                            $order['paymentMethod'],
                            $activeOpenShift ? $activeOpenShift['id'] : null,
                            'مرتجع فاتورة آجل',
                            time() * 1000,
                            $_SESSION['user']['id'] ?? 'admin'
                        ]);

                        recalculateCustomerLedger($pdo, $order['userId']);
                    }

                    updateOrderPaymentStatus($pdo, $id);

                    // خصم قيمة المرتجع النقدي من الوردية المفتوحة الحالية (فقط إذا كانت الفاتورة مكتملة)
                    if ($order['status'] === 'completed') {
                        if ($activeOpenShift) {
                            $method = $order['paymentMethod'] ?? '';
                            if (mb_strpos($method, 'نقدي') !== false || mb_strpos($method, 'عند الاستلام') !== false) {
                                $newBalance = (float)$activeOpenShift['currentCashBalance'] - (float)$order['total'];
                                $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $activeOpenShift['id']]);
                            }
                        }
                    }

                    $pdo->commit();
                    sendRes(['status' => 'success']);
                } else sendErr('الطلب ملغي مسبقاً');
            } else sendErr('الطلب غير موجود');
        } catch (Exception $e) {
            $pdo->rollBack();
            sendErr('خطأ في الاسترجاع');
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
}
