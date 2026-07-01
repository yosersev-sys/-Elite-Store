<?php
/**
 * Self-Hosted Analytics & Visitor Tracking Module
 * Enhanced with Period Comparison, Product Revenue, Coupon, Social, Page Performance analytics
 */
if (!defined('DB_HOST')) exit;

// Helper to parse UserAgent
function getClientBrowserOSDevice($ua) {
    $browser = 'Unknown';
    $os = 'Unknown';
    $device = 'Desktop';

    if (empty($ua)) return [$browser, $os, $device];

    // Device Type
    if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i', $ua)) {
        $device = 'Tablet';
    } elseif (preg_match('/(mobi|ipod|phone|iphone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo)/i', $ua)) {
        $device = 'Mobile';
    }

    // OS Name
    if (preg_match('/windows/i', $ua)) {
        $os = 'Windows';
    } elseif (preg_match('/android/i', $ua)) {
        $os = 'Android';
    } elseif (preg_match('/iphone|ipad|ipod/i', $ua)) {
        $os = 'iOS';
    } elseif (preg_match('/macintosh|mac os x/i', $ua)) {
        $os = 'macOS';
    } elseif (preg_match('/linux/i', $ua)) {
        $os = 'Linux';
    }

    // Browser Name
    if (preg_match('/msie|trident/i', $ua)) {
        $browser = 'Unknown';
    } elseif (preg_match('/firefox/i', $ua)) {
        $browser = 'Firefox';
    } elseif (preg_match('/chrome|crios/i', $ua)) {
        if (preg_match('/edge|edg/i', $ua)) {
            $browser = 'Edge';
        } elseif (preg_match('/opr/i', $ua)) {
            $browser = 'Opera';
        } else {
            $browser = 'Chrome';
        }
    } elseif (preg_match('/safari/i', $ua)) {
        $browser = 'Safari';
    }

    return [$browser, $os, $device];
}

// Generate IP hash (Privacy-First)
function getSecureIpHash($ip) {
    $saltFile = __DIR__ . '/data/geoip/.salt';
    if (!file_exists(dirname($saltFile))) {
        @mkdir(dirname($saltFile), 0755, true);
    }
    
    $salt = '';
    if (file_exists($saltFile)) {
        $salt = file_get_contents($saltFile);
    }
    
    if (empty($salt)) {
        $salt = bin2hex(random_bytes(32));
        @file_put_contents($saltFile, $salt);
    }
    
    // Hash IP with salt + current month
    return hash_hmac('sha256', $ip, $salt . date('Y-m'));
}

// Determine Geolocation locally
function getGeoLocation($ip) {
    $country = 'Unknown';
    $city = 'Unknown';

    if ($ip !== '127.0.0.1' && $ip !== '::1' && !empty($ip)) {
        $pharPath = __DIR__ . '/data/geoip/geoip2.phar';
        $dbPath = __DIR__ . '/data/geoip/GeoLite2-City.mmdb';
        if (file_exists($pharPath) && file_exists($dbPath)) {
            try {
                require_once $pharPath;
                $reader = new \GeoIp2\Database\Reader($dbPath);
                $record = $reader->city($ip);
                $country = $record->country->names['ar'] ?? $record->country->name ?? 'Unknown';
                $city = $record->city->names['ar'] ?? $record->city->name ?? 'Unknown';
            } catch (\Exception $e) {
                // Ignore error and return defaults
            }
        }
    }
    return [$country, $city];
}

/**
 * Reusable helper: compute core KPIs for any time range.
 */
function getPeriodStats($pdo, $startTime, $endTime) {
    $totalPageViews = (int)$pdo->query("SELECT COUNT(*) FROM analytics_events WHERE eventType = 'page_view' AND createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();
    $uniqueVisitors = (int)$pdo->query("SELECT COUNT(DISTINCT visitorId) FROM analytics_events WHERE createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();
    $totalSessions = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();

    $bounces = (int)$pdo->query("SELECT COUNT(*) FROM (
        SELECT sessionId FROM analytics_events 
        WHERE createdAt >= $startTime AND createdAt <= $endTime
        GROUP BY sessionId 
        HAVING COUNT(CASE WHEN eventType = 'page_view' THEN 1 END) = 1
    ) AS bounce_sessions")->fetchColumn();
    $bounceRate = $totalSessions > 0 ? round(($bounces / $totalSessions) * 100, 2) : 0.00;

    $avgDuration = (float)$pdo->query("SELECT AVG(session_duration) FROM (
        SELECT sessionId, (MAX(createdAt) - MIN(createdAt)) / 1000 AS session_duration
        FROM analytics_events 
        WHERE createdAt >= $startTime AND createdAt <= $endTime
        GROUP BY sessionId
    ) AS session_durations")->fetchColumn();
    $avgSessionDuration = round($avgDuration, 1);

    $returningVisitors = (int)$pdo->query("SELECT COUNT(DISTINCT visitorId) FROM analytics_events 
        WHERE createdAt >= $startTime AND createdAt <= $endTime 
        AND visitorId IN (SELECT visitorId FROM analytics_events WHERE createdAt < $startTime)")->fetchColumn();

    $funnelComplete = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE eventType = 'checkout_complete' AND createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();
    $conversionRate = $uniqueVisitors > 0 ? round(($funnelComplete / $uniqueVisitors) * 100, 2) : 0.00;

    return [
        'pageViews' => $totalPageViews,
        'uniqueVisitors' => $uniqueVisitors,
        'sessions' => $totalSessions,
        'bounceRate' => $bounceRate,
        'avgSessionDuration' => $avgSessionDuration,
        'returningVisitors' => $returningVisitors,
        'conversionRate' => $conversionRate
    ];
}

switch ($action) {
    case 'track_events':
        $events = $input['events'] ?? [];
        if (empty($events)) {
            sendRes(['status' => 'success', 'message' => 'No events to track']);
        }

        // Get enabled status
        $enabled = (int)$pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'analytics_enabled'")->fetchColumn();
        if ($enabled === 0) {
            sendRes(['status' => 'success', 'message' => 'Analytics tracking is disabled']);
        }

        $trackCart = (int)$pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'analytics_track_cart'")->fetchColumn();
        $trackSearch = (int)$pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'analytics_track_search'")->fetchColumn();
        $trackSocial = (int)$pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'analytics_track_social'")->fetchColumn();

        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $ipHash = getSecureIpHash($ip);
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        list($browserName, $osName, $deviceType) = getClientBrowserOSDevice($userAgent);
        list($country, $city) = getGeoLocation($ip);

        // Prep DB inserts
        $stmt = $pdo->prepare("INSERT IGNORE INTO analytics_events (
            eventUuid, visitorId, sessionId, userId, eventType, page, productId, 
            referrer, userAgent, ipHash, country, city, deviceType, browserName, osName, 
            appVersion, utm_source, utm_medium, utm_campaign, utm_content, utm_term, 
            eventData, duration, createdAt
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?, ?, 
            ?, ?, ?
        )");

        $inserted = 0;
        foreach ($events as $event) {
            $eUuid = $event['eventUuid'] ?? '';
            $eType = $event['eventType'] ?? '';

            if (empty($eUuid) || empty($eType)) continue;

            // Filter specific events based on feature flags
            if ($eType === 'add_to_cart' || $eType === 'remove_from_cart' || $eType === 'checkout_start' || $eType === 'checkout_complete') {
                if ($trackCart === 0) continue;
            }
            if ($eType === 'search') {
                if ($trackSearch === 0) continue;
            }
            if ($eType === 'social_click' || $eType === 'share_product') {
                if ($trackSocial === 0) continue;
            }

            // Extract UTM params
            $utm_source = $event['utm_source'] ?? null;
            $utm_medium = $event['utm_medium'] ?? null;
            $utm_campaign = $event['utm_campaign'] ?? null;
            $utm_content = $event['utm_content'] ?? null;
            $utm_term = $event['utm_term'] ?? null;

            // Parse metadata
            $eventData = isset($event['eventData']) ? json_encode($event['eventData'], JSON_UNESCAPED_UNICODE) : null;
            $duration = isset($event['duration']) ? (int)$event['duration'] : 0;
            $createdAt = isset($event['createdAt']) ? (float)$event['createdAt'] : (time() * 1000);

            // Optional User Agent storage (shortened to save space)
            $shortUserAgent = !empty($userAgent) ? substr($userAgent, 0, 150) : null;

            // Prioritize client-provided GPS/network geocoded location if available
            $eventCountry = !empty($event['country']) ? $event['country'] : $country;
            $eventCity = !empty($event['city']) ? $event['city'] : $city;

            $stmt->execute([
                $eUuid,
                $event['visitorId'] ?? '',
                $event['sessionId'] ?? '',
                $event['userId'] ?? null,
                $eType,
                $event['page'] ?? 'store',
                $event['productId'] ?? null,
                $event['referrer'] ?? null,
                $shortUserAgent,
                $ipHash,
                $eventCountry,
                $eventCity,
                $deviceType,
                $browserName,
                $osName,
                $event['appVersion'] ?? null,
                $utm_source,
                $utm_medium,
                $utm_campaign,
                $utm_content,
                $utm_term,
                $eventData,
                $duration,
                $createdAt
            ]);
            $inserted += $stmt->rowCount();
        }

        sendRes(['status' => 'success', 'inserted' => $inserted]);
        break;

    case 'get_analytics_summary':
        if (!isAdmin()) sendErr('غير مصرح');

        $period = $_GET['period'] ?? 'week'; // today, week, month, custom
        $startTime = 0;
        $endTime = (time() * 1000) + 86400000; // default to end of today

        if ($period === 'today') {
            $startTime = strtotime('today') * 1000;
        } elseif ($period === 'week') {
            $startTime = strtotime('-7 days') * 1000;
        } elseif ($period === 'month') {
            $startTime = strtotime('-30 days') * 1000;
        } elseif ($period === 'custom') {
            $startTime = (float)($_GET['startDate'] ?? 0);
            $endTime = (float)($_GET['endDate'] ?? (time() * 1000));
        } else {
            $startTime = strtotime('-7 days') * 1000;
        }

        // ═══════════════════════════════════════════════
        // 1. Core KPIs — Current Period & Prior Period
        // ═══════════════════════════════════════════════
        $currentStats = getPeriodStats($pdo, $startTime, $endTime);

        // Prior period: same duration, immediately before current
        $periodDuration = $endTime - $startTime;
        $priorStart = $startTime - $periodDuration;
        $priorEnd = $startTime - 1;
        $priorStats = getPeriodStats($pdo, $priorStart, $priorEnd);

        // ═══════════════════════════════════════════════
        // 2. Average Page Load Speed (from page_performance events)
        // ═══════════════════════════════════════════════
        $avgLoadTimeMs = 0;
        try {
            $avgLoadTimeMs = (float)$pdo->query("SELECT AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.loadTime')) AS SIGNED)) 
                FROM analytics_events 
                WHERE eventType = 'page_performance' AND createdAt >= $startTime AND createdAt <= $endTime
                AND JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.loadTime')) IS NOT NULL")->fetchColumn();
        } catch (\Exception $e) {
            $avgLoadTimeMs = 0;
        }
        $avgLoadTimeSec = $avgLoadTimeMs > 0 ? round($avgLoadTimeMs / 1000, 2) : 0;

        // ═══════════════════════════════════════════════
        // 3. UTM Campaigns performance
        // ═══════════════════════════════════════════════
        $utmStats = $pdo->query("SELECT 
            utm_campaign, 
            utm_source,
            COUNT(DISTINCT visitorId) as visitors,
            COUNT(CASE WHEN eventType = 'checkout_complete' THEN 1 END) as conversions
            FROM analytics_events 
            WHERE utm_campaign IS NOT NULL AND createdAt >= $startTime AND createdAt <= $endTime
            GROUP BY utm_campaign, utm_source
            ORDER BY visitors DESC
            LIMIT 10")->fetchAll();

        // ═══════════════════════════════════════════════
        // 4. Top Visited Pages with Average Duration
        // ═══════════════════════════════════════════════
        $topPages = $pdo->query("SELECT 
            page, 
            COUNT(CASE WHEN eventType = 'page_view' THEN 1 END) as viewsCount,
            COUNT(DISTINCT CASE WHEN eventType = 'page_view' THEN visitorId END) as uniqueVisitors,
            AVG(CASE WHEN eventType = 'page_duration' THEN duration END) as avgDuration
            FROM analytics_events 
            WHERE createdAt >= $startTime AND createdAt <= $endTime
            GROUP BY page 
            HAVING viewsCount > 0
            ORDER BY viewsCount DESC 
            LIMIT 20")->fetchAll();

        // ═══════════════════════════════════════════════
        // 5. Product Performance: Views, Cart Adds, Revenue
        // ═══════════════════════════════════════════════
        $productEvents = $pdo->query("SELECT 
            ae.productId, 
            p.name as productName,
            COUNT(CASE WHEN ae.eventType = 'page_view' AND ae.page = 'product-details' THEN 1 END) as viewsCount,
            COUNT(CASE WHEN ae.eventType = 'add_to_cart' THEN 1 END) as cartAdds
            FROM analytics_events ae
            LEFT JOIN products p ON ae.productId = p.id
            WHERE ae.productId IS NOT NULL AND ae.createdAt >= $startTime AND ae.createdAt <= $endTime
            GROUP BY ae.productId, p.name
            ORDER BY viewsCount DESC
            LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);

        // Parse checkout_complete events to get per-product revenue
        $completeEventsRaw = $pdo->query("SELECT eventData FROM analytics_events 
            WHERE eventType = 'checkout_complete' AND createdAt >= $startTime AND createdAt <= $endTime
            AND eventData IS NOT NULL")->fetchAll(PDO::FETCH_COLUMN);

        $productSales = [];
        foreach ($completeEventsRaw as $eventJson) {
            if (empty($eventJson)) continue;
            $data = json_decode($eventJson, true);
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    $pid = $item['id'] ?? null;
                    if (!$pid) continue;
                    $price = floatval($item['price'] ?? 0);
                    $qty = intval($item['quantity'] ?? 0);
                    if (!isset($productSales[$pid])) {
                        $productSales[$pid] = ['orders' => 0, 'revenue' => 0.00];
                    }
                    $productSales[$pid]['orders'] += $qty;
                    $productSales[$pid]['revenue'] += ($price * $qty);
                }
            }
        }

        // Merge product events with sales data
        $productPerformance = [];
        $addedPids = [];
        foreach ($productEvents as $pe) {
            $pid = $pe['productId'];
            $addedPids[] = $pid;
            $sales = $productSales[$pid] ?? ['orders' => 0, 'revenue' => 0.00];
            $views = intval($pe['viewsCount']);
            $carts = intval($pe['cartAdds']);
            $productPerformance[] = [
                'productId' => $pid,
                'productName' => $pe['productName'] ?? $pid,
                'viewsCount' => $views,
                'cartAdds' => $carts,
                'cartRate' => $views > 0 ? round(($carts / $views) * 100, 1) : 0,
                'ordersCount' => $sales['orders'],
                'revenue' => round($sales['revenue'], 2)
            ];
        }
        // Add products that had sales but no views in this period
        foreach ($productSales as $pid => $sales) {
            if (in_array($pid, $addedPids)) continue;
            $pName = $pdo->query("SELECT name FROM products WHERE id = " . $pdo->quote($pid))->fetchColumn();
            $productPerformance[] = [
                'productId' => $pid,
                'productName' => $pName ?: $pid,
                'viewsCount' => 0,
                'cartAdds' => 0,
                'cartRate' => 0,
                'ordersCount' => $sales['orders'],
                'revenue' => round($sales['revenue'], 2)
            ];
        }
        // Sort by revenue descending
        usort($productPerformance, function($a, $b) { return $b['revenue'] <=> $a['revenue']; });

        // ═══════════════════════════════════════════════
        // 6. Distributions (Referrers, Devices, Browsers, OS, Cities)
        // ═══════════════════════════════════════════════
        $topReferrers = $pdo->query("SELECT referrer, COUNT(*) as count FROM analytics_events 
            WHERE referrer IS NOT NULL AND referrer != '' AND createdAt >= $startTime AND createdAt <= $endTime
            GROUP BY referrer ORDER BY count DESC LIMIT 10")->fetchAll();

        $devices = $pdo->query("SELECT deviceType, COUNT(DISTINCT sessionId) as count FROM analytics_events 
            WHERE deviceType IS NOT NULL AND createdAt >= $startTime AND createdAt <= $endTime
            GROUP BY deviceType ORDER BY count DESC")->fetchAll();

        $browsers = $pdo->query("SELECT browserName, COUNT(DISTINCT sessionId) as count FROM analytics_events 
            WHERE browserName IS NOT NULL AND createdAt >= $startTime AND createdAt <= $endTime
            GROUP BY browserName ORDER BY count DESC LIMIT 5")->fetchAll();

        $osList = $pdo->query("SELECT osName, COUNT(DISTINCT sessionId) as count FROM analytics_events 
            WHERE osName IS NOT NULL AND createdAt >= $startTime AND createdAt <= $endTime
            GROUP BY osName ORDER BY count DESC LIMIT 5")->fetchAll();

        $cities = $pdo->query("SELECT city, country, COUNT(DISTINCT visitorId) as visitors 
            FROM analytics_events 
            WHERE city IS NOT NULL AND city != 'Unknown' AND createdAt >= $startTime AND createdAt <= $endTime
            GROUP BY city, country ORDER BY visitors DESC LIMIT 10")->fetchAll();

        $salesByCity = $pdo->query("SELECT ae.city, SUM(o.total) as totalSales
            FROM analytics_events ae
            INNER JOIN orders o ON (ae.visitorId COLLATE utf8mb4_unicode_ci = o.userId COLLATE utf8mb4_unicode_ci) OR (ae.sessionId COLLATE utf8mb4_unicode_ci = o.id COLLATE utf8mb4_unicode_ci)
            WHERE ae.city IS NOT NULL AND ae.city != 'Unknown' AND ae.createdAt >= $startTime AND ae.createdAt <= $endTime AND ae.eventType = 'checkout_complete'
            GROUP BY ae.city ORDER BY totalSales DESC LIMIT 10")->fetchAll();

        // Detailed Traffic Sources Geo and Device distribution
        $referrerGeoDetails = $pdo->query("SELECT 
            IF(referrer IS NULL OR referrer = '', 'direct', referrer) as referrer, 
            country, 
            city, 
            deviceType,
            browserName,
            COUNT(*) as visitsCount,
            COUNT(DISTINCT visitorId) as uniqueVisitors
            FROM analytics_events 
            WHERE createdAt >= $startTime AND createdAt <= $endTime
            GROUP BY referrer, country, city, deviceType, browserName
            ORDER BY visitsCount DESC 
            LIMIT 50")->fetchAll();

        // ═══════════════════════════════════════════════
        // 7. Conversion Funnel calculation
        // ═══════════════════════════════════════════════
        $funnelStore = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE page = 'store' AND createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();
        $funnelProduct = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE page = 'product-details' AND createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();
        $funnelCart = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE eventType = 'add_to_cart' AND createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();
        $funnelCheckout = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE eventType = 'checkout_start' AND createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();
        $funnelComplete = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE eventType = 'checkout_complete' AND createdAt >= $startTime AND createdAt <= $endTime")->fetchColumn();

        // ═══════════════════════════════════════════════
        // 8. Enhanced Abandoned Carts with Recovery Rate
        // ═══════════════════════════════════════════════
        // Sessions with add_to_cart AND checkout_complete = recovered
        $recoveredCount = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events 
            WHERE eventType = 'add_to_cart' AND createdAt >= $startTime AND createdAt <= $endTime
            AND sessionId IN (SELECT sessionId FROM analytics_events WHERE eventType = 'checkout_complete' AND createdAt >= $startTime AND createdAt <= $endTime)")->fetchColumn();

        // Sessions with add_to_cart but NO checkout_complete = abandoned
        $abandonedSessionCount = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events 
            WHERE eventType = 'add_to_cart' AND createdAt >= $startTime AND createdAt <= $endTime
            AND sessionId NOT IN (SELECT sessionId FROM analytics_events WHERE eventType = 'checkout_complete' AND createdAt >= $startTime AND createdAt <= $endTime)")->fetchColumn();

        $recoveryRate = ($recoveredCount + $abandonedSessionCount) > 0 
            ? round(($recoveredCount / ($recoveredCount + $abandonedSessionCount)) * 100, 1) 
            : 0;

        // Fetch abandoned cart details
        $abandonedCarts = $pdo->query("SELECT 
            ae.sessionId, 
            ae.visitorId,
            MAX(ae.createdAt) as lastActive,
            ae.city
            FROM analytics_events ae
            WHERE ae.createdAt >= $startTime AND ae.createdAt <= $endTime
            GROUP BY ae.sessionId, ae.visitorId, ae.city
            HAVING COUNT(CASE WHEN ae.eventType = 'add_to_cart' THEN 1 END) > 0 
               AND COUNT(CASE WHEN ae.eventType = 'checkout_complete' THEN 1 END) = 0
            ORDER BY lastActive DESC
            LIMIT 15")->fetchAll();

        $formattedAbandoned = [];
        $totalAbandonedValue = 0;
        foreach ($abandonedCarts as $c) {
            $cartItems = $pdo->prepare("SELECT eventData FROM analytics_events 
                WHERE sessionId = ? AND eventType = 'add_to_cart' 
                ORDER BY createdAt DESC LIMIT 1");
            $cartItems->execute([$c['sessionId']]);
            $itemRaw = $cartItems->fetchColumn();
            
            // Calculate cart value
            $cartValue = 0;
            $parsedItems = null;
            if ($itemRaw) {
                $parsedItems = json_decode($itemRaw, true);
                if (isset($parsedItems['items']) && is_array($parsedItems['items'])) {
                    foreach ($parsedItems['items'] as $item) {
                        $cartValue += (floatval($item['price'] ?? 0) * intval($item['quantity'] ?? 0));
                    }
                } elseif (isset($parsedItems['cartTotal'])) {
                    $cartValue = floatval($parsedItems['cartTotal']);
                }
            }
            $totalAbandonedValue += $cartValue;

            // Try to find phone from previous orders by this visitor
            $phone = null;
            if (!empty($c['visitorId'])) {
                $phoneStmt = $pdo->prepare("SELECT phone FROM orders WHERE userId = ? ORDER BY createdAt DESC LIMIT 1");
                $phoneStmt->execute([$c['visitorId']]);
                $phone = $phoneStmt->fetchColumn() ?: null;
            }
            
            $formattedAbandoned[] = [
                'sessionId' => $c['sessionId'],
                'visitorId' => $c['visitorId'],
                'lastActive' => (float)$c['lastActive'],
                'city' => $c['city'],
                'items' => $parsedItems,
                'cartValue' => round($cartValue, 2),
                'phone' => $phone
            ];
        }

        $avgAbandonedValue = count($formattedAbandoned) > 0 
            ? round($totalAbandonedValue / count($formattedAbandoned), 2) 
            : 0;

        // ═══════════════════════════════════════════════
        // 9. Coupon Performance Analytics
        // ═══════════════════════════════════════════════
        $couponPerformance = [];
        try {
            $couponPerformance = $pdo->query("SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.code')) as couponCode,
                COUNT(CASE WHEN eventType = 'use_coupon' THEN 1 END) as successCount,
                COUNT(CASE WHEN eventType = 'coupon_failed' THEN 1 END) as failCount,
                SUM(CASE WHEN eventType = 'use_coupon' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.discountAmount')) AS DECIMAL(10,2)) ELSE 0 END) as totalDiscount
                FROM analytics_events 
                WHERE eventType IN ('use_coupon', 'coupon_failed') AND createdAt >= $startTime AND createdAt <= $endTime
                GROUP BY couponCode
                ORDER BY successCount DESC
                LIMIT 20")->fetchAll();
        } catch (\Exception $e) {
            $couponPerformance = [];
        }

        // ═══════════════════════════════════════════════
        // 10. Social Engagement Analytics
        // ═══════════════════════════════════════════════
        $socialEngagement = [];
        try {
            $socialEngagement = $pdo->query("SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.network')) as networkName,
                COUNT(CASE WHEN eventType = 'social_click' THEN 1 END) as clickCount,
                COUNT(CASE WHEN eventType = 'share_product' THEN 1 END) as shareCount
                FROM analytics_events 
                WHERE eventType IN ('social_click', 'share_product') AND createdAt >= $startTime AND createdAt <= $endTime
                GROUP BY networkName
                ORDER BY (clickCount + shareCount) DESC
                LIMIT 10")->fetchAll();
        } catch (\Exception $e) {
            $socialEngagement = [];
        }

        // ═══════════════════════════════════════════════
        // 11. Daily Digest (Yesterday vs Day Before Yesterday)
        // ═══════════════════════════════════════════════
        $yesterdayStart = strtotime('yesterday') * 1000;
        $yesterdayEnd = (strtotime('today') * 1000) - 1;
        $dayBeforeStart = strtotime('-2 days') * 1000;
        $dayBeforeEnd = $yesterdayStart - 1;

        $yesterdayStats = getPeriodStats($pdo, $yesterdayStart, $yesterdayEnd);
        $dayBeforeStats = getPeriodStats($pdo, $dayBeforeStart, $dayBeforeEnd);

        // Yesterday's completed orders count
        $yesterdayOrders = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE eventType = 'checkout_complete' AND createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd")->fetchColumn();
        $dayBeforeOrders = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE eventType = 'checkout_complete' AND createdAt >= $dayBeforeStart AND createdAt <= $dayBeforeEnd")->fetchColumn();

        // ═══════════════════════════════════════════════
        // Return everything packed
        // ═══════════════════════════════════════════════
        sendRes([
            'status' => 'success',
            'summary' => $currentStats,
            'priorSummary' => $priorStats,
            'avgLoadTimeSec' => $avgLoadTimeSec,
            'funnel' => [
                'store' => $funnelStore,
                'product' => $funnelProduct,
                'cart' => $funnelCart,
                'checkout' => $funnelCheckout,
                'complete' => $funnelComplete
            ],
            'topPages' => $topPages,
            'productPerformance' => $productPerformance,
            'referrers' => $topReferrers,
            'referrerGeoDetails' => $referrerGeoDetails,
            'devices' => $devices,
            'browsers' => $browsers,
            'os' => $osList,
            'cities' => $cities,
            'salesByCity' => $salesByCity,
            'utmCampaigns' => $utmStats,
            'abandonedCarts' => $formattedAbandoned,
            'abandonedStats' => [
                'abandonedCount' => $abandonedSessionCount,
                'recoveredCount' => $recoveredCount,
                'recoveryRate' => $recoveryRate,
                'totalAbandonedValue' => round($totalAbandonedValue, 2),
                'avgAbandonedValue' => $avgAbandonedValue
            ],
            'couponPerformance' => $couponPerformance,
            'socialEngagement' => $socialEngagement,
            'dailyDigest' => [
                'yesterday' => array_merge($yesterdayStats, ['orders' => $yesterdayOrders]),
                'dayBefore' => array_merge($dayBeforeStats, ['orders' => $dayBeforeOrders])
            ]
        ]);
        break;

    case 'get_search_analytics':
        if (!isAdmin()) sendErr('غير مصرح');

        $startTime = strtotime('-30 days') * 1000;
        
        $topQueries = $pdo->query("SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.query')) as queryText,
            COUNT(*) as count,
            AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.resultsCount')) AS SIGNED)) as avgResults,
            COUNT(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.clickedResult')) = 'true' THEN 1 END) as clickCount
            FROM analytics_events 
            WHERE eventType = 'search' AND createdAt >= $startTime
            GROUP BY queryText
            ORDER BY count DESC
            LIMIT 20")->fetchAll();

        $zeroResults = $pdo->query("SELECT 
            JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.query')) as queryText,
            COUNT(*) as count
            FROM analytics_events 
            WHERE eventType = 'search' 
              AND CAST(JSON_UNQUOTE(JSON_EXTRACT(eventData, '$.resultsCount')) AS SIGNED) = 0
              AND createdAt >= $startTime
            GROUP BY queryText
            ORDER BY count DESC
            LIMIT 20")->fetchAll();

        sendRes([
            'status' => 'success',
            'topQueries' => $topQueries,
            'zeroResults' => $zeroResults
        ]);
        break;

    case 'run_analytics_maintenance':
        if (!isAdmin()) sendErr('غير مصرح');

        try {
            $yesterday = date('Y-m-d', strtotime('yesterday'));
            $yesterdayStart = strtotime('yesterday') * 1000;
            $yesterdayEnd = (strtotime('today') * 1000) - 1;

            $check = $pdo->prepare("SELECT COUNT(*) FROM analytics_daily_summary WHERE summary_date = ?");
            $check->execute([$yesterday]);
            $alreadyBuilt = (int)$check->fetchColumn() > 0;

            if (!$alreadyBuilt) {
                $views = (int)$pdo->query("SELECT COUNT(*) FROM analytics_events WHERE eventType = 'page_view' AND createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd")->fetchColumn();
                $visitors = (int)$pdo->query("SELECT COUNT(DISTINCT visitorId) FROM analytics_events WHERE createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd")->fetchColumn();
                $sessions = (int)$pdo->query("SELECT COUNT(DISTINCT sessionId) FROM analytics_events WHERE createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd")->fetchColumn();
                
                $bounces = (int)$pdo->query("SELECT COUNT(*) FROM (
                    SELECT sessionId FROM analytics_events 
                    WHERE createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd
                    GROUP BY sessionId 
                    HAVING COUNT(CASE WHEN eventType = 'page_view' THEN 1 END) = 1
                ) AS b")->fetchColumn();

                $dur = (float)$pdo->query("SELECT SUM(session_duration) FROM (
                    SELECT sessionId, (MAX(createdAt) - MIN(createdAt)) / 1000 AS session_duration
                    FROM analytics_events 
                    WHERE createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd
                    GROUP BY sessionId
                ) AS sd")->fetchColumn();

                $returning = (int)$pdo->query("SELECT COUNT(DISTINCT visitorId) FROM analytics_events 
                    WHERE createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd 
                    AND visitorId IN (SELECT visitorId FROM analytics_events WHERE createdAt < $yesterdayStart)")->fetchColumn();

                $orders = (int)$pdo->query("SELECT COUNT(*) FROM analytics_events WHERE eventType = 'checkout_complete' AND createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd")->fetchColumn();

                $devices = $pdo->query("SELECT deviceType, COUNT(*) as c FROM analytics_events WHERE createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd GROUP BY deviceType")->fetchAll();
                $countries = $pdo->query("SELECT country, COUNT(*) as c FROM analytics_events WHERE createdAt >= $yesterdayStart AND createdAt <= $yesterdayEnd GROUP BY country")->fetchAll();
                
                $aggDetails = json_encode([
                    'devices' => $devices,
                    'countries' => $countries
                ], JSON_UNESCAPED_UNICODE);

                $ins = $pdo->prepare("INSERT INTO analytics_daily_summary (
                    summary_date, unique_visitors, returning_visitors, page_views, 
                    total_sessions, bounces, total_session_duration, conversion_rate, aggregated_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $ins->execute([
                    $yesterday,
                    $visitors,
                    $returning,
                    $views,
                    $sessions,
                    $bounces,
                    (int)$dur,
                    $visitors > 0 ? round(($orders / $visitors) * 100, 2) : 0.00,
                    $aggDetails
                ]);
            }

            $retentionLimit = (time() - (180 * 86400)) * 1000;
            $del = $pdo->prepare("DELETE FROM analytics_events WHERE createdAt < ?");
            $del->execute([$retentionLimit]);
            $deletedRows = $del->rowCount();

            if ($deletedRows > 0) {
                $pdo->exec("OPTIMIZE TABLE analytics_events");
            }

            sendRes(['status' => 'success', 'message' => 'Analytics maintenance completed', 'deleted_rows' => $deletedRows]);
        } catch (\Exception $e) {
            sendErr('فشلت عملية الصيانة', 500, $e->getMessage());
        }
        break;
}
