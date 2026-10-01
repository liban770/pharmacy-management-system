# Database Architecture & Entity Relationship Design (ERD)

## 1. Relational Entity Overview

The PharmOS database schema is designed in **Third Normal Form (3NF)** with zero transitive dependencies. All entities enforce referential integrity via MySQL InnoDB foreign keys.

```
       [roles] 1 ────< [users] 1 ────< [sales] 1 ────< [sale_items] >─── 1 [medicine_batches]
          │                │              │                                    │
          v                v              v                                    v
  [role_permissions] [audit_logs]   [customers] 1 ──< [prescriptions] 1 ──< [medicines]
                                          │                  │                 │
                                          v                  v                 v
                                  [customer_returns] [prescription_items]  [categories]
                                                             │                 │
                                                             v                 v
                                                     [stock_movements] <── [suppliers]
                                                             ^                 │
                                                             │                 v
                                                    [purchase_items] >─── 1 [purchases]
```

---

## 2. Table Specifications & Normalization Rationale

### `medicines`
* **Purpose**: Master catalog of pharmaceutical drugs and healthcare products.
* **Fields**: `id`, `category_id`, `name`, `generic_name`, `brand_name`, `sku`, `barcode`, `manufacturer`, `dosage_form`, `strength`, `unit`, `purchase_price`, `selling_price`, `min_stock_level`, `prescription_required`, `status`.
* **Normalization**: Separated from batch-specific data (batches have different expiry dates, suppliers, and cost bases).

### `medicine_batches`
* **Purpose**: Physical inventory containers. Essential for pharmaceutical compliance and FEFO.
* **Fields**: `id`, `medicine_id`, `supplier_id`, `batch_number`, `initial_quantity`, `current_quantity`, `purchase_price`, `selling_price`, `mfg_date`, `expiry_date`, `received_date`, `location_rack`.
* **Unique Constraint**: `UNIQUE KEY (medicine_id, batch_number)`.
* **Key Index**: `INDEX idx_batch_expiry (expiry_date)` accelerates FEFO queries.

### `stock_movements`
* **Purpose**: Immutable ledger recording every stock variation.
* **Types**: `purchase`, `sale`, `return`, `adjustment`, `damage`, `expiration`, `transfer`.
* **Audit Trail**: Every row stores `quantity`, `balance_before`, `balance_after`, `reference_type`, `reference_id`, `reason`, `performed_by_user_id`.

### `sales` & `sale_items`
* **Purpose**: Tracks patient and counter transactions.
* **Fields**: `invoice_number`, `customer_id`, `cashier_user_id`, `subtotal`, `discount_amount`, `tax_amount`, `grand_total`, `payment_method`, `amount_received`, `change_given`.
* **`sale_items`**: Records which batch was deducted for every line item, maintaining traceability.

### `prescriptions` & `prescription_items`
* **Purpose**: Prescription lifecycle management.
* **Fields**: `prescription_number`, `customer_id`, `doctor_name`, `doctor_license`, `prescription_date`, `status` (`Pending`, `Partially Dispensed`, `Dispensed`, `Cancelled`).

### `purchases` & `purchase_items`
* **Purpose**: Vendor purchase orders and goods receipt records.
* **Fields**: `purchase_number`, `supplier_id`, `received_by_user_id`, `grand_total`, `paid_amount`, `payment_status`.

### `suppliers` & `customers`
* **Purpose**: B2B vendors and patient accounts.
* **Financial Ledger**: Tracks `outstanding_balance` (Payables & Receivables) and lifetime spend/purchases.

### `expenses`
* **Purpose**: Operational cost tracking (Rent, Electricity cold-chain, Salaries, Supplies).

### `audit_logs`
* **Purpose**: Regulatory compliance audit trail capturing timestamp, user ID, user role, action type, entity, and client IP address.

---

## 3. Financial Precision
All monetary columns utilize `DECIMAL(12, 2)` to eliminate floating-point arithmetic rounding errors.
Tax rates utilize `DECIMAL(5, 4)` for high precision.
