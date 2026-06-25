<?php
/**
 * Auth & Members Module - Fixed Update Support
 */
if (!defined('DB_HOST')) exit;

switch ($action) {
    case 'get_current_user':
        sendRes($_SESSION['user'] ?? ['id' => null]);
        break;

    case 'login':
        $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ?");
        $stmt->execute([$input['phone']]);
        $user = $stmt->fetch();
        if ($user && password_verify($input['password'], $user['password'])) {
            $userData = ['id' => $user['id'], 'name' => $user['name'], 'phone' => $user['phone'], 'role' => $user['role']];
            $_SESSION['user'] = $userData;
            sendRes(['status' => 'success', 'user' => $userData]);
        } else sendErr('بيانات الدخول غير صحيحة');
        break;

    case 'register':
        $id = 'u_'.time();
        $pass = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?,?,?,?,?,?)");
        if ($stmt->execute([$id, $input['name'], $input['phone'], $pass, 'user', time()*1000])) {
            $userData = ['id' => $id, 'name' => $input['name'], 'phone' => $input['phone'], 'role' => 'user'];
            $_SESSION['user'] = $userData;
            sendRes(['status' => 'success', 'user' => $userData]);
        } else sendErr('رقم الهاتف مسجل مسبقاً');
        break;

    case 'get_users':
        if (!isAdmin()) sendErr('غير مصرح');
        sendRes($pdo->query("SELECT id, name, phone, role, createdAt, (SELECT IFNULL(SUM(amount), 0) FROM customer_ledger WHERE userId = users.id) AS balance FROM users ORDER BY createdAt DESC")->fetchAll());
        break;

    case 'admin_add_user':
        if (!isAdmin()) sendErr('غير مصرح');
        $id = 'u_'.time();
        $pass = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?,?,?,?,?,?)");
        if ($stmt->execute([$id, $input['name'], $input['phone'], $pass, $input['role'], time()*1000])) sendRes(['status' => 'success']);
        else sendErr('الرقم مسجل بالفعل');
        break;

    case 'admin_update_user':
        if (!isAdmin()) sendErr('غير مصرح');
        $id = $input['id'] ?? '';
        if ($id === 'admin_root' && $_SESSION['user']['id'] !== 'admin_root') sendErr('لا يمكن تعديل الحساب الرئيسي إلا من قبل صاحبه');
        
        $oldUserStmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $oldUserStmt->execute([$id]);
        $oldUser = $oldUserStmt->fetch();

        if (!empty($input['password'])) {
            $pass = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET name=?, phone=?, password=?, role=? WHERE id=?");
            $res = $stmt->execute([$input['name'], $input['phone'], $pass, $input['role'], $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name=?, phone=?, role=? WHERE id=?");
            $res = $stmt->execute([$input['name'], $input['phone'], $input['role'], $id]);
        }
        
        if ($res) {
            if ($oldUser && $oldUser['name'] !== $input['name'] && strlen(trim($input['name'])) >= 3) {
                $activeShift = $pdo->query("SELECT id FROM shifts WHERE status = 'open'")->fetch();
                $shiftId = $activeShift ? $activeShift['id'] : null;
                $stmtLog = $pdo->prepare("INSERT INTO audit_logs (userId, shiftId, action, details, createdAt) VALUES (?, ?, 'UPDATE_USER_NAME', ?, ?)");
                $stmtLog->execute([
                    $_SESSION['user']['id'] ?? 'admin',
                    $shiftId,
                    "تم تعديل اسم العميل من '" . $oldUser['name'] . "' إلى '" . $input['name'] . "' للهاتف '" . $input['phone'] . "'",
                    time() * 1000
                ]);
            }
            sendRes(['status' => 'success']);
        } else sendErr('فشل تحديث بيانات العضو');
        break;

    case 'update_profile':
        if (!isset($_SESSION['user'])) sendErr('يجب تسجيل الدخول أولاً');
        $id = $_SESSION['user']['id'];
        
        if (!empty($input['password'])) {
            $pass = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET name=?, phone=?, password=? WHERE id=?");
            $res = $stmt->execute([$input['name'], $input['phone'], $pass, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name=?, phone=? WHERE id=?");
            $res = $stmt->execute([$input['name'], $input['phone'], $id]);
        }
        
        if ($res) {
            session_destroy(); // تسجيل الخروج لإعادة الدخول بالبيانات الجديدة
            sendRes(['status' => 'success']);
        } else sendErr('فشل تحديث البروفايل');
        break;

    case 'delete_user':
        if (!isAdmin()) sendErr('غير مصرح');
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND id != 'admin_root'");
        $stmt->execute([$_GET['id']]);
        sendRes(['status' => 'success']);
        break;

    case 'logout':
        session_destroy();
        sendRes(['status' => 'success']);
        break;
}
