<?php
/**
 * Database Inspection Script for Analytics
 */
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

if (isset($_GET['delete_all_test_data_warning']) && $_GET['delete_all_test_data_warning'] === 'yes') {
    $pdo->exec("DELETE FROM analytics_events");
    echo json_encode(['status' => 'success', 'message' => 'Cleared all analytics events']);
    exit;
}

try {
    $total = $pdo->query("SELECT COUNT(*) FROM analytics_events")->fetchColumn();
    
    $settings = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'analytics_%'")->fetchAll();
    
    $eventTypes = $pdo->query("SELECT eventType, COUNT(*) as count FROM analytics_events GROUP BY eventType")->fetchAll();
    
    $lastEvents = $pdo->query("SELECT id, eventUuid, visitorId, eventType, eventData, createdAt FROM analytics_events ORDER BY id DESC LIMIT 20")->fetchAll();
    
    $topQueriesTest = $pdo->query("SELECT 
        eventData,
        JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.query')) as queryText,
        JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.resultsCount')) as resultsCountVal
        FROM analytics_events 
        WHERE eventType = 'search'
        LIMIT 10")->fetchAll();

    $expenses = $pdo->query("SELECT id, title, amount, category, paymentSource, status, date FROM expenses LIMIT 10")->fetchAll();
    
    $expensesTimeTest = $pdo->query("SELECT 
        id,
        date,
        FROM_UNIXTIME(date/1000) as defaultTime,
        FROM_UNIXTIME(date/1000, '%c') as monthVal,
        FROM_UNIXTIME(date/1000, '%Y') as yearVal
        FROM expenses 
        LIMIT 10")->fetchAll();

    echo json_encode([
        'status' => 'success',
        'total_events' => (int)$total,
        'settings' => $settings,
        'event_types' => $eventTypes,
        'last_20_events' => $lastEvents,
        'test_json_extract' => $topQueriesTest,
        'raw_expenses' => $expenses,
        'expenses_time_test' => $expensesTimeTest
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
