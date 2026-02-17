<?php
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'get_categories':
        sendRes($pdo->query("SELECT * FROM categories ORDER BY sortOrder ASC")->fetchAll());
        break;

    case 'add_category':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $stmt = $pdo->prepare("INSERT INTO categories (id, name, image, isActive, sortOrder) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$input['id'], $input['name'], $input['image'], $input['isActive'] ? 1 : 0, $input['sortOrder'] ?? 0]);
        sendRes(['status' => 'success']);
        break;

    case 'update_category':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $stmt = $pdo->prepare("UPDATE categories SET name = ?, image = ?, isActive = ?, sortOrder = ? WHERE id = ?");
        $stmt->execute([$input['name'], $input['image'], $input['isActive'] ? 1 : 0, $input['sortOrder'], $input['id']]);
        sendRes(['status' => 'success']);
        break;

    case 'delete_category':
        if (!isAdmin()) sendErr('غير مصرح', 403);
        $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$_GET['id']]);
        sendRes(['status' => 'success']);
        break;
}
?>