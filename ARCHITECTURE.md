# System Architecture & Design Philosophy

## 1. Architectural Layers & Separation of Concerns

PharmOS Enterprise adopts a clean, layered architectural pattern strictly separating presentation, business logic, persistence abstraction, and database state:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  - Tailwind CSS + Semantic HTML5 Data Grids                │
│  - Point of Sale (POS) Viewport & Thermal Receipt Generator │
│  - Interactive Role Switcher & Modal Workflows              │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / HTTP REST Endpoints
┌──────────────────────────────▼──────────────────────────────┐
│                    MIDDLEWARE & SECURITY                    │
│  - Session Authentication & Timeout Guards                 │
│  - Role-Based Access Control (RBAC) Enforcement             │
│  - CSRF Token Validation & Rate Limiting                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    CONTROLLER LAYER                         │
│  - SaleController, MedicineController, BatchController     │
│  - Input sanitization, parameter validation                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    BUSINESS DOMAIN SERVICES                 │
│  - FefoService: First Expired First Out allocation engine    │
│  - PosService: Atomic transaction coordinator               │
│  - InventoryService: Immutable stock ledger calculations    │
│  - PrescriptionService: Clinical dispensing validation      │
│  - AuditService: Tamper-evident operational logging         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│               DATA ACCESS LAYER (PDO / REPOSITORIES)        │
│  - Native Prepared Statements (PDO::ATTR_EMULATE_PREPARES=0)│
│  - Atomic Transactions (beginTransaction, commit, rollBack) │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│               RELATIONAL DATABASE ENGINE (MySQL 8.0)        │
│  - InnoDB Storage Engine with Foreign Key Referential Safety│
│  - Normalized 3NF Schema & Composite Indexes                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Business Rules & Enforcement Mechanics

### A. First Expired, First Out (FEFO) Allocation Rule
* Unlike standard warehouses that use FIFO (First In, First Out), pharmacies must use **FEFO**.
* When 10 units of an item are requested:
  1. The system queries active batches where `medicine_id = :id` and `current_quantity > 0`.
  2. Batches are filtered to exclude any batch where `expiry_date <= CURRENT_DATE()`.
  3. Batches are sorted ascending by `expiry_date ASC`.
  4. Quantities are deducted from the earliest-expiring valid batch until satisfied.
  5. If the earliest batch has only 4 units, 4 are allocated, and the remaining 6 are drawn from the next valid batch.
* **Failure Guarantee**: If all non-expired batches total less than requested quantity, the transaction is rejected immediately with an explanatory deficit message.

### B. Prevention of Negative Stock
* Batch balances and total stock cannot drop below zero.
* Conditional atomic SQL updates (`UPDATE medicine_batches SET current_quantity = current_quantity - :qty WHERE id = :id AND current_quantity >= :qty`) guarantee that race conditions during concurrent POS checkouts never create negative quantities.

### C. Atomic Transaction Integrity
* Sales, purchases, customer returns, and prescription dispensing operations are wrapped in transactional boundaries.
* If any sub-step fails (e.g., payment failure, inventory shortage, database lock), `PDO::rollBack()` is executed, restoring original stock and balances.

### D. Historical Record Immutability
* Completed sales invoices and historical stock movements are permanently immutable.
* If product prices or names change subsequently, historical invoices retain the exact unit price and batch allocations registered at the moment of sale.
