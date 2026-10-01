# REST API Endpoints Specification

All API endpoints return JSON responses with standard HTTP status codes:
* `200 OK`: Request succeeded.
* `201 Created`: Resource created.
* `400 Bad Request`: Validation failure.
* `401 Unauthorized`: Session expired or missing authentication.
* `403 Forbidden`: Insufficient role privileges.
* `500 Internal Server Error`: Unexpected exception (logged to server error log).

---

## 1. Authentication & Session

### `POST /api/auth/login`
* **Request**: `{"email": "pharmacist@pharmos.health", "password": "Pharmacy@123"}`
* **Response**: `{"success": true, "user": {...}, "csrf_token": "..."}`

### `POST /api/auth/logout`
* **Response**: `{"success": true}`

---

## 2. Medicines Catalog

### `GET /api/medicines`
* **Query Params**: `search`, `category_id`, `status`, `page`, `limit`
* **Response**: `{"success": true, "data": [...], "pagination": {"total": 10, "page": 1}}`

### `POST /api/medicines`
* **Required Roles**: `admin`, `pharmacist`, `inventory_manager`
* **Payload**: `{"name": "Amoxicillin 500mg", "sku": "MED-AMX-500", "categoryId": 1, ...}`

---

## 3. Inventory & Batches

### `GET /api/batches`
* **Query Params**: `medicine_id`, `expiry_filter` (`all`, `expired`, `near_30`, `near_60`, `near_90`)
* **Response**: Batches list with calculated `days_to_expiry` and `status`.

### `POST /api/inventory/adjust`
* **Required Roles**: `admin`, `inventory_manager`
* **Payload**: `{"batchId": 4, "newQuantity": 15, "reason": "Monthly cycle count discrepancy", "type": "adjustment"}`

---

## 4. Point of Sale & Checkout

### `POST /api/sales/checkout`
* **Required Roles**: `admin`, `pharmacist`, `cashier`
* **Payload**:
```json
{
  "customerId": 1,
  "customerName": "Robert Miller",
  "prescriptionId": 1,
  "items": [
    { "medicineId": 3, "quantity": 1 }
  ],
  "discountPercentage": 0,
  "taxRate": 0.05,
  "paymentMethod": "Card",
  "amountReceived": 15.75
}
```
* **Response**: Returns invoice number, breakdown of deducted FEFO batches, receipt metadata.

---

## 5. Prescriptions

### `GET /api/prescriptions`
* **Query Params**: `status`, `customer_id`

### `POST /api/prescriptions/:id/dispense`
* **Required Roles**: `pharmacist`, `admin`
* **Payload**: `{"dispensedItems": [{"prescriptionItemId": 1, "dispensedQty": 1}]}`

---

## 6. Purchases & Goods Receiving

### `POST /api/purchases/receive`
* **Required Roles**: `admin`, `inventory_manager`
* **Payload**: `{"supplierId": 1, "paymentMethod": "Bank Transfer", "items": [{"medicineId": 1, "batchNumber": "BATCH-01", "expiryDate": "2027-10-01", "quantity": 100, "purchasePrice": 12.50, "sellingPrice": 22.00}]}`
