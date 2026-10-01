<?php
/**
 * PharmOS Enterprise - Application Environment Configuration
 */

declare(strict_types=1);

return [
    'app_name' => 'PharmOS Enterprise',
    'version' => '2.4.0-PROD',
    'env' => getenv('APP_ENV') ?: 'production',
    'url' => getenv('APP_URL') ?: 'http://localhost/pharmacy-management/public',
    'timezone' => 'UTC',
    'currency' => [
        'code' => 'USD',
        'symbol' => '$',
        'decimals' => 2
    ],
    'tax' => [
        'default_rate' => 0.05, // 5% Sales tax
        'tax_identification' => 'RX-TAX-99201-B'
    ],
    'inventory' => [
        'fefo_enforced' => true,
        'prevent_expired_sales' => true,
        'near_expiry_warning_days' => [30, 60, 90],
        'default_min_stock' => 15
    ],
    'session' => [
        'lifetime_minutes' => 120,
        'secure_cookies' => true,
        'httponly_cookies' => true,
        'samesite' => 'Lax'
    ]
];
