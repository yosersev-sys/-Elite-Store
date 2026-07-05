<?php
require_once 'config.php';
header('Content-Type: text/html; charset=utf-8');

try {
    $shiftId = 29;
    
    // Dump all orders of this shift
    $orders = $pdo->prepare("SELECT id, status, confirmedShiftId, returnShiftId, total, paymentMethod, outstandingAmount FROM orders WHERE confirmedShiftId = ? OR returnShiftId = ?");
    $orders->execute([$shiftId, $shiftId]);
    $list = $orders->fetchAll();
    
    echo "<h2>debug orders for shift 29:</h2>";
    echo "<table border='1' cellpadding='5' style='border-collapse:collapse;'>";
    echo "<tr><th>ID</th><th>Status</th><th>confirmedShiftId</th><th>returnShiftId</th><th>Total</th><th>PaymentMethod</th><th>outstandingAmount</th></tr>";
    
    $completedSum = 0;
    $cancelledSum = 0;
    
    foreach ($list as $o) {
        echo "<tr>";
        echo "<td>{$o['id']}</td>";
        echo "<td>{$o['status']}</td>";
        echo "<td>{$o['confirmedShiftId']}</td>";
        echo "<td>{$o['returnShiftId']}</td>";
        echo "<td>{$o['total']}</td>";
        echo "<td>{$o['paymentMethod']}</td>";
        echo "<td>{$o['outstandingAmount']}</td>";
        echo "</tr>";
        
        $isCash = (strpos($o['paymentMethod'], 'نقدي') !== false || strpos($o['paymentMethod'], 'عند الاستلام') !== false || strpos(strtolower($o['paymentMethod']), 'cash') !== false);
        if ($isCash) {
            $net = (float)$o['total'] - (float)($o['outstandingAmount'] ?? 0);
            if ($o['confirmedShiftId'] == $shiftId) {
                $completedSum += $net;
            }
            if ($o['returnShiftId'] == $shiftId && $o['status'] === 'cancelled') {
                $cancelledSum += $net;
            }
        }
    }
    echo "</table>";
    
    echo "<h3>Completed Cash Sum: $completedSum</h3>";
    echo "<h3>Cancelled Cash Sum: $cancelledSum</h3>";
    echo "<h3>Expected Balance: " . ($completedSum - $cancelledSum) . "</h3>";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
