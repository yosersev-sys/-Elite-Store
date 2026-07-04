<?php
/**
 * Shift & Cash Drawer Module - Soq Al-Asr POS
 */
if (!defined('DB_HOST')) exit;

// التحقق وإضافة أعمدة التأكيد والاعتماد ديناميكياً لجدول الطلبات إذا لم تكن موجودة
try {
    $checkCols = $pdo->query("SHOW COLUMNS FROM orders LIKE 'confirmedShiftId'")->fetch();
    if (!$checkCols) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN confirmedShiftId INT NULL");
    }
} catch (Exception $e) {
    // تجاهل أي خطأ مؤقت لتفادي التوقف
}

// التحقق من تسجيل الدخول العام لكافة حركات الورديات
if (!isset($_SESSION['user'])) {
    sendErr('يجب تسجيل الدخول أولاً', 401);
}

switch ($action) {
    case 'get_active_shift':
        $shift = $pdo->query("SELECT s.*, u.name as openedByName FROM shifts s LEFT JOIN users u ON s.openedById = u.id WHERE s.status = 'open'")->fetch();
        if ($shift) {
            $shiftId = (int)$shift['id'];
            $shift['startingCash'] = (float)$shift['startingCash'];
            $shift['expectedCash'] = (float)$shift['expectedCash'];
            $shift['actualCash'] = (float)$shift['actualCash'];
            $shift['currentCashBalance'] = (float)$shift['currentCashBalance'];
            $shift['difference'] = (float)$shift['difference'];

            // Recalculate cash balance dynamically to fix any mismatches
            $completedCash = 0.0;
            $stmtCompleted = $pdo->prepare("SELECT total, paymentMethod FROM orders WHERE confirmedShiftId = ? AND status = 'completed'");
            $stmtCompleted->execute([$shiftId]);
            foreach ($stmtCompleted->fetchAll() as $o) {
                if (strpos($o['paymentMethod'], 'نقدي') !== false || strpos($o['paymentMethod'], 'عند الاستلام') !== false) {
                    $completedCash += (float)$o['total'];
                }
            }

            $cancelledCash = 0.0;
            $stmtCancelled = $pdo->prepare("SELECT total, paymentMethod FROM orders WHERE returnShiftId = ? AND status = 'cancelled'");
            $stmtCancelled->execute([$shiftId]);
            foreach ($stmtCancelled->fetchAll() as $o) {
                if (strpos($o['paymentMethod'], 'نقدي') !== false || strpos($o['paymentMethod'], 'عند الاستلام') !== false) {
                    $cancelledCash += (float)$o['total'];
                }
            }

            $deposits = 0.0;
            $withdrawals = 0.0;
            $stmtTxs = $pdo->prepare("SELECT type, amount FROM drawer_transactions WHERE shiftId = ?");
            $stmtTxs->execute([$shiftId]);
            foreach ($stmtTxs->fetchAll() as $t) {
                if ($t['type'] === 'deposit') {
                    $deposits += (float)$t['amount'];
                } elseif ($t['type'] === 'withdrawal') {
                    $withdrawals += (float)$t['amount'];
                }
            }

            $correctCash = (float)$shift['startingCash'] + $completedCash - $cancelledCash + $deposits - $withdrawals;
            if (abs((float)$shift['currentCashBalance'] - $correctCash) > 0.01) {
                $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$correctCash, $shiftId]);
                $shift['currentCashBalance'] = $correctCash;
            }

            sendRes($shift);
        } else {
            sendRes(['status' => 'no_active_shift']);
        }
        break;

    case 'open_shift':
        // تأكيد وجود حقل اسم الوردية
        try {
            $pdo->exec("ALTER TABLE shifts ADD COLUMN shiftName VARCHAR(100) NULL DEFAULT NULL");
        } catch (Exception $e) {}

        // التحقق من عدم وجود وردية مفتوحة بالفعل على السيرفر
        $activeCount = (int)$pdo->query("SELECT COUNT(*) FROM shifts WHERE status = 'open'")->fetchColumn();
        if ($activeCount > 0) {
            sendErr('يوجد وردية مفتوحة بالفعل بنشاط. يرجى إغلاقها أولاً.');
        }

        $startingCash = (float)($input['startingCash'] ?? 0);
        if ($startingCash < 0) {
            sendErr('يجب إدخال رصيد بداية صحيح غير سالب.');
        }

        $shiftName = trim($input['shiftName'] ?? '');
        if (empty($shiftName)) {
            sendErr('يرجى إدخال اسم الوردية أولاً.');
        }

        $userId = $_SESSION['user']['id'];
        $now = time() * 1000;

        $stmt = $pdo->prepare("INSERT INTO shifts (openedById, status, startTime, startingCash, expectedCash, actualCash, currentCashBalance, difference, shiftName) VALUES (?, 'open', ?, ?, ?, 0, ?, 0, ?)");
        $stmt->execute([$userId, $now, $startingCash, $startingCash, $startingCash, $shiftName]);
        $shiftId = $pdo->lastInsertId();

        // تسجيل في سجل التدقيق
        $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'OPEN_SHIFT', ?, ?)");
        $stmtLog->execute([
            $userId,
            $shiftId,
            "تم فتح الوردية رقم {$shiftId} (اسمها: {$shiftName}) برصيد بداية: {$startingCash} ج.م بواسطة " . $_SESSION['user']['name'],
            $now
        ]);

        sendRes(['status' => 'success', 'shiftId' => $shiftId]);
        break;

    case 'add_drawer_transaction':
        // التحقق من وجود وردية مفتوحة
        $active = $pdo->query("SELECT * FROM shifts WHERE status = 'open'")->fetch();
        if (!$active) {
            sendErr('لا توجد وردية مفتوحة حالياً لتسجيل الحركة.');
        }

        $type = $input['type'] ?? ''; // 'deposit' or 'withdrawal'
        $amount = (float)($input['amount'] ?? 0);
        $reason = trim($input['reason'] ?? '');

        if ($type !== 'deposit' && $type !== 'withdrawal') {
            sendErr('نوع الحركة غير صحيح.');
        }
        if ($amount <= 0) {
            sendErr('يجب إدخال قيمة حركة صحيحة أكبر من الصفر.');
        }
        if (empty($reason)) {
            sendErr('يرجى كتابة سبب الحركة.');
        }

        $currentBalance = (float)$active['currentCashBalance'];

        // منع السحب في حالة عجز النقدية بالدرج
        if ($type === 'withdrawal' && $amount > $currentBalance) {
            sendErr("لا يوجد رصيد كافٍ بالدرج. الرصيد الحالي: {$currentBalance} ج.م، القيمة المطلوبة لسحبها: {$amount} ج.م");
        }

        $userId = $_SESSION['user']['id'];
        $now = time() * 1000;

        // إدراج الحركة
        $stmt = $pdo->prepare("INSERT INTO drawer_transactions (shiftId, type, amount, reason, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$active['id'], $type, $amount, $reason, $now, $userId]);

        // تحديث الرصيد التراكمي للدرج في الوردية
        $newBalance = ($type === 'deposit') ? ($currentBalance + $amount) : ($currentBalance - $amount);
        $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $active['id']]);

        // تسجيل في سجل التدقيق
        $actionName = ($type === 'deposit') ? 'إيداع نقدي' : 'سحب نقدي';
        $details = "تم إجراء {$actionName} بقيمة {$amount} ج.م لسبب: {$reason}";
        $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'ADD_DRAWER_TX', ?, ?)");
        $stmtLog->execute([$userId, $active['id'], $details, $now]);

        sendRes(['status' => 'success']);
        break;

    case 'close_shift':
        // التحقق من وجود وردية مفتوحة
        $active = $pdo->query("SELECT * FROM shifts WHERE status = 'open'")->fetch();
        if (!$active) {
            sendErr('لا توجد وردية مفتوحة حالياً لإغلاقها.');
        }

        $actualCash = (float)($input['actualCash'] ?? 0);
        if ($actualCash < 0) {
            sendErr('يرجى إدخال نقدية فعلية صحيحة.');
        }

        $shiftId = $active['id'];

        // 1. حساب المبيعات والمرتجع النقدي والإلكتروني والآجل
        $ordersQuery = $pdo->prepare("SELECT total, paymentMethod, status, confirmedShiftId, returnShiftId, returnedAmount FROM orders WHERE confirmedShiftId = ? OR returnShiftId = ?");
        $ordersQuery->execute([$shiftId, $shiftId]);
        $ordersList = $ordersQuery->fetchAll();

        $cashSales = 0.0;
        $cashReturns = 0.0;
        $cardSales = 0.0;
        $debtSales = 0.0;
        $ordersCount = 0;
        $returnsCount = 0;

        foreach ($ordersList as $ord) {
            $total = (float)$ord['total'];
            $returnedAmount = (float)($ord['returnedAmount'] ?? 0.0);
            $method = $ord['paymentMethod'] ?? '';
            $status = $ord['status'] ?? '';
            $confShift = $ord['confirmedShiftId'] ? (int)$ord['confirmedShiftId'] : null;
            $retShift = $ord['returnShiftId'] ? (int)$ord['returnShiftId'] : null;

            // احتساب المبيعات في هذه الوردية
            if ($confShift === $shiftId) {
                if ($status !== 'cancelled') {
                    $ordersCount++;
                    if (mb_strpos($method, 'نقدي') !== false || mb_strpos($method, 'عند الاستلام') !== false) {
                        $cashSales += $total;
                    } elseif (mb_strpos($method, 'آجل') !== false) {
                        $debtSales += $total;
                    } else {
                        $cardSales += $total;
                    }
                } else {
                    // إذا بيعت واسترجعت في نفس الوردية
                    if ($retShift === $shiftId || empty($retShift)) {
                        if (mb_strpos($method, 'نقدي') !== false || mb_strpos($method, 'عند الاستلام') !== false) {
                            $cashSales += $total;
                            $cashReturns += $returnedAmount ?: $total;
                            $returnsCount++;
                        }
                    } else {
                        // إذا بيعت في هذه الوردية واسترجعت في وردية أخرى لاحقة
                        if (mb_strpos($method, 'نقدي') !== false || mb_strpos($method, 'عند الاستلام') !== false) {
                            $cashSales += $total;
                        } elseif (mb_strpos($method, 'آجل') !== false) {
                            $debtSales += $total;
                        } else {
                            $cardSales += $total;
                        }
                        $ordersCount++;
                    }
                }
            }

            // احتساب المرتجعات في هذه الوردية
            if ($retShift === $shiftId) {
                if ($confShift !== $shiftId) {
                    $returnsCount++;
                    if (mb_strpos($method, 'نقدي') !== false || mb_strpos($method, 'عند الاستلام') !== false) {
                        $cashReturns += $returnedAmount ?: $total;
                    }
                }
            }
        }

        // 2. حساب حركات الدرج اليدوية
        $txQuery = $pdo->prepare("SELECT type, SUM(amount) as total_amount FROM drawer_transactions WHERE shiftId = ? GROUP BY type");
        $txQuery->execute([$shiftId]);
        $txTotals = $txQuery->fetchAll();

        $totalDeposits = 0.0;
        $totalWithdrawals = 0.0;
        foreach ($txTotals as $tx) {
            if ($tx['type'] === 'deposit') {
                $totalDeposits = (float)$tx['total_amount'];
            } elseif ($tx['type'] === 'withdrawal') {
                $totalWithdrawals = (float)$tx['total_amount'];
            }
        }

        // 2.5 حساب تحصيلات ديون العملاء النقدية خلال هذه الوردية
        $ledgerCashPayments = abs((float)$pdo->query("SELECT IFNULL(SUM(amount), 0) FROM customer_ledger WHERE shiftId = {$shiftId} AND type = 'PAYMENT' AND paymentMethod LIKE '%نقدي%'")->fetchColumn());

        // 3. حساب الرصيد المتوقع بالمعادلة المحاسبية الشاملة (مطابق للرصيد الدفتري المسجل بالدرج)
        $expectedCash = (float)$active['currentCashBalance'];

        // 4. احتساب الفرق
        $difference = round($actualCash - $expectedCash, 2);

        // 5. التحقق من إلزامية إدخال سبب الفارق (عجز أو زيادة)
        $discrepancyReason = trim($input['discrepancyReason'] ?? '');
        if (abs($difference) >= 0.01 && empty($discrepancyReason)) {
            sendErr('يوجد فارق جرد بالزيادة أو العجز. يرجى إدخال سبب الفارق قبل إغلاق الوردية.');
        }

        // 6. تجميد البيانات في الـ Snapshot لحماية البيانات التاريخية
        $snapshot = [
            'cashSales' => $cashSales,
            'cashReturns' => $cashReturns,
            'cardSales' => $cardSales,
            'debtSales' => $debtSales,
            'totalDeposits' => $totalDeposits,
            'totalWithdrawals' => $totalWithdrawals,
            'ledgerCashPayments' => $ledgerCashPayments,
            'ordersCount' => $ordersCount,
            'returnsCount' => $returnsCount
        ];

        $userId = $_SESSION['user']['id'];
        $now = time() * 1000;
        $notes = trim($input['notes'] ?? '');

        // 7. إغلاق الوردية رسمياً
        $stmt = $pdo->prepare("UPDATE shifts SET status = 'closed', endTime = ?, closedById = ?, expectedCash = ?, actualCash = ?, difference = ?, discrepancyReason = ?, notes = ?, snapshotData = ?, currentCashBalance = ? WHERE id = ?");
        $stmt->execute([
            $now,
            $userId,
            $expectedCash,
            $actualCash,
            $difference,
            $difference != 0 ? $discrepancyReason : null,
            $notes,
            json_encode($snapshot, JSON_UNESCAPED_UNICODE),
            $actualCash, // الرصيد المتبقي الفعلي يُرّحل كنهاية للوردية
            $shiftId
        ]);

        // 8. تسجيل في سجل التدقيق
        $details = "تم إغلاق الوردية رقم {$shiftId}. النقدية المتوقعة: {$expectedCash} ج.م، الفعلية: {$actualCash} ج.م، الفرق: {$difference} ج.م";
        if ($difference != 0) {
            $details .= " (سبب الفرق: {$discrepancyReason})";
        }
        $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'CLOSE_SHIFT', ?, ?)");
        $stmtLog->execute([$userId, $shiftId, $details, $now]);

        sendRes(['status' => 'success']);
        break;

    case 'get_shifts':
        $shifts = $pdo->query("SELECT s.*, u1.name as openedByName, u2.name as closedByName FROM shifts s LEFT JOIN users u1 ON s.openedById = u1.id LEFT JOIN users u2 ON s.closedById = u2.id ORDER BY s.id DESC LIMIT 100")->fetchAll();
        foreach ($shifts as &$s) {
            $s['startingCash'] = (float)$s['startingCash'];
            $s['expectedCash'] = (float)$s['expectedCash'];
            $s['actualCash'] = (float)$s['actualCash'];
            $s['currentCashBalance'] = (float)$s['currentCashBalance'];
            $s['difference'] = (float)$s['difference'];
        }
        sendRes($shifts);
        break;

    case 'get_shift_details':
        $shiftId = (int)($_GET['id'] ?? 0);
        if ($shiftId <= 0) {
            sendErr('معرف الوردية غير صحيح.');
        }

        $shift = $pdo->prepare("SELECT s.*, u1.name as openedByName, u2.name as closedByName FROM shifts s LEFT JOIN users u1 ON s.openedById = u1.id LEFT JOIN users u2 ON s.closedById = u2.id WHERE s.id = ?");
        $shift->execute([$shiftId]);
        $sData = $shift->fetch();

        if (!$sData) {
            sendErr('الوردية المطلوبة غير موجودة.');
        }

        $sData['startingCash'] = (float)$sData['startingCash'];
        $sData['expectedCash'] = (float)$sData['expectedCash'];
        $sData['actualCash'] = (float)$sData['actualCash'];
        $sData['currentCashBalance'] = (float)$sData['currentCashBalance'];
        $sData['difference'] = (float)$sData['difference'];

        // Recalculate cash balance dynamically on load to fix any mismatches (e.g. from old returned orders)
        $completedCash = 0.0;
        $stmtCompleted = $pdo->prepare("SELECT total, paymentMethod FROM orders WHERE confirmedShiftId = ? AND status = 'completed'");
        $stmtCompleted->execute([$shiftId]);
        foreach ($stmtCompleted->fetchAll() as $o) {
            if (strpos($o['paymentMethod'], 'نقدي') !== false || strpos($o['paymentMethod'], 'عند الاستلام') !== false) {
                $completedCash += (float)$o['total'];
            }
        }

        $cancelledCash = 0.0;
        $stmtCancelled = $pdo->prepare("SELECT total, paymentMethod FROM orders WHERE returnShiftId = ? AND status = 'cancelled'");
        $stmtCancelled->execute([$shiftId]);
        foreach ($stmtCancelled->fetchAll() as $o) {
            if (strpos($o['paymentMethod'], 'نقدي') !== false || strpos($o['paymentMethod'], 'عند الاستلام') !== false) {
                $cancelledCash += (float)$o['total'];
            }
        }

        $deposits = 0.0;
        $withdrawals = 0.0;
        $stmtTxs = $pdo->prepare("SELECT type, amount FROM drawer_transactions WHERE shiftId = ?");
        $stmtTxs->execute([$shiftId]);
        foreach ($stmtTxs->fetchAll() as $t) {
            if ($t['type'] === 'deposit') {
                $deposits += (float)$t['amount'];
            } elseif ($t['type'] === 'withdrawal') {
                $withdrawals += (float)$t['amount'];
            }
        }

        $correctCash = (float)$sData['startingCash'] + $completedCash - $cancelledCash + $deposits - $withdrawals;
        if (abs((float)$sData['currentCashBalance'] - $correctCash) > 0.01) {
            $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$correctCash, $shiftId]);
            $sData['currentCashBalance'] = $correctCash;
        }

        // جلب حركات الخزينة
        $txs = $pdo->prepare("SELECT t.*, u.name as userName FROM drawer_transactions t LEFT JOIN users u ON t.userId = u.id WHERE t.shiftId = ? ORDER BY t.createdAt DESC");
        $txs->execute([$shiftId]);
        $txsList = $txs->fetchAll();
        foreach ($txsList as &$tx) {
            $tx['amount'] = (float)$tx['amount'];
        }

        // جلب فواتير الوردية
        $orders = $pdo->prepare("SELECT * FROM orders WHERE confirmedShiftId = ? OR returnShiftId = ? ORDER BY createdAt DESC");
        $orders->execute([$shiftId, $shiftId]);
        $ordersList = $orders->fetchAll();
        foreach ($ordersList as &$o) {
            $o['items'] = json_decode($o['items'], true) ?: [];
            $o['total'] = (float)$o['total'];
            $o['subtotal'] = (float)$o['subtotal'];
        }

        // جلب سجل التدقيق
        $logs = $pdo->prepare("SELECT l.*, u.name as userName FROM audit_logs l LEFT JOIN users u ON l.userId = u.id WHERE l.shiftId = ? ORDER BY l.createdAt DESC");
        $logs->execute([$shiftId]);
        $logsList = $logs->fetchAll();

        sendRes([
            'shift' => $sData,
            'transactions' => $txsList,
            'orders' => $ordersList,
            'auditLogs' => $logsList
        ]);
        break;

    default:
        sendErr('الإجراء المطلوب غير مدعوم في هذا الموديول.');
        break;
}
?>
