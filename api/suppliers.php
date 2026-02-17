<?php
require_once 'init.php';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if (!isAdmin()) sendErr('غير مصرح', 403);

switch ($action) {
    case 'get_suppliers':
        $sups = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC")->fetchAll();
        foreach ($sups as &$s) { $s['balance'] = (float)$s['balance']; $s['rating'] = (int)$s['rating']; }
        sendRes($sups);
        break;

    case 'add_supplier':
        $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, phone, companyName, address, notes, type, balance, rating, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$input['id'], $input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], $input['balance'], $input['rating'], $input['status'], time() * 1000]);
        sendRes(['status' => 'success']);
        break;

    case 'update_supplier':
        $stmt = $pdo->prepare("UPDATE suppliers SET name = ?, phone = ?, companyName = ?, address = ?, notes = ?, type = ?, balance = ?, rating = ?, status = ? WHERE id = ?");
        $stmt->execute([$input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'], $input['type'], $input['balance'], $input['rating'], $input['status'], $input['id']]);
        sendRes(['status' => 'success']);
        break;

    case 'delete_supplier':
        $pdo->prepare("DELETE FROM suppliers WHERE id = ?")->execute([$_GET['id']]);
        sendRes(['status' => 'success']);
        break;
}
?>