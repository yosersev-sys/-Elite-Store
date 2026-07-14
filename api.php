<?php
/**
 * Soq Al-Asr API Router v8.0
 * هذا الملف هو الموزع الرئيسي - لا تضع فيه منطقاً برمجياً ثقيلاً.
 */
session_start();
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED);
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

function translateDbError($msg) {
    if (stripos($msg, 'Duplicate entry') !== false) {
        preg_match("/Duplicate entry '([^']+)'/i", $msg, $matches);
        $val = isset($matches[1]) ? $matches[1] : '';
        
        if (stripos($msg, 'barcode') !== false || (is_numeric($val) && strlen($val) > 5)) {
            return "هذا الباركود أو الرمز ($val) مسجل لمنتج آخر بالفعل. يرجى استخدام باركود فريد.";
        }
        if (stripos($msg, 'phone') !== false) {
            return "رقم الهاتف ($val) مسجل بالفعل لمستعمل آخر.";
        }
        return "القيمة المدخلة ($val) مكررة وموجودة بالفعل في النظام.";
    }
    
    if (stripos($msg, 'a foreign key constraint fails') !== false || stripos($msg, 'cannot delete or update a parent row') !== false) {
        return "لا يمكن إتمام العملية لوجود بيانات وسجلات مرتبطة بهذا العنصر في أقسام أخرى من النظام.";
    }
    
    if (stripos($msg, 'cannot be null') !== false || (stripos($msg, 'Column') !== false && stripos($msg, 'null') !== false)) {
        return "يرجى التأكد من ملء الحقول المطلوبة بالكامل وبشكل صحيح.";
    }
    
    return $msg;
}

// دالة المساعدة لإرسال الخطأ مع حماية من تداخل العمليات
function sendErr($msg, $code = 400, $debug = null) {
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo']->inTransaction()) $GLOBALS['pdo']->rollBack();
    http_response_code($code);
    
    // ترجمة رسائل الخطأ الخاصة بالداتابيز لتكون صديقة للمستخدم باللغة العربية
    $friendlyMsg = translateDbError($msg);
    
    sendRes(['status' => 'error', 'message' => $friendlyMsg, 'debug' => $debug]);
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
        case 'cashier_update_customer':
        case 'update_profile':
        case 'delete_user':
            require_once 'api_auth.php';
            break;

        // --- موديول المخزن والمنتجات ---
        case 'get_products':
        case 'add_product':
        case 'update_product':
        case 'delete_product':
        case 'restore_product':
        case 'delete_product_permanently':
        case 'get_categories':
        case 'add_category':
        case 'update_category':
        case 'delete_category':
        case 'get_all_images':
        case 'adjust_stock':
        case 'get_product_history':
        case 'bulk_update_prices':
        case 'bulk_update_reorder_level':
        case 'bulk_update_category':
        case 'bulk_update_supplier':
        case 'bulk_toggle_products':
            require_once 'api_inventory.php';
            break;

        // --- موديول المبيعات والفواتير ---
        case 'get_orders':
        case 'save_order':
        case 'update_order':
        case 'update_order_payment':
        case 'return_order':
        case 'collect_customer_payment':
        case 'get_customer_ledger':
        case 'get_payment_methods':
        case 'add_payment_method':
        case 'update_payment_method':
        case 'delete_payment_method':
        case 'get_payment_numbers_stats':
            require_once 'api_sales.php';
            break;

        // --- موديول الموردين ---
        case 'get_suppliers':
        case 'add_supplier':
        case 'update_supplier':
        case 'delete_supplier':
            require_once 'api_crm.php';
            break;

        // --- موديول الورديات والدرج النقدية ---
        case 'get_active_shift':
        case 'open_shift':
        case 'close_shift':
        case 'add_drawer_transaction':
        case 'get_shifts':
        case 'get_shift_details':
            require_once 'api_shifts.php';
            break;

        // --- موديول المصروفات والتكاليف ---
        case 'add_expense':
        case 'cancel_expense':
        case 'get_expenses':
            require_once 'api_expenses.php';
            break;

        // --- موديول الإحصائيات والنظام ---
        case 'get_admin_summary':
        case 'get_store_settings':
        case 'update_store_settings':
        case 'generate_sitemap':
            require_once 'api_system.php';
            break;

        // --- موديول التحليلات وتتبع الزوار ---
        case 'track_events':
        case 'get_analytics_summary':
        case 'get_search_analytics':
        case 'run_analytics_maintenance':
            require_once 'api_analytics.php';
            break;

        default:
            sendRes(['status' => 'ok', 'message' => 'Action handled by default router']);
            break;
    }
} catch (Throwable $e) {
    sendErr('خطأ في استدعاء الموديول المختص: ' . $e->getMessage(), 500, $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
}
