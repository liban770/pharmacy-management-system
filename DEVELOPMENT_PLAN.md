# Implementation & Development Plan (Phases 1 - 12)

This development plan establishes the execution sequence implemented for PharmOS Enterprise:

### Phase 1: Database Architecture & Normalization
* 3NF schema design (`database/schema.sql`)
* InnoDB tables, foreign key constraints, indexes on barcodes and expiry dates
* Seed dataset with representative pharmaceutical entities (`database/seeds.sql`)

### Phase 2: Authentication & Multi-Role RBAC
* Role hierarchy: Admin, Pharmacist, Cashier, Inventory Manager
* Password hashing with bcrypt, session middleware, CSRF protection

### Phase 3: Medicines, Categories & Suppliers Catalog
* Comprehensive medicine entity fields (dosage form, strength, prescription flag)
* Supplier accounts with credit terms and transaction ledgers

### Phase 4: Batch & Expiry Management (FEFO)
* Multi-batch per medicine tracking
* Automatic calculation of days to expiry and tier status (Expired, <=30d, <=60d, <=90d, Normal)
* First Expired First Out engine blocking expired batches

### Phase 5: Purchasing & Receiving
* Purchase orders, receiving workflow
* Automated batch creation, inventory increment, supplier balance update

### Phase 6: POS & Sales Checkout
* Barcode search, cart management, discount/tax calculations
* Automated FEFO batch allocation preview
* Receipt generator with print styles

### Phase 7: Customers & Prescriptions
* Patient allergy profiles, doctor licenses, prescription verification
* Dispensing workflow with pharmacist verification stamps

### Phase 8: Returns & Expense Management
* Customer returns with Restock vs Waste disposition
* Supplier returns with credit tracking
* Pharmacy operational overhead tracking

### Phase 9: Financial Management & Reporting
* Daily/Monthly sales, Inventory valuation, Movement audit
* Gross & Net profit calculations, CSV/JSON/Print exports

### Phase 10: Notifications & Audit Trail
* Real-time warning bells for low stock, expiring batches, and pending Rx
* Immutable audit log tracking operator, action, entity, and IP

### Phase 11: Security Hardening & Unit Tests
* Verification suite covering FEFO edge cases, boundary conditions, and transaction rollback

### Phase 12: Deployment & Operational Guides
* XAMPP/Apache configuration, documentation suite
