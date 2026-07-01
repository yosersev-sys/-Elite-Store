<?php
/**
 * Expenses Module - Soq Al-Asr POS
 */
if (!defined('DB_HOST')) exit;

// التحقق من صلاحيات المدير لإدارة المصروفات
if (!isset($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    sendErr('غير مصرح لك بالقيام بهذه العملية (صلاحيات المدير فقط)', 403);
}

switch ($action) {
    case 'add_expense':
        $title = trim($input['title'] ?? '');
        $amount = (float)($input['amount'] ?? 0);
        $category = trim($input['category'] ?? '');
        $paymentSource = trim($input['paymentSource'] ?? 'drawer'); // 'drawer' or 'external'
        $referenceNumber = trim($input['referenceNumber'] ?? '');
        $attachment = trim($input['attachment'] ?? '');
        $notes = trim($input['notes'] ?? '');

        if (empty($title)) {
            sendErr('يرجى كتابة عنوان المصروف.');
        }
        if ($amount <= 0) {
            sendErr('يجب إدخال قيمة مصروف صحيحة أكبر من الصفر.');
        }
        if (empty($category)) {
            sendErr('يرجى تحديد أو كتابة فئة المصروف.');
        }
        if ($paymentSource !== 'drawer' && $paymentSource !== 'external') {
            sendErr('مصدر الدفع غير صحيح.');
        }

        $userId = $_SESSION['user']['id'];
        $now = time() * 1000;
        $shiftId = null;
        $drawerTransactionId = null;

        // إذا كان الدفع نقداً من الدرج
        if ($paymentSource === 'drawer') {
            // التحقق من وجود وردية مفتوحة
            $activeShift = $pdo->query("SELECT * FROM shifts WHERE status = 'open'")->fetch();
            if (!$activeShift) {
                sendErr('يجب فتح وردية أولاً لتتمكن من الدفع نقداً من الدرج.');
            }

            $currentBalance = (float)$activeShift['currentCashBalance'];
            if ($amount > $currentBalance) {
                sendErr("عجز في نقدية الدرج! الرصيد المتاح: {$currentBalance} ج.م، القيمة المطلوبة: {$amount} ج.م");
            }

            $shiftId = $activeShift['id'];

            // 1. تسجيل حركة سحب بالدرج
            $stmtTx = $pdo->prepare("INSERT INTO drawer_transactions (shiftId, type, amount, reason, createdAt, userId) VALUES (?, 'withdrawal', ?, ?, ?, ?)");
            $stmtTx->execute([
                $shiftId,
                $amount,
                "مصروفات: {$title} (#{$category})",
                $now,
                $userId
            ]);
            $drawerTransactionId = $pdo->lastInsertId();

            // 2. تحديث رصيد الدرج بالوردية
            $newBalance = $currentBalance - $amount;
            $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $shiftId]);
        }

        // 3. إدراج سجل المصروف
        $stmtExp = $pdo->prepare("INSERT INTO expenses (title, amount, category, paymentSource, referenceNumber, attachment, status, shiftId, drawerTransactionId, userId, notes, date) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)");
        $stmtExp->execute([
            $title,
            $amount,
            $category,
            $paymentSource,
            !empty($referenceNumber) ? $referenceNumber : null,
            !empty($attachment) ? $attachment : null,
            $shiftId,
            $drawerTransactionId,
            $userId,
            !empty($notes) ? $notes : null,
            $now
        ]);
        $expenseId = $pdo->lastInsertId();

        // 4. تسجيل في سجل التدقيق
        $sourceText = ($paymentSource === 'drawer') ? 'نقدي من الدرج' : 'خارجي/بنكي';
        $details = "تم تسجيل مصروف بقيمة {$amount} ج.م ({$title}) - الفئة: {$category} - الدفع: {$sourceText}";
        if ($shiftId) {
            $details .= " (الوردية: #{$shiftId})";
        }
        $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'ADD_EXPENSE', ?, ?)");
        $stmtLog->execute([$userId, $shiftId, $details, $now]);

        sendRes(['status' => 'success', 'expenseId' => $expenseId]);
        break;

    case 'cancel_expense':
        $expenseId = (int)($input['id'] ?? ($_GET['id'] ?? 0));
        if ($expenseId <= 0) {
            sendErr('معرف المصروف غير صحيح.');
        }

        // جلب تفاصيل المصروف والتحقق منه
        $expense = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
        $expense->execute([$expenseId]);
        $expData = $expense->fetch();

        if (!$expData) {
            sendErr('المصروف المطلوب غير موجود.');
        }
        if ($expData['status'] === 'cancelled') {
            sendErr('المصروف ملغى بالفعل.');
        }

        $shiftId = $expData['shiftId'];
        $now = time() * 1000;
        $userId = $_SESSION['user']['id'];

        // إذا كان مرتبطاً بوردية، يجب التأكد من أنها ليست مغلقة
        if ($shiftId) {
            $shiftStatus = $pdo->prepare("SELECT status FROM shifts WHERE id = ?");
            $shiftStatus->execute([$shiftId]);
            $status = $shiftStatus->fetchColumn();
            
            if ($status === 'closed') {
                sendErr('لا يمكن إلغاء مصروف تالٍ لوردية تم إغلاقها مسبقاً حفاظاً على سلامة الحسابات.');
            }
        }

        // إذا كان الدفع نقدي من الوردية الجارية
        if ($expData['paymentSource'] === 'drawer' && $shiftId && $expData['drawerTransactionId']) {
            // 1. إعادة المبلغ المخصوم إلى رصيد الدرج التراكمي
            $activeShift = $pdo->prepare("SELECT currentCashBalance FROM shifts WHERE id = ?");
            $activeShift->execute([$shiftId]);
            $currentBalance = (float)$activeShift->fetchColumn();

            $newBalance = $currentBalance + (float)$expData['amount'];
            $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$newBalance, $shiftId]);

            // 2. حذف حركة السحب من الدرج
            $pdo->prepare("DELETE FROM drawer_transactions WHERE id = ?")->execute([$expData['drawerTransactionId']]);
        }

        // 3. تحديث حالة المصروف كـ ملغى (أرشفة سوفت دليت)
        $pdo->prepare("UPDATE expenses SET status = 'cancelled' WHERE id = ?")->execute([$expenseId]);

        // 4. تسجيل في سجل التدقيق
        $details = "تم إلغاء المصروف رقم #{$expenseId} بقيمة {$expData['amount']} ج.م: {$expData['title']}";
        $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'CANCEL_EXPENSE', ?, ?)");
        $stmtLog->execute([$userId, $shiftId, $details, $now]);

        sendRes(['status' => 'success']);
        break;

    case 'get_expenses':
        $month = (int)($_GET['month'] ?? 0);
        $year = (int)($_GET['year'] ?? 0);
        $category = trim($_GET['category'] ?? '');
        $paymentSource = trim($_GET['paymentSource'] ?? '');
        $status = trim($_GET['status'] ?? ''); // 'active', 'cancelled' or empty for all

        $sql = "SELECT e.*, u.name as userName, s.status as shiftStatus 
                FROM expenses e 
                LEFT JOIN users u ON e.userId = u.id 
                LEFT JOIN shifts s ON e.shiftId = s.id 
                WHERE 1=1";
        $params = [];

        if ($month > 0) {
            $sql .= " AND MONTH(FROM_UNIXTIME(e.date/1000)) = ?";
            $params[] = $month;
        }
        if ($year > 0) {
            $sql .= " AND YEAR(FROM_UNIXTIME(e.date/1000)) = ?";
            $params[] = $year;
        }
        if (!empty($category)) {
            $sql .= " AND e.category = ?";
            $params[] = $category;
        }
        if (!empty($paymentSource)) {
            $sql .= " AND e.paymentSource = ?";
            $params[] = $paymentSource;
        }
        if (!empty($status)) {
            $sql .= " AND e.status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY e.date DESC LIMIT 500";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $expenses = $stmt->fetchAll();

        foreach ($expenses as &$e) {
            $e['amount'] = (float)$e['amount'];
            if ($e['shiftId']) $e['shiftId'] = (int)$e['shiftId'];
            if ($e['drawerTransactionId']) $e['drawerTransactionId'] = (int)$e['drawerTransactionId'];
        }

        sendRes($expenses);
        break;

    default:
        sendErr('الإجراء المطلوب غير مدعوم في هذا الموديول.');
        break;
}
?>
