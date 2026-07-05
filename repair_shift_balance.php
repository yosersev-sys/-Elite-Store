<?php
/**
 * Soq Al-Asr Database Repair Script
 * هذا الملف يقوم بإصلاح حقل returnShiftId للفواتير الملغاة وإعادة احتساب أرصدة الورديات
 */
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $pdo->beginTransaction();

    // 1. إصلاح الفواتير الملغاة التي لا تحتوي على معرف وردية الاسترجاع
    $stmt = $pdo->query("SELECT id, confirmedShiftId, shiftId FROM orders WHERE status = 'cancelled' AND returnShiftId IS NULL");
    $orders = $stmt->fetchAll();
    
    $updatedCount = 0;
    foreach ($orders as $o) {
        $shiftId = $o['confirmedShiftId'] ?: $o['shiftId'];
        if ($shiftId) {
            $update = $pdo->prepare("UPDATE orders SET returnShiftId = ? WHERE id = ?");
            $update->execute([$shiftId, $o['id']]);
            $updatedCount++;
        }
    }
    
    echo "<h3>تم تحديث حقل returnShiftId لـ $updatedCount فاتورة ملغاة بنجاح.</h3>";

    // 2. إعادة احتساب أرصدة درج النقدية لجميع الورديات لضمان مطابقتها للمبيعات
    $shiftsStmt = $pdo->query("SELECT id, startingCash, currentCashBalance FROM shifts");
    $shifts = $shiftsStmt->fetchAll();
    
    echo "<h3>تفاصيل إعادة جرد الخزينة للورديات:</h3>";
    echo "<ul>";
    foreach ($shifts as $s) {
        $shiftId = $s['id'];
        
        // المبيعات النقدية المكتملة
        $completedCash = 0.0;
        $stmtCompleted = $pdo->prepare("SELECT total, paymentMethod, outstandingAmount FROM orders WHERE confirmedShiftId = ?");
        $stmtCompleted->execute([$shiftId]);
        foreach ($stmtCompleted->fetchAll() as $o) {
            if (strpos($o['paymentMethod'], 'نقدي') !== false || strpos($o['paymentMethod'], 'عند الاستلام') !== false || strpos(strtolower($o['paymentMethod']), 'cash') !== false) {
                $completedCash += (float)$o['total'] - (float)($o['outstandingAmount'] ?? 0);
            }
        }

        // المرتجع النقدي الملغى
        $cancelledCash = 0.0;
        $stmtCancelled = $pdo->prepare("SELECT total, paymentMethod, outstandingAmount FROM orders WHERE returnShiftId = ? AND status = 'cancelled'");
        $stmtCancelled->execute([$shiftId]);
        foreach ($stmtCancelled->fetchAll() as $o) {
            if (strpos($o['paymentMethod'], 'نقدي') !== false || strpos($o['paymentMethod'], 'عند الاستلام') !== false || strpos(strtolower($o['paymentMethod']), 'cash') !== false) {
                $cancelledCash += (float)$o['total'] - (float)($o['outstandingAmount'] ?? 0);
            }
        }

        // الإيداعات والسحوبات اليدوية
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

        $correctCash = (float)$s['startingCash'] + $completedCash - $cancelledCash + $deposits - $withdrawals;
        
        if (abs((float)$s['currentCashBalance'] - $correctCash) > 0.01) {
            $pdo->prepare("UPDATE shifts SET currentCashBalance = ? WHERE id = ?")->execute([$correctCash, $shiftId]);
            echo "<li>الوردية #$shiftId: تم تحديث الرصيد من <b>{$s['currentCashBalance']} ج.م</b> إلى <b>$correctCash.00 ج.م</b></li>";
        } else {
            echo "<li>الوردية #$shiftId: الرصيد مطابق وصحيح ({$s['currentCashBalance']} ج.م)</li>";
        }
    }
    echo "</ul>";
    
    $pdo->commit();
    echo "<h2>اكتملت عملية الإصلاح بنجاح!</h2>";
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo "<h2>خطأ أثناء الإصلاح: " . $e->getMessage() . "</h2>";
}
