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
            $stmt = $pdo->prepare("INSERT INTO orders (id, customerName, phone, city, address, subtotal, total, items, paymentMethod, status, userId, createdAt, shiftId, confirmedAt, confirmedById, confirmedShiftId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['id'], $input['customerName'], $input['phone'], $input['city'] ?? 'سوق العصر', $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $input['status'], $input['userId'] ?? null, time() * 1000,
                $shiftId,
                $input['status'] === 'completed' ? time() * 1000 : null,
                $input['status'] === 'completed' ? ($_SESSION['user']['id'] ?? 'admin') : null,
                $input['status'] === 'completed' ? $shiftId : null
            ]);
            foreach ($input['items'] as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")->execute([$item['quantity'], $item['quantity'], $item['id']]);
            }

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
            
            $stmtUpdate = $pdo->prepare("UPDATE orders SET customerName = ?, phone = ?, city = ?, address = ?, subtotal = ?, total = ?, items = ?, paymentMethod = ?, status = ?, shiftId = ?, confirmedAt = ?, confirmedById = ?, confirmedShiftId = ? WHERE id = ?");
            $stmtUpdate->execute([
                $input['customerName'], $input['phone'], $input['city'] ?? 'سوق العصر', $input['address'],
                $input['subtotal'], $input['total'], json_encode($input['items']),
                $input['paymentMethod'], $newStatus, $shiftId, $confirmedAt, $confirmedById, $confirmedShiftId, $id
            ]);

            // خصم الكميات الجديدة من المخزن
            foreach ($input['items'] as $item) {
                $pdo->prepare("UPDATE products SET stockQuantity = stockQuantity - ?, salesCount = salesCount + ? WHERE id = ?")
                    ->execute([$item['quantity'], $item['quantity'], $item['id']]);
            }

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
            
            $stmtUpdate = $pdo->prepare("UPDATE orders SET paymentMethod = ?, status = 'completed', shiftId = ?, confirmedAt = ?, confirmedById = ?, confirmedShiftId = ? WHERE id = ?");
            $stmtUpdate->execute([$newMethod, $shiftId, $confirmedAt, $confirmedById, $confirmedShiftId, $id]);
            
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
            $stmt = $pdo->prepare("SELECT items, status, total, paymentMethod, shiftId, confirmedShiftId FROM orders WHERE id = ? FOR UPDATE");
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

                    // خصم قيمة المرتجع النقدي من الوردية المفتوحة الحالية (فقط إذا كانت الفاتورة مكتملة)
                    if ($order['status'] === 'completed') {
                        $activeOpenShift = $pdo->query("SELECT id, currentCashBalance FROM shifts WHERE status = 'open'")->fetch();
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
}
