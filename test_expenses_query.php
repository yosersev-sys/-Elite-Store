<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $month = 7;
    $year = 2026;
    
    // Let's run the query exactly as it is in api_expenses.php
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

    $sql .= " ORDER BY e.date DESC LIMIT 500";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();

    echo json_encode([
        'status' => 'success',
        'sql' => $sql,
        'params' => $params,
        'results_count' => count($results),
        'results' => $results
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
