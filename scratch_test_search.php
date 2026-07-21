<?php
require_once 'config.php';

$stmt = $pdo->query("SELECT id, name, barcode, isDeleted FROM products");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

print_r($products);
