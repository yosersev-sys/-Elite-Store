<?php
/**
 * Dynamic XML Sitemap Generator for Souq Al-Asr
 */
header("Content-Type: application/xml; charset=utf-8");

require_once 'config.php';

// Determine Base URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'] ?? 'soqelasr.com';
$baseUrl = $protocol . $domainName . '/';

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// 1. Home Page
echo '  <url>' . "\n";
echo '    <loc>' . $baseUrl . '</loc>' . "\n";
echo '    <changefreq>daily</changefreq>' . "\n";
echo '    <priority>1.0</priority>' . "\n";
echo '  </url>' . "\n";

// 2. Delivery Areas Page
echo '  <url>' . "\n";
echo '    <loc>' . $baseUrl . 'delivery-areas</loc>' . "\n";
echo '    <changefreq>weekly</changefreq>' . "\n";
echo '    <priority>0.9</priority>' . "\n";
echo '  </url>' . "\n";

// 3. Categories (dynamic)
try {
    $categories = $pdo->query("SELECT id FROM categories WHERE isActive = 1 OR isActive IS NULL")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($categories as $catId) {
        // Hash categories in client side
        echo '  <url>' . "\n";
        echo '    <loc>' . $baseUrl . '#category-' . urlencode($catId) . '</loc>' . "\n";
        echo '    <changefreq>weekly</changefreq>' . "\n";
        echo '    <priority>0.7</priority>' . "\n";
        echo '  </url>' . "\n";
    }
} catch (Exception $e) {}

// 4. Active Products (dynamic)
try {
    $products = $pdo->query("SELECT id, createdAt FROM products WHERE isArchived = 0 ORDER BY createdAt DESC")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($products as $prod) {
        $lastmod = '';
        if ($prod['createdAt']) {
            $lastmod = "\n" . '    <lastmod>' . date('Y-m-d', intval($prod['createdAt'] / 1000)) . '</lastmod>';
        }
        echo '  <url>' . "\n";
        echo '    <loc>' . $baseUrl . 'product/' . htmlspecialchars($prod['id']) . '</loc>' . $lastmod . "\n";
        echo '    <changefreq>weekly</changefreq>' . "\n";
        echo '    <priority>0.8</priority>' . "\n";
        echo '  </url>' . "\n";
    }
} catch (Exception $e) {}

echo '</urlset>' . "\n";
