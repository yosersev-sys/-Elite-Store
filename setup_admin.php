
<?php
/**
 * ملف تهيئة حساب المدير - سوق العصر
 * قم بتشغيل هذا الملف مرة واحدة فقط ثم احذفه
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

try {
    // التأكد من وجود جدول المستخدمين
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        createdAt BIGINT
    )");

    $adminPhone = '01000000000';
    $adminPass = 'admin123';
    $adminName = 'مدير النظام';
    
    // التحقق إذا كان الحساب موجود مسبقاً
    $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
    $stmt->execute([$adminPhone]);
    
    if ($stmt->fetch()) {
        echo "<div style='font-family:sans-serif; text-align:center; padding:50px;'>
                <h2 style='color: #f59e0b;'>حساب المدير موجود بالفعل!</h2>
                <p>يمكنك تسجيل الدخول باستخدام رقم الجوال: <b>$adminPhone</b></p>
                <a href='index.php#/admincp' style='background:#10b981; color:white; padding:10px 20px; border-radius:5px; text-decoration:none;'>اذهب للوحة التحكم</a>
              </div>";
    } else {
        $id = 'u_admin_master';
        $hash = password_hash($adminPass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $adminName, $adminPhone, $hash, 'admin', time()*1000]);
        
        echo "<div style='font-family:sans-serif; text-align:center; padding:50px;'>
                <h2 style='color: #10b981;'>✅ تم إنشاء حساب المدير بنجاح!</h2>
                <div style='background:#f8fafc; border:1px solid #e2e8f0; padding:20px; display:inline-block; border-radius:15px; text-align:right;'>
                    <p><b>رقم الجوال:</b> <span style='color:#10b981;'>$adminPhone</span></p>
                    <p><b>كلمة المرور:</b> <span style='color:#10b981;'>$adminPass</span></p>
                </div>
                <br><br>
                <p style='color:red;'><b>تنبيه أمني:</b> يرجى حذف ملف <code>setup_admin.php</code> من السيرفر فوراً.</p>
                <a href='index.php#/admincp' style='background:#10b981; color:white; padding:10px 20px; border-radius:5px; text-decoration:none;'>اذهب لتسجيل الدخول</a>
              </div>";
    }
} catch (Exception $e) {
    echo "خطأ: " . $e->getMessage();
}
?>
