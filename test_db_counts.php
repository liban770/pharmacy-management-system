<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname=pharmcy", "root", "", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "=========================================\n";
    echo "   XAMPP MySQL 'pharmcy' (Port 3307)\n";
    echo "=========================================\n";
    
    // Users
    echo "\n--- USERS ---\n";
    $users = $pdo->query("SELECT id, role_id, name, email, status, created_at FROM users")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $u) {
        echo "[ID {$u['id']}] {$u['name']} ({$u['email']}) - Role ID: {$u['role_id']} - Status: {$u['status']}\n";
    }

    // Medicines
    echo "\n--- MEDICINES ---\n";
    $meds = $pdo->query("SELECT id, name, sku, purchase_price, selling_price, created_at FROM medicines")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($meds as $m) {
        echo "[ID {$m['id']}] {$m['name']} (SKU: {$m['sku']}) - Buy: \${$m['purchase_price']}, Sell: \${$m['selling_price']}\n";
    }

    // Batches
    echo "\n--- MEDICINE BATCHES ---\n";
    $batches = $pdo->query("SELECT id, medicine_id, supplier_id, batch_number, current_quantity, expiry_date FROM medicine_batches")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($batches as $b) {
        echo "[ID {$b['id']}] Batch: {$b['batch_number']} - Med ID: {$b['medicine_id']} - Qty: {$b['current_quantity']} - Exp: {$b['expiry_date']}\n";
    }

    // Customers
    echo "\n--- CUSTOMERS ---\n";
    $customers = $pdo->query("SELECT id, name, phone, allergies, outstanding_balance, total_spent FROM customers")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($customers as $c) {
        echo "[ID {$c['id']}] {$c['name']} ({$c['phone']}) - Allergies: {$c['allergies']} - Balance: \${$c['outstanding_balance']}\n";
    }

    // Suppliers
    echo "\n--- SUPPLIERS ---\n";
    $suppliers = $pdo->query("SELECT id, name, company, phone, email FROM suppliers")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($suppliers as $s) {
        echo "[ID {$s['id']}] {$s['name']} ({$s['company']}) - Phone: {$s['phone']}\n";
    }

    // Sales
    echo "\n--- SALES ---\n";
    $sales = $pdo->query("SELECT id, invoice_number, customer_name, grand_total, payment_method, payment_status, created_at FROM sales")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($sales as $sl) {
        echo "[ID {$sl['id']}] {$sl['invoice_number']} - Patient: {$sl['customer_name']} - Total: \${$sl['grand_total']} ({$sl['payment_method']}, {$sl['payment_status']})\n";
    }

    // Expenses
    echo "\n--- EXPENSES ---\n";
    $expenses = $pdo->query("SELECT id, category, amount, description, expense_date FROM expenses")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($expenses as $e) {
        echo "[ID {$e['id']}] {$e['category']}: \${$e['amount']} - {$e['description']} ({$e['expense_date']})\n";
    }

    echo "\n=========================================\n";
    echo "STATUS: ALL TABLES VERIFIED AND PERSISTING DIRECTLY IN MYSQL!\n";
    echo "=========================================\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
