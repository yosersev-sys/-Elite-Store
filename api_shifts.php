<?php
/**
 * Shift & Cash Drawer Module - Soq Al-Asr POS
 */
if (!defined('DB_HOST')) exit;

// التحقق وإضافة أعمدة التأكيد والاعتماد والدرج والمصروفات ديناميكياً إذا لم تكن موجودة
try {
    $checkCols = $pdo->query("SHOW COLUMNS FROM orders LIKE 'confirmedShiftId'")->fetch();
    if (!$checkCols) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN confirmedShiftId INT NULL");
    }

    $chkTxCat = $pdo->query("SHOW COLUMNS FROM drawer_transactions LIKE 'category'")->fetch();
    if (!$chkTxCat) {
        $pdo->exec("ALTER TABLE drawer_transactions ADD COLUMN category VARCHAR(100) NULL DEFAULT NULL");
    }

    $chkTxBal = $pdo->query("SHOW COLUMNS FROM drawer_transactions LIKE 'balanceAfter'")->fetch();
    if (!$chkTxBal) {
        $pdo->exec("ALTER TABLE drawer_transactions ADD COLUMN balanceAfter DECIMAL(10,2) NULL DEFAULT NULL");
    }

    $chkExpCat = $pdo->query("SHOW COLUMNS FROM expenses LIKE 'category'")->fetch();
    if (!$chkExpCat) {
        $pdo->exec("ALTER TABLE expenses ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'عام'");
    }
} catch (Exception $e) {
    // تجاهل أي خطأ مؤقت لتفادي التوقف
}

function calculateShiftStats($pdo, $shiftId) {
    $shiftQuery = $pdo->prepare("SELECT * FROM shifts WHERE id = ?");
    $shiftQuery->execute([$shiftId]);
    $shift = $shiftQuery->fetch(PDO::FETCH_ASSOC);
    if (!$shift) return null;

    $startingCash = (float)$shift['startingCash'];

    // 1. حساب مبيعات الوردية والمؤشرات الإضافية
    $cashSales = 0.0;
    $cardSales = 0.0;
    $debtSales = 0.0;
    $completedTotalAmount = 0.0;
    $servedCustomers = [];
    $grossCashSales = 0.0; // لعدم الخصم المزدوج للمرتجعات في الدرج

    $stmtOrders = $pdo->prepare("SELECT total, paymentMethod, outstandingAmount, status, userId FROM orders WHERE confirmedShiftId = ?");
    $stmtOrders->execute([$shiftId]);
    $ordersList = $stmtOrders->fetchAll(PDO::FETCH_ASSOC);

    $orderCount = 0;
    $returnCount = 0;

    foreach ($ordersList as $o) {
        $total = (float)$o['total'];
        $outstanding = (float)($o['outstandingAmount'] ?? 0);
        $paymentMethod = $o['paymentMethod'] ?? 'نقدي';
        $isCash = (strpos($paymentMethod, 'نقدي') !== false || strpos($paymentMethod, 'عند الاستلام') !== false || strpos(strtolower($paymentMethod), 'cash') !== false);
        $isDebt = (strpos($paymentMethod, 'آجل') !== false);

        // حساب إجمالي النقدية الواردة للمبيعات التي بدأت في هذه الوردية (حتى الملغاة منها لاحقاً لمنع الخصم المزدوج)
        if ($isCash) {
            $grossCashSales += ($total - $outstanding);
        }

        if ($o['status'] === 'completed') {
            $orderCount++;
            $completedTotalAmount += $total;

            if (!empty($o['userId'])) {
                $servedCustomers[$o['userId']] = true;
            }

            if ($isCash) {
                $cashSales += ($total - $outstanding);
            } else if ($isDebt) {
                $debtSales += $total;
            } else {
                $cardSales += $total;
            }
        }
    }

    // 2. المرتجعات النقدية
    $cashReturns = 0.0;
    $stmtCancelled = $pdo->prepare("SELECT total, paymentMethod, outstandingAmount, status FROM orders WHERE returnShiftId = ?");
    $stmtCancelled->execute([$shiftId]);
    $cancelledOrdersList = $stmtCancelled->fetchAll(PDO::FETCH_ASSOC);

    foreach ($cancelledOrdersList as $o) {
        if ($o['status'] === 'cancelled') {
            $returnCount++;
            $total = (float)$o['total'];
            $outstanding = (float)($o['outstandingAmount'] ?? 0);
            $paymentMethod = $o['paymentMethod'] ?? 'نقدي';
            $isCash = (strpos($paymentMethod, 'نقدي') !== false || strpos($paymentMethod, 'عند الاستلام') !== false || strpos(strtolower($paymentMethod), 'cash') !== false);
            if ($isCash) {
                $cashReturns += ($total - $outstanding);
            }
        }
    }

    // 3. الإيداعات والسحوبات اليدوية (باستثناء حركات المصروفات المسجلة)
    $deposits = 0.0;
    $withdrawals = 0.0;
    $stmtTxs = $pdo->prepare("
        SELECT type, amount 
        FROM drawer_transactions 
        WHERE shiftId = ? 
          AND id NOT IN (
              SELECT drawerTransactionId 
              FROM expenses 
              WHERE shiftId = ? 
                AND status = 'active' 
                AND drawerTransactionId IS NOT NULL
          )
    ");
    $stmtTxs->execute([$shiftId, $shiftId]);
    foreach ($stmtTxs->fetchAll() as $t) {
        if ($t['type'] === 'deposit') {
            $deposits += (float)$t['amount'];
        } else if ($t['type'] === 'withdrawal') {
            $withdrawals += (float)$t['amount'];
        }
    }

    // 4. تحصيلات العملاء النقدية
    $ledgerCashPayments = abs((float)$pdo->query("SELECT IFNULL(SUM(amount), 0) FROM customer_ledger WHERE shiftId = {$shiftId} AND type = 'PAYMENT' AND (paymentMethod LIKE '%نقدي%' OR paymentMethod LIKE '%عند الاستلام%')")->fetchColumn());

    // 5. المصروفات (الكلية لعرضها بالتقرير)
    $stmtExpenses = $pdo->prepare("SELECT IFNULL(SUM(amount), 0) FROM expenses WHERE shiftId = ? AND status = 'active'");
    $stmtExpenses->execute([$shiftId]);
    $shiftExpenses = (float)$stmtExpenses->fetchColumn();

    // 5.5 مصروفات الدرج النقدية فقط (لخصمها من رصيد الدرج)
    $stmtDrawerExpenses = $pdo->prepare("SELECT IFNULL(SUM(amount), 0) FROM expenses WHERE shiftId = ? AND status = 'active' AND paymentSource = 'drawer'");
    $stmtDrawerExpenses->execute([$shiftId]);
    $drawerExpenses = (float)$stmtDrawerExpenses->fetchColumn();

    // 6. الرصيد المتوقع للدرج بالمعادلة الموحدة
    $expectedCashBalance = $startingCash + $grossCashSales + $ledgerCashPayments - $cashReturns - $drawerExpenses + $deposits - $withdrawals;

    // تحديث رصيد الدرج في قاعدة البيانات لضمان التطابق ومصدر الحقيقة
    if (abs((float)$shift['currentCashBalance'] - $expectedCashBalance) > 0.01) {
        $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$expectedCashBalance, $shiftId]);
        $shift['currentCashBalance'] = $expectedCashBalance;
    }

    $avgOrderValue = $orderCount > 0 ? ($completedTotalAmount / $orderCount) : 0.0;
    $servedCustomersCount = count($servedCustomers);

    return [
        'startingCash' => round($startingCash, 2),
        'cashSales' => round($cashSales, 2),
        'cardSales' => round($cardSales, 2),
        'debtSales' => round($debtSales, 2),
        'cashReturns' => round($cashReturns, 2),
        'totalDeposits' => round($deposits, 2),
        'totalWithdrawals' => round($withdrawals, 2),
        'ledgerCashPayments' => round($ledgerCashPayments, 2),
        'shiftExpenses' => round($shiftExpenses, 2),
        'drawerExpenses' => round($drawerExpenses, 2),
        'currentCashBalance' => round($expectedCashBalance, 2),
        'orderCount' => $orderCount,
        'avgOrderValue' => round($avgOrderValue, 2),
        'returnCount' => $returnCount,
        'servedCustomersCount' => $servedCustomersCount
    ];
}

// التحقق من تسجيل الدخول العام لكافة حركات الورديات
if (!isset($_SESSION['user'])) {
    sendErr('يجب تسجيل الدخول أولاً', 401);
}

switch ($action) {
    case 'get_active_shift':
        $shift = $pdo->query("SELECT s.*, u.name as openedByName FROM shifts s LEFT JOIN users u ON s.openedById = u.id WHERE s.status = 'open'")->fetch(PDO::FETCH_ASSOC);
        if ($shift) {
            $stats = calculateShiftStats($pdo, (int)$shift['id']);
            if ($stats) {
                $shift = array_merge($shift, $stats);
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
        // 1. ضمان وجود أعمدة الجدول تلقائياً
        try {
            $chkCat = $pdo->query("SHOW COLUMNS FROM drawer_transactions LIKE 'category'")->fetch();
            if (!$chkCat) {
                $pdo->exec("ALTER TABLE drawer_transactions ADD COLUMN category VARCHAR(50) NULL DEFAULT 'general'");
            }
            $chkBal = $pdo->query("SHOW COLUMNS FROM drawer_transactions LIKE 'balanceAfter'")->fetch();
            if (!$chkBal) {
                $pdo->exec("ALTER TABLE drawer_transactions ADD COLUMN balanceAfter DECIMAL(10,2) NULL DEFAULT NULL");
            }
        } catch (Exception $e) {}

        // 2. التحقق من وجود وردية مفتوحة
        $active = $pdo->query("SELECT * FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1")->fetch();
        if (!$active) {
            sendErr('لا توجد وردية مفتوحة حالياً لتسجيل الحركة إليها.');
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

        $currentBalance = (float)($active['currentCashBalance'] ?? $active['startingCash'] ?? 0);

        // منع السحب في حالة عجز النقدية بالدرج
        if ($type === 'withdrawal' && $amount > $currentBalance) {
            sendErr("لا يوجد رصيد كافٍ بالدرج. الرصيد الحالي: {$currentBalance} ج.م، القيمة المطلوبة لسحبها: {$amount} ج.م");
        }

        $userId = $_SESSION['user']['id'] ?? $_SESSION['user_id'] ?? $active['openedById'] ?? 1;
        $now = time() * 1000;

        $newBalance = ($type === 'deposit') ? ($currentBalance + $amount) : ($currentBalance - $amount);
        $categoryVal = ($type === 'withdrawal') ? 'purchase' : 'deposit';

        try {
            // إدراج الحركة
            $stmt = $pdo->prepare("INSERT INTO drawer_transactions (shiftId, type, amount, reason, createdAt, userId, category, balanceAfter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$active['id'], $type, $amount, $reason, $now, $userId, $categoryVal, $newBalance]);
        } catch (Exception $e) {
            // Fallback if category or balanceAfter columns are missing
            $stmt = $pdo->prepare("INSERT INTO drawer_transactions (shiftId, type, amount, reason, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$active['id'], $type, $amount, $reason, $now, $userId]);
        }

        // تحديث الرصيد التراكمي للدرج في الوردية
        try {
            $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $active['id']]);
        } catch (Exception $e) {}

        // تسجيل في سجل التدقيق
        try {
            $actionName = ($type === 'deposit') ? 'إيداع نقدي' : 'سحب نقدي';
            $details = "تم إجراء {$actionName} بقيمة {$amount} ج.م لسبب: {$reason}";
            $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'ADD_DRAWER_TX', ?, ?)");
            $stmtLog->execute([$userId, $active['id'], $details, $now]);
        } catch (Exception $e) {}

        sendRes(['status' => 'success', 'currentCashBalance' => $newBalance]);
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

        // 2. حساب حركات الدرج اليدوية (باستثناء حركات المصروفات المسجلة)
        $txQuery = $pdo->prepare("
            SELECT type, SUM(amount) as total_amount 
            FROM drawer_transactions 
            WHERE shiftId = ? 
              AND id NOT IN (
                  SELECT drawerTransactionId 
                  FROM expenses 
                  WHERE shiftId = ? 
                    AND status = 'active' 
                    AND drawerTransactionId IS NOT NULL
              )
            GROUP BY type
        ");
        $txQuery->execute([$shiftId, $shiftId]);
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
        $ledgerCashPayments = abs((float)$pdo->query("SELECT IFNULL(SUM(amount), 0) FROM customer_ledger WHERE shiftId = {$shiftId} AND type = 'PAYMENT' AND (paymentMethod LIKE '%نقدي%' OR paymentMethod LIKE '%عند الاستلام%')")->fetchColumn());

        // 2.7 حساب مصروفات الدرج النشطة للوردية
        $stmtDrawerExpenses = $pdo->prepare("SELECT IFNULL(SUM(amount), 0) FROM expenses WHERE shiftId = ? AND status = 'active' AND paymentSource = 'drawer'");
        $stmtDrawerExpenses->execute([$shiftId]);
        $drawerExpenses = (float)$stmtDrawerExpenses->fetchColumn();

        // 3. حساب الرصيد المتوقع بالمعادلة المحاسبية الشاملة (مطابق للرصيد الدفتري المسجل بالدرج)
        $expectedCash = (float)$active['startingCash'] + $cashSales - $cashReturns + $totalDeposits - $totalWithdrawals + $ledgerCashPayments - $drawerExpenses;

        // 4. احتساب الفرق
        $difference = round($actualCash - $expectedCash, 2);

        // 5. التحقق من إلزامية إدخال سبب الفارق (عجز أو زيادة)
        $discrepancyReason = trim($input['discrepancyReason'] ?? '');
        if (abs($difference) >= 0.01 && empty($discrepancyReason)) {
            sendErr('يوجد فارق جرد بالزيادة أو العجز. يرجى إدخال سبب الفارق قبل إغلاق الوردية.');
        }

        // 6. تجميد البيانات في الـ Snapshot لحماية البيانات التاريخية
        // جلب المنتجات المباعة في هذه الوردية لحساب الكميات قبل وبعد
        $stmtShiftOrders = $pdo->prepare("SELECT items FROM orders WHERE confirmedShiftId = ? AND status = 'completed'");
        $stmtShiftOrders->execute([$shiftId]);
        $shiftOrders = $stmtShiftOrders->fetchAll(PDO::FETCH_ASSOC);

        $stmtProds = $pdo->query("SELECT id, name, stockQuantity, unit FROM products");
        $productsMap = [];
        while ($p = $stmtProds->fetch(PDO::FETCH_ASSOC)) {
            $productsMap[$p['id']] = $p;
        }

        $soldMap = [];
        foreach ($shiftOrders as $order) {
            $items = json_decode($order['items'], true) ?: [];
            foreach ($items as $item) {
                $prodId = $item['id'] ?? null;
                if (!$prodId) continue;
                $qty = (float)($item['quantity'] ?? 0);
                $unit = $item['unit'] ?? 'piece';
                if (!isset($soldMap[$prodId])) {
                    $soldMap[$prodId] = [
                        'id' => $prodId,
                        'name' => $item['name'] ?? 'منتج غير معروف',
                        'qtySold' => 0,
                        'unit' => $unit
                    ];
                }
                $soldMap[$prodId]['qtySold'] += $qty;
            }
        }

        $productsSnapshot = [];
        foreach ($soldMap as $prodId => $soldItem) {
            $currentStock = isset($productsMap[$prodId]) ? (float)$productsMap[$prodId]['stockQuantity'] : 0.0;
            $qtyBefore = $currentStock + $soldItem['qtySold'];
            $qtyAfter = $currentStock;
            
            $productsSnapshot[] = [
                'id' => $prodId,
                'name' => $soldItem['name'],
                'qtySold' => $soldItem['qtySold'],
                'unit' => $soldItem['unit'],
                'qtyBefore' => $qtyBefore,
                'qtyAfter' => $qtyAfter
            ];
        }

        usort($productsSnapshot, function($a, $b) {
            if ($a['qtySold'] == $b['qtySold']) {
                return 0;
            }
            return ($a['qtySold'] < $b['qtySold']) ? 1 : -1;
        });

        $snapshot = [
            'cashSales' => $cashSales,
            'cashReturns' => $cashReturns,
            'cardSales' => $cardSales,
            'debtSales' => $debtSales,
            'totalDeposits' => $totalDeposits,
            'totalWithdrawals' => $totalWithdrawals,
            'ledgerCashPayments' => $ledgerCashPayments,
            'drawerExpenses' => $drawerExpenses,
            'ordersCount' => $ordersCount,
            'returnsCount' => $returnsCount,
            'products' => $productsSnapshot
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

    case 'get_drawer_transactions':
        $role = $_SESSION['user']['role'] ?? '';
        $userId = $_SESSION['user']['id'] ?? '';
        
        // سياسة الصلاحيات: إذا تم تفعيلها (true)، يرى الكاشير فقط عملياته الخاصة. إذا تم تعطيلها (false)، يرى الجميع كل شيء.
        $restrictCashierToOwnTransactions = true;
        
        if ($role === 'cashier' && $restrictCashierToOwnTransactions) {
            $stmt = $pdo->prepare("
                SELECT t.*, u.name as userName, s.shiftName, s.status as shiftStatus
                FROM drawer_transactions t
                LEFT JOIN users u ON t.userId = u.id
                LEFT JOIN shifts s ON t.shiftId = s.id
                WHERE t.category = 'purchase' AND t.userId = ?
                ORDER BY t.createdAt DESC
            ");
            $stmt->execute([$userId]);
        } else {
            $stmt = $pdo->prepare("
                SELECT t.*, u.name as userName, s.shiftName, s.status as shiftStatus
                FROM drawer_transactions t
                LEFT JOIN users u ON t.userId = u.id
                LEFT JOIN shifts s ON t.shiftId = s.id
                WHERE t.category = 'purchase'
                ORDER BY t.createdAt DESC
            ");
            $stmt->execute([]);
        }
        
        $txs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($txs as &$tx) {
            $tx['amount'] = round((float)$tx['amount'], 2);
            if (isset($tx['balanceAfter']) && $tx['balanceAfter'] !== null) {
                $tx['balanceAfter'] = round((float)$tx['balanceAfter'], 2);
            }
        }
        sendRes($txs);
        break;

    case 'get_shift_details':
        $shiftId = (int)($_GET['id'] ?? 0);
        if ($shiftId <= 0) {
            sendErr('معرف الوردية غير صحيح.');
        }

        $shift = $pdo->prepare("SELECT s.*, u1.name as openedByName, u2.name as closedByName FROM shifts s LEFT JOIN users u1 ON s.openedById = u1.id LEFT JOIN users u2 ON s.closedById = u2.id WHERE s.id = ?");
        $shift->execute([$shiftId]);
        $sData = $shift->fetch(PDO::FETCH_ASSOC);

        if (!$sData) {
            sendErr('الوردية المطلوبة غير موجودة.');
        }

        $stats = calculateShiftStats($pdo, $shiftId);
        if ($stats) {
            $sData = array_merge($sData, $stats);
        }

        // جلب حركات الخزينة
        $txs = $pdo->prepare("SELECT t.*, u.name as userName FROM drawer_transactions t LEFT JOIN users u ON t.userId = u.id WHERE t.shiftId = ? ORDER BY t.createdAt DESC");
        $txs->execute([$shiftId]);
        $txsList = $txs->fetchAll(PDO::FETCH_ASSOC);
        foreach ($txsList as &$tx) {
            $tx['amount'] = round((float)$tx['amount'], 2);
        }

        // جلب فواتير الوردية
        $orders = $pdo->prepare("SELECT * FROM orders WHERE confirmedShiftId = ? OR returnShiftId = ? ORDER BY createdAt DESC");
        $orders->execute([$shiftId, $shiftId]);
        $ordersList = $orders->fetchAll(PDO::FETCH_ASSOC);
        foreach ($ordersList as &$o) {
            $o['items'] = json_decode($o['items'], true) ?: [];
            $o['total'] = round((float)$o['total'], 2);
            $o['subtotal'] = round((float)$o['subtotal'], 2);
        }

        // جلب سجل التدقيق
        $logs = $pdo->prepare("SELECT l.*, u.name as userName FROM audit_logs l LEFT JOIN users u ON l.userId = u.id WHERE l.shiftId = ? ORDER BY l.createdAt DESC");
        $logs->execute([$shiftId]);
        $logsList = $logs->fetchAll(PDO::FETCH_ASSOC);

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
