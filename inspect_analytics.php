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
    
    $eventTypes = $pdo->query("SELECT eventType, COUNT(*) as count FROM analytics_events GROUP BY eventType")->fetchAll();
    
    $lastEvents = $pdo->query("SELECT id, eventUuid, visitorId, eventType, eventData, createdAt FROM analytics_events ORDER BY id DESC LIMIT 20")->fetchAll();
    
    $topQueriesTest = $pdo->query("SELECT 
        eventData,
        JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.query')) as queryText,
        JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.resultsCount')) as resultsCountVal
        FROM analytics_events 
        WHERE eventType = 'search'
        LIMIT 10")->fetchAll();

    echo json_encode([
        'status' => 'success',
        'total_events' => (int)$total,
        'event_types' => $eventTypes,
        'last_20_events' => $lastEvents,
        'test_json_extract' => $topQueriesTest
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
