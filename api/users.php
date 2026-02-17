<?php
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
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
        $id = 'u_' . time();
        $pass = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?, ?, ?, ?, 'user', ?)");
        try {
            $stmt->execute([$id, $input['name'], $input['phone'], $pass, time() * 1000]);
            $userData = ['id' => $id, 'name' => $input['name'], 'phone' => $input['phone'], 'role' => 'user'];
            $_SESSION['user'] = $userData;
            sendRes(['status' => 'success', 'user' => $userData]);
        } catch (Exception $e) { sendErr('رقم الهاتف مسجل مسبقاً'); }
        break;

    case 'get_current_user': sendRes($_SESSION['user'] ?? null); break;
    case 'logout': session_destroy(); sendRes(['status' => 'success']); break;

    case 'update_profile':
        if (!isset($_SESSION['user'])) sendErr('غير مسجل', 401);
        $uid = $_SESSION['user']['id'];
        if (!empty($input['password'])) {
            $pass = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $pass, $uid]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $uid]);
        }
        session_destroy();
        sendRes(['status' => 'success']);
        break;

    case 'admin_update_user':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        if (!empty($input['password'])) {
            $pass = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $pass, $input['id']]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['phone'], $input['id']]);
        }
        sendRes(['status' => 'success']);
        break;

    case 'delete_user':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $id = $_GET['id'] ?? '';
        if ($id === 'admin_root' || $id === $_SESSION['user']['id']) sendErr('لا يمكن حذف هذا الحساب');
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
        sendRes(['status' => 'success']);
        break;

    case 'get_users':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        sendRes($pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC")->fetchAll());
        break;
}
?>