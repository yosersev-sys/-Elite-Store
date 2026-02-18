<?php
/**
 * CRM & Suppliers Module
 */
if (!defined('DB_HOST')) exit;

if (!isAdmin()) sendErr('غير مصرح');

switch ($action) {
    case 'get_suppliers':
        $sups = $pdo->query("SELECT * FROM suppliers ORDER BY createdAt DESC")->fetchAll();
        foreach ($sups as &$s) {
            $s['paymentHistory'] = json_decode($s['paymentHistory'] ?? '[]', true) ?: [];
            $s['balance'] = (float)$s['balance'];
        }
        sendRes($sups);
        break;

    case 'add_supplier':
        $stmt = $pdo->prepare("INSERT INTO suppliers (id, name, phone, companyName, address, notes, type, balance, rating, status, paymentHistory, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $input['id'], $input['name'], $input['phone'], $input['companyName'], $input['address'],
            $input['notes'], $input['type'], $input['balance'], $input['rating'], $input['status'], '[]', time()*1000
        ]);
        sendRes(['status' => 'success']);
        break;

    case 'update_supplier':
        $stmt = $pdo->prepare("UPDATE suppliers SET name=?, phone=?, companyName=?, address=?, notes=?, type=?, balance=?, rating=?, status=?, paymentHistory=? WHERE id=?");
        $stmt->execute([
            $input['name'], $input['phone'], $input['companyName'], $input['address'], $input['notes'],
            $input['type'], $input['balance'], $input['rating'], $input['status'], json_encode($input['paymentHistory']), $input['id']
        ]);
        sendRes(['status' => 'success']);
        break;
}
