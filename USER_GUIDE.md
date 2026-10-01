# Operational User Guide

## 1. Quick Navigation by User Role

### Administrator (`admin@pharmos.health`)
* **Access**: All modules, Settings, Expenses, User Roles, and Audit Trail.
* **Key Tasks**: Monitor net profit, review system audit trail, register operational expenses, approve credit lines.

### Pharmacist (`pharmacist@pharmos.health`)
* **Access**: Prescriptions, Medicines, Batches, Inventory, POS Sales, Patients.
* **Key Tasks**: Review incoming prescriptions, check for drug interactions/allergies, dispense prescriptions, authorize customer returns.

### Cashier (`cashier@pharmos.health`)
* **Access**: POS Terminal, Sales History, Patient Lookup, Receipts.
* **Key Tasks**: Scan barcodes, add items to cart, select customer, accept payments, print receipts.

### Inventory Manager (`inventory@pharmos.health`)
* **Access**: Inventory, Batches, Stock Movements, Purchasing/Receiving, Suppliers.
* **Key Tasks**: Receive vendor shipments, assign batch numbers and expiry dates, perform cycle count adjustments, quarantine expired medicines.

---

## 2. Common Workflows

### How to Process a POS Sale
1. Navigate to **POS / Sales** tab.
2. Search medicine by name, generic name, or scan barcode.
3. Review the **FEFO Batch Allocation** breakdown showing which batch will be deducted.
4. Select customer or keep default "Walk-in Customer".
5. Enter payment method and cash received.
6. Click **Complete Sale & Generate Receipt**.
7. Print receipt or review invoice details.

### How to Dispense a Prescription
1. Navigate to **Prescriptions** tab.
2. Select a prescription with **Pending** status.
3. Click **Dispense Prescription**.
4. The system validates inventory using FEFO rules and updates the dispensed quantities.
5. The status transitions to **Dispensed** or **Partially Dispensed** with the Pharmacist ID and timestamp recorded.

### How to Receive a Supplier Shipment
1. Navigate to **Purchasing** tab.
2. Click **+ Receive Purchase Order**.
3. Select supplier, choose medicines, enter batch numbers, manufacturing dates, and expiry dates.
4. Click **Confirm Goods Receipt**. The system automatically provisions new batches, updates available stock, and records stock movements.
