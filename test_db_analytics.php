<?php
header('Content-Type: text/plain; charset=utf-8');
require_once 'D:/scratch/Elite-Store/api.php'; // wait, let's see if we can load config directly

try {
    // Let's connect using the same PDO connection parameters
    // We can extract them from db connection or include api.php/config.php if they define $pdo
    // Let's check config.php first
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
