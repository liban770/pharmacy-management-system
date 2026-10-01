<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    
    $tablesToClear = [
        'audit_logs',
        'customer_returns',
        'customers',
        'expenses',
        'medicine_batches',
        'medicines',
        'notifications',
        'prescription_items',
        'prescriptions',
        'purchase_items',
        'purchases',
        'sale_items',
        'sales',
        'stock_movements',
        'supplier_returns',
        'suppliers',
        'users'
    ];
    
    foreach ($tablesToClear as $tbl) {
        $pdo->exec("TRUNCATE TABLE `$tbl`");
        echo "Truncated $tbl\n";
    }
    
    $hash = password_hash('admin 123', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (id, role_id, name, email, password_hash, phone, status, created_at, updated_at) VALUES (1, 1, :name, :email, :hash, :phone, :status, NOW(), NOW())");
    $stmt->execute([
        ':name' => 'System Administrator',
        ':email' => 'admin@pharmos.health',
        ':hash' => $hash,
        ':phone' => '+1 (555) 010-0001',
        ':status' => 'active'
    ]);
    
    // Add initial system audit log
    $stmtAudit = $pdo->prepare("INSERT INTO audit_logs (user_id, user_name, user_role, action, entity, entity_id, description, ip_address, created_at) VALUES (1, 'System Administrator', 'admin', 'SYSTEM_INITIALIZATION', 'System', '1', 'Clean database initialized. Admin user created.', '127.0.0.1', NOW())");
    $stmtAudit->execute();

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    echo "SUCCESS: Database 'pharmcy' cleared of all fake data. Admin user created.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
