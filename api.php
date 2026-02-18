<?php
/**
 * Soq Al-Asr API Router v8.0
 * هذا الملف هو الموزع الرئيسي - لا تضع فيه منطقاً برمجياً ثقيلاً.
 */
session_start();
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once 'config.php';

// دالة المساعدة الموحدة لإرسال الرد
function sendRes($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

// دالة المساعدة لإرسال الخطأ مع حماية من تداخل العمليات
function sendErr($msg, $code = 400, $debug = null) {
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo']->inTransaction()) $GLOBALS['pdo']->rollBack();
    http_response_code($code);
    sendRes(['status' => 'error', 'message' => $msg, 'debug' => $debug]);
}

function isAdmin() {
    return ($_SESSION['user']['role'] ?? '') === 'admin';
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

/**
 * نظام التوزيع الموديولي:
 * يتم استدعاء الملف المطلوب فقط بناءً على نوع العملية (Action)
 */
try {
    switch ($action) {
        // --- موديول الحسابات والأعضاء ---
        case 'login':
        case 'register':
        case 'logout':
        case 'get_current_user':
        case 'get_users':
        case 'admin_add_user':
        case 'admin_update_user':
        case 'update_profile':
        case 'delete_user':
            require_once 'api_auth.php';
            break;

        // --- موديول المخزن والمنتجات ---
        case 'get_products':
        case 'add_product':
        case 'update_product':
        case 'delete_product':
        case 'get_categories':
        case 'add_category':
        case 'update_category':
        case 'delete_category':
        case 'get_all_images':
            require_once 'api_inventory.php';
            break;

        // --- موديول المبيعات والفواتير ---
        case 'get_orders':
        case 'save_order':
        case 'update_order':
        case 'update_order_payment':
        case 'return_order':
            require_once 'api_sales.php';
            break;

        // --- موديول الموردين ---
        case 'get_suppliers':
        case 'add_supplier':
        case 'update_supplier':
        case 'delete_supplier':
            require_once 'api_crm.php';
            break;

        // --- موديول الإحصائيات والنظام ---
        case 'get_admin_summary':
        case 'get_store_settings':
        case 'update_store_settings':
        case 'generate_sitemap':
            require_once 'api_system.php';
            break;

        default:
            sendRes(['status' => 'ok', 'message' => 'Action handled by default router']);
            break;
    }
} catch (Exception $e) {
    sendErr('خطأ في استدعاء الموديول المختص', 500, $e->getMessage());
}
