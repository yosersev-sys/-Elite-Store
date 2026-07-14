<?php
header('Content-Type: text/plain; charset=utf-8');
require_once 'config.php';

$barcode = $_GET['barcode'] ?? '6224007235058';
echo "تشخص الباركود: $barcode\n";
echo "====================================\n\n";

// 1. البحث في جدول المنتجات
$stmt = $pdo->prepare("SELECT id, name, barcode, isDeleted FROM products WHERE barcode = ?");
$stmt->execute([$barcode]);
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($products)) {
    echo "[+] تم العثور على الباركود في جدول المنتجات الأساسية (products):\n";
    foreach ($products as $p) {
        echo " - معرف المنتج (ID): " . $p['id'] . "\n";
        echo " - اسم المنتج: " . $p['name'] . "\n";
        echo " - حالة الحذف (isDeleted): " . ($p['isDeleted'] == 1 ? "نعم (في سلة المحذوفات)" : "لا (منتج نشط)") . "\n";
    }
} else {
    echo "[-] الباركود غير موجود في جدول المنتجات الأساسية (products).\n";
}

echo "\n";

// 2. البحث في جدول الوحدات
$stmt = $pdo->prepare("SELECT id, productId, unitName, barcode, isActive FROM product_units WHERE barcode = ?");
$stmt->execute([$barcode]);
$units = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($units)) {
    echo "[+] تم العثور على الباركود في جدول وحدات المنتجات (product_units):\n";
    foreach ($units as $u) {
        echo " - معرف السجل الفرعي: " . $u['id'] . "\n";
        echo " - معرف المنتج المرتبط (productId): " . $u['productId'] . "\n";
        echo " - اسم الوحدة: " . $u['unitName'] . "\n";
        echo " - حالة النشاط (isActive): " . ($u['isActive'] == 1 ? "نشط" : "غير نشط") . "\n";
        
        // جلب معلومات المنتج المرتبط
        $stmt2 = $pdo->prepare("SELECT name, isDeleted FROM products WHERE id = ?");
        $stmt2->execute([$u['productId']]);
        $pInfo = $stmt2->fetch();
        if ($pInfo) {
            echo "   -> المنتج المرتبط: " . $pInfo['name'] . "\n";
            echo "   -> حالة المنتج (isDeleted): " . ($pInfo['isDeleted'] == 1 ? "نعم (في سلة المحذوفات)" : "لا (منتج نشط)") . "\n";
        } else {
            echo "   -> [تنبيه] المنتج المرتبط غير موجود في جدول المنتجات! (سجل يتيم)\n";
        }
    }
} else {
    echo "[-] الباركود غير موجود في جدول وحدات المنتجات (product_units).\n";
}
