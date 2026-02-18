<?php
/**
 * Auth & Members Module
 */
if (!defined('DB_HOST')) exit; // حماية من الوصول المباشر

switch ($action) {
    case 'get_current_user':
        sendRes($_SESSION['user'] ?? null);
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
        sendRes($pdo->query("SELECT id, name, phone, role, createdAt FROM users ORDER BY createdAt DESC")->fetchAll());
        break;

    case 'admin_add_user':
        if (!isAdmin()) sendErr('غير مصرح');
        $id = 'u_'.time();
        $pass = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (id, name, phone, password, role, createdAt) VALUES (?,?,?,?,?,?)");
        if ($stmt->execute([$id, $input['name'], $input['phone'], $pass, $input['role'], time()*1000])) sendRes(['status' => 'success']);
        else sendErr('الرقم مسجل بالفعل');
        break;

    case 'delete_user':
        if (!isAdmin()) sendErr('غير مصرح');
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND id != 'admin_root'");
        $stmt->execute([$_GET['id']]);
        sendRes(['status' => 'success']);
        break;
}
