-- =====================================================================
-- PHARMOS ENTERPRISE - PHARMACY MANAGEMENT SYSTEM
-- PRODUCTION MYSQL 8.0+ NORMALIZED RELATIONAL DATABASE SCHEMA
-- =====================================================================
-- Architecture: 3rd Normal Form (3NF), InnoDB Storage Engine
-- Security: UTF8mb4 charset, Foreign Key Constraints, Cascades, Indexes
-- Financial: DECIMAL(12,2) for all financial currency amounts
-- Integrity: Transactions, FEFO Constraints, Audit Logs
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS customer_returns;
DROP TABLE IF EXISTS supplier_returns;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medicine_batches;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. ROLES & PERMISSIONS (RBAC)
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. MEDICINE CATALOG & CLASSIFICATION
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE medicines (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    brand_name VARCHAR(150) NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(60) NOT NULL UNIQUE,
    manufacturer VARCHAR(150) NOT NULL,
    dosage_form ENUM('Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Suspension') NOT NULL,
    strength VARCHAR(50) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    min_stock_level INT UNSIGNED NOT NULL DEFAULT 10,
    prescription_required BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NULL,
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_med_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
    INDEX idx_med_name (name),
    INDEX idx_med_generic (generic_name),
    INDEX idx_med_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. SUPPLIERS & MEDICINE BATCHES (FEFO CORE)
-- ---------------------------------------------------------------------
CREATE TABLE suppliers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    tax_number VARCHAR(50) NULL,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_purchases DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE medicine_batches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT UNSIGNED NOT NULL,
    supplier_id INT UNSIGNED NOT NULL,
    batch_number VARCHAR(80) NOT NULL,
    initial_quantity INT UNSIGNED NOT NULL,
    current_quantity INT UNSIGNED NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    mfg_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    received_date DATE NOT NULL,
    location_rack VARCHAR(80) DEFAULT 'Main Store',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE RESTRICT,
    CONSTRAINT fk_batch_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE RESTRICT,
    UNIQUE KEY uq_medicine_batch (medicine_id, batch_number),
    INDEX idx_batch_expiry (expiry_date),
    INDEX idx_batch_med_qty (medicine_id, current_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. CUSTOMERS / PATIENTS & PRESCRIPTIONS
-- ---------------------------------------------------------------------
CREATE TABLE customers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NULL,
    address TEXT NULL,
    date_of_birth DATE NULL,
    gender ENUM('Male', 'Female', 'Other') DEFAULT 'Other',
    medical_notes TEXT NULL,
    allergies TEXT NULL,
    outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cust_phone (phone),
    INDEX idx_cust_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prescriptions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_number VARCHAR(60) NOT NULL UNIQUE,
    customer_id INT UNSIGNED NOT NULL,
    doctor_name VARCHAR(120) NOT NULL,
    doctor_clinic VARCHAR(150) NULL,
    doctor_license VARCHAR(80) NULL,
    prescription_date DATE NOT NULL,
    status ENUM('Pending', 'Partially Dispensed', 'Dispensed', 'Cancelled') DEFAULT 'Pending',
    notes TEXT NULL,
    dispensed_by_user_id INT UNSIGNED NULL,
    dispensed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rx_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rx_dispensed_by FOREIGN KEY (dispensed_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_rx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prescription_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT UNSIGNED NOT NULL,
    medicine_id INT UNSIGNED NOT NULL,
    dosage VARCHAR(80) NOT NULL,
    frequency VARCHAR(80) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    prescribed_quantity INT UNSIGNED NOT NULL,
    dispensed_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    instructions TEXT NULL,
    CONSTRAINT fk_rxi_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE,
    CONSTRAINT fk_rxi_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. PURCHASES & GOODS RECEIVING
-- ---------------------------------------------------------------------
CREATE TABLE purchases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_number VARCHAR(60) NOT NULL UNIQUE,
    supplier_id INT UNSIGNED NOT NULL,
    received_by_user_id INT UNSIGNED NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE NULL,
    status ENUM('Pending', 'Received', 'Cancelled') DEFAULT 'Received',
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('Paid', 'Unpaid', 'Partial') DEFAULT 'Paid',
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_po_receiver FOREIGN KEY (received_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT UNSIGNED NOT NULL,
    medicine_id INT UNSIGNED NOT NULL,
    batch_id INT UNSIGNED NULL,
    batch_number VARCHAR(80) NOT NULL,
    mfg_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_poi_purchase FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE CASCADE,
    CONSTRAINT fk_poi_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. SALES & POS TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE sales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(60) NOT NULL UNIQUE,
    customer_id INT UNSIGNED NULL,
    customer_name VARCHAR(150) NOT NULL DEFAULT 'Walk-in Customer',
    prescription_id INT UNSIGNED NULL,
    cashier_user_id INT UNSIGNED NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(12,2) NOT NULL,
    payment_method ENUM('Cash', 'Card', 'Mobile Money', 'Credit') NOT NULL DEFAULT 'Cash',
    payment_status ENUM('Paid', 'Partial', 'Credit') NOT NULL DEFAULT 'Paid',
    amount_received DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    change_given DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sale_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
    CONSTRAINT fk_sale_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE SET NULL,
    CONSTRAINT fk_sale_cashier FOREIGN KEY (cashier_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_sale_created (created_at),
    INDEX idx_sale_invoice (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sale_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sale_id INT UNSIGNED NOT NULL,
    medicine_id INT UNSIGNED NOT NULL,
    batch_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_si_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
    CONSTRAINT fk_si_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE RESTRICT,
    CONSTRAINT fk_si_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. INVENTORY MOVEMENTS (IMMUTABLE STOCK LEDGER)
-- ---------------------------------------------------------------------
CREATE TABLE stock_movements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT UNSIGNED NOT NULL,
    batch_id INT UNSIGNED NULL,
    type ENUM('purchase', 'sale', 'return', 'adjustment', 'damage', 'expiration', 'transfer') NOT NULL,
    quantity INT NOT NULL, -- positive for additions, negative for deductions
    balance_before INT NOT NULL,
    balance_after INT NOT NULL,
    reference_type VARCHAR(60) NULL, -- 'INV-2026-0041', 'PO-2026-0104', 'ADJ-BATCH'
    reference_id VARCHAR(60) NULL,
    reason TEXT NOT NULL,
    performed_by_user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sm_medicine FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sm_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches (id) ON DELETE SET NULL,
    CONSTRAINT fk_sm_user FOREIGN KEY (performed_by_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_sm_medicine (medicine_id),
    INDEX idx_sm_type (type),
    INDEX idx_sm_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. RETURNS (CUSTOMER & SUPPLIER)
-- ---------------------------------------------------------------------
CREATE TABLE customer_returns (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    return_number VARCHAR(60) NOT NULL UNIQUE,
    sale_id INT UNSIGNED NOT NULL,
    medicine_id INT UNSIGNED NOT NULL,
    batch_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    disposition ENUM('Restock', 'Damage/Waste') NOT NULL,
    reason TEXT NOT NULL,
    processed_by_user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cr_sale FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE RESTRICT,
    CONSTRAINT fk_cr_med FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE RESTRICT,
    CONSTRAINT fk_cr_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches (id) ON DELETE RESTRICT,
    CONSTRAINT fk_cr_user FOREIGN KEY (processed_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supplier_returns (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    return_number VARCHAR(60) NOT NULL UNIQUE,
    supplier_id INT UNSIGNED NOT NULL,
    medicine_id INT UNSIGNED NOT NULL,
    batch_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    credit_amount DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    processed_by_user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sr_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sr_med FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sr_batch FOREIGN KEY (batch_id) REFERENCES medicine_batches (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sr_user FOREIGN KEY (processed_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. EXPENSES & FINANCIAL LEDGER
-- ---------------------------------------------------------------------
CREATE TABLE expenses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category ENUM('Electricity', 'Rent', 'Transportation', 'Salaries', 'Maintenance', 'Supplies', 'Software & Licences', 'Other') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_receipt VARCHAR(80) NULL,
    recorded_by_user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exp_user FOREIGN KEY (recorded_by_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_exp_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. SYSTEM NOTIFICATIONS & AUDIT LOGS
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type ENUM('critical', 'warning', 'info') NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    link_tab VARCHAR(60) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
