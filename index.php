<?php
/**
 * Elite Store - PHP Wrapper for Hostinger
 * هذا الملف يعمل كواجهة استدعاء لصفحة المتجر الأساسية
 */

// التأكد من عدم وجود أخطاء صامتة تؤدي لصفحة بيضاء
error_reporting(E_ALL);
ini_set('display_errors', 0);

// استدعاء ملف الـ HTML الأساسي
if (file_exists('index.html')) {
    include_once 'index.html';
} else {
    echo "خطأ: لم يتم العثور على ملف index.html الأساسي للمتجر.";
}
?>