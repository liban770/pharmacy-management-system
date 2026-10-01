-- =====================================================================
-- PHARMOS ENTERPRISE - SEED DATA FOR DEMO & PRODUCTION BOOTSTRAP
-- Passwords for all demo accounts: 'Pharmacy@123'
-- =====================================================================

-- Roles
INSERT INTO roles (id, name, display_name, description) VALUES
(1, 'admin', 'Administrator', 'Full system privileges across all modules and settings'),
(2, 'pharmacist', 'Pharmacist', 'Prescription validation, dispensing, clinical inventory, and sales'),
(3, 'cashier', 'Cashier', 'POS processing, receipts, payments, and walk-in customers'),
(4, 'inventory_manager', 'Inventory Manager', 'Stock receiving, batch tracking, warehouse movements, supplier balance');

-- Permissions
INSERT INTO permissions (slug, module, description) VALUES
('medicines.view', 'medicines', 'View catalog of medicines'),
('medicines.manage', 'medicines', 'Create, update, archive medicines'),
('batches.view', 'inventory', 'View batches and expiry dates'),
('batches.manage', 'inventory', 'Adjust batch quantities, quarantine expired items'),
('pos.checkout', 'pos', 'Process point of sale orders and print invoices'),
('prescriptions.dispense', 'prescriptions', 'Dispense prescription medications'),
('purchases.receive', 'purchasing', 'Create purchase orders and receive shipments'),
('reports.financial', 'reports', 'View profit/loss and gross margins'),
('audit.view', 'audit', 'View tamper-evident system audit log');

-- Default Users (Bcrypt hash of 'Pharmacy@123')
INSERT INTO users (id, role_id, name, email, password_hash, phone, status) VALUES
(1, 1, 'Dr. Sarah Jenkins', 'admin@pharmos.health', '$2y$10$tZ2E6p6x3s9xZgW5WqC13e2xP2U4V7o7L1q5C6W9Q0L2K5J8H3M6.', '+15552348901', 'active'),
(2, 2, 'Alex Vance, PharmD', 'pharmacist@pharmos.health', '$2y$10$tZ2E6p6x3s9xZgW5WqC13e2xP2U4V7o7L1q5C6W9Q0L2K5J8H3M6.', '+15553456712', 'active'),
(3, 3, 'Michael Chang', 'cashier@pharmos.health', '$2y$10$tZ2E6p6x3s9xZgW5WqC13e2xP2U4V7o7L1q5C6W9Q0L2K5J8H3M6.', '+15554567823', 'active'),
(4, 4, 'Elena Rostova', 'inventory@pharmos.health', '$2y$10$tZ2E6p6x3s9xZgW5WqC13e2xP2U4V7o7L1q5C6W9Q0L2K5J8H3M6.', '+15555678934', 'active');

-- Categories
INSERT INTO categories (id, name, code, description) VALUES
(1, 'Antibiotics', 'CAT-ANT', 'Antimicrobial agents for bacterial infections'),
(2, 'Cardiovascular', 'CAT-CRD', 'Hypertension, antianginals, beta-blockers, statins'),
(3, 'Analgesics & NSAIDs', 'CAT-ANL', 'Pain relief, antipyretics, and anti-inflammatory medicines'),
(4, 'Gastrointestinal', 'CAT-GST', 'Proton pump inhibitors, H2 antagonists, and antacids'),
(5, 'Respiratory', 'CAT-RSP', 'Inhaled corticosteroids, bronchodilators, antihistamines'),
(6, 'Antidiabetic', 'CAT-DIA', 'Oral hypoglycemics and insulins for glycemic management'),
(7, 'Vitamins & Supplements', 'CAT-VIT', 'Nutritional therapies and dietary supplements');

-- Suppliers
INSERT INTO suppliers (id, name, company, phone, email, address, contact_person, tax_number, payment_terms, outstanding_balance, total_purchases) VALUES
(1, 'Pfizer Distribution Hub', 'Pfizer Healthcare Logistics Inc.', '+18004381985', 'orders@pfizer-supply.com', '235 E 42nd St, New York, NY 10017', 'Marcus Thorne', 'US-EIN-13-1992210', 'Net 30', 3250.00, 48900.00),
(2, 'Novartis Supply Direct', 'Novartis Pharmaceuticals Corp', '+18886696682', 'distribution@novartis-pharma.com', 'One Health Plaza, East Hanover, NJ 07936', 'Clara Oswald', 'US-EIN-22-2938102', 'Net 15', 1420.50, 36700.00),
(3, 'Sun Pharma Distribution', 'Sun Pharmaceutical Industries', '+18008184555', 'b2b@sunpharma-us.com', '2 Independence Way, Princeton, NJ 08540', 'Rajesh Patel', 'US-EIN-45-8839201', 'Net 30', 0.00, 28400.00),
(4, 'Cipla Healthcare Logistics', 'Cipla USA Inc.', '+18666043268', 'sales@cipla-supply.com', '10 Independence Blvd, Warren, NJ 07059', 'Daniel Hayes', 'US-EIN-81-0943821', 'Immediate', 840.00, 19800.00);

-- Medicines
INSERT INTO medicines (id, category_id, name, generic_name, brand_name, sku, barcode, manufacturer, dosage_form, strength, unit, purchase_price, selling_price, min_stock_level, prescription_required, description) VALUES
(1, 1, 'Amoxicillin 500mg', 'Amoxicillin Trihydrate', 'Amoxil', 'MED-AMX-500', '89010300101', 'Pfizer Healthcare Logistics Inc.', 'Capsule', '500mg', 'Box of 100', 12.50, 22.00, 25, TRUE, 'Broad-spectrum penicillin antibiotic.'),
(2, 2, 'Atorvastatin 20mg', 'Atorvastatin Calcium', 'Lipitor', 'MED-ATV-020', '89010300102', 'Pfizer Healthcare Logistics Inc.', 'Tablet', '20mg', 'Box of 30', 18.00, 32.50, 20, TRUE, 'Statin for hypercholesterolemia prevention.'),
(3, 2, 'Amlodipine 5mg', 'Amlodipine Besylate', 'Norvasc', 'MED-AML-005', '89010300103', 'Pfizer Healthcare Logistics Inc.', 'Tablet', '5mg', 'Box of 30', 8.20, 15.00, 30, TRUE, 'Calcium channel blocker for hypertension.'),
(4, 3, 'Paracetamol 500mg', 'Acetaminophen', 'Panadol Extra', 'MED-PAR-500', '89010300104', 'Sun Pharmaceutical Industries', 'Tablet', '500mg', 'Box of 100', 3.50, 7.00, 50, FALSE, 'Analgesic and antipyretic for pain and fever.'),
(5, 3, 'Ibuprofen 400mg', 'Ibuprofen', 'Advil Forte', 'MED-IBU-400', '89010300105', 'Sun Pharmaceutical Industries', 'Tablet', '400mg', 'Box of 60', 5.40, 11.20, 25, FALSE, 'NSAID for inflammatory joint and toothache pain.'),
(6, 6, 'Metformin HCl 500mg', 'Metformin Hydrochloride', 'Glucophage', 'MED-MET-500', '89010300106', 'Cipla USA Inc.', 'Tablet', '500mg', 'Box of 100', 6.80, 13.50, 30, TRUE, 'Biguanide for glycemic regulation in diabetes.'),
(7, 4, 'Omeprazole 20mg', 'Omeprazole', 'Prilosec', 'MED-OMP-020', '89010300107', 'Novartis Pharmaceuticals Corp', 'Capsule', '20mg', 'Box of 28', 9.10, 18.00, 20, FALSE, 'Proton-pump inhibitor for acid reflux.'),
(8, 5, 'Cetirizine 10mg', 'Cetirizine Dihydrochloride', 'Zyrtec', 'MED-CET-010', '89010300108', 'Cipla USA Inc.', 'Tablet', '10mg', 'Box of 30', 4.80, 9.50, 20, FALSE, 'Non-drowsy antihistamine for allergic rhinitis.'),
(9, 5, 'Salbutamol Inhaler 100mcg', 'Albuterol Sulfate', 'Ventolin HFA', 'MED-SAL-100', '89010300109', 'Novartis Pharmaceuticals Corp', 'Inhaler', '100mcg', '200 Doses', 22.00, 38.00, 15, TRUE, 'Beta-2 bronchodilator inhaler for acute asthma.'),
(10, 1, 'Azithromycin 500mg', 'Azithromycin Monohydrate', 'Zithromax', 'MED-AZI-500', '89010300110', 'Pfizer Healthcare Logistics Inc.', 'Tablet', '500mg', 'Pack of 3', 11.50, 24.00, 15, TRUE, 'Macrolide antibiotic 3-day course.');

-- Medicine Batches
INSERT INTO medicine_batches (id, medicine_id, supplier_id, batch_number, initial_quantity, current_quantity, purchase_price, selling_price, mfg_date, expiry_date, received_date, location_rack) VALUES
(1, 1, 1, 'AMX-2026-B1', 50, 18, 12.50, 22.00, '2025-10-01', '2026-10-25', '2025-10-15', 'Rack A-01'),
(2, 1, 1, 'AMX-2026-B2', 100, 85, 12.50, 22.00, '2026-03-01', '2027-04-15', '2026-03-10', 'Rack A-02'),
(3, 2, 1, 'ATV-2026-A1', 60, 42, 18.00, 32.50, '2026-01-10', '2027-08-30', '2026-01-20', 'Rack B-04'),
(4, 3, 1, 'AML-2025-X8', 40, 12, 8.20, 15.00, '2025-06-01', '2026-11-20', '2025-06-15', 'Rack B-06'),
(5, 3, 1, 'AML-2026-K1', 80, 70, 8.20, 15.00, '2026-02-01', '2027-10-15', '2026-02-12', 'Rack B-07'),
(6, 4, 3, 'PAR-2026-09', 200, 165, 3.50, 7.00, '2026-02-15', '2028-02-15', '2026-03-01', 'Rack C-01'),
(7, 5, 3, 'IBU-2026-44', 80, 54, 5.40, 11.20, '2026-01-20', '2027-12-31', '2026-02-05', 'Rack C-04'),
(8, 6, 4, 'MET-2025-V2', 50, 8, 6.80, 13.50, '2025-08-01', '2026-12-18', '2025-08-15', 'Rack D-02'),
(9, 6, 4, 'MET-2026-N1', 120, 110, 6.80, 13.50, '2026-03-10', '2028-03-10', '2026-03-25', 'Rack D-03'),
-- EXPIRED BATCH: 15 days past expiry, used to prove safety locking
(10, 7, 2, 'OMP-2024-EXP', 30, 14, 9.10, 18.00, '2024-09-01', '2026-09-15', '2024-09-10', 'Quarantine'),
(11, 7, 2, 'OMP-2026-F1', 70, 62, 9.10, 18.00, '2026-04-01', '2027-11-01', '2026-04-12', 'Rack E-01'),
(12, 8, 4, 'CET-2026-01', 60, 38, 4.80, 9.50, '2026-01-05', '2027-09-15', '2026-01-18', 'Rack F-02'),
(13, 9, 2, 'SAL-2026-V1', 35, 21, 22.00, 38.00, '2026-02-10', '2027-08-20', '2026-02-25', 'Rack F-08'),
(14, 10, 1, 'AZI-2026-Z3', 40, 28, 11.50, 24.00, '2026-03-01', '2028-03-01', '2026-03-15', 'Rack A-05');

-- Customers
INSERT INTO customers (id, name, phone, email, address, date_of_birth, gender, medical_notes, allergies, outstanding_balance, total_spent) VALUES
(1, 'Robert Miller', '+15557231190', 'robert.miller@gmail.com', '742 Evergreen Terrace, Springfield', '1968-04-12', 'Male', 'Hypertension stage 2', 'Penicillin (Severe rash)', 0.00, 438.50),
(2, 'Emily Watson', '+15558342201', 'emily.w@outlook.com', '128 Pinecrest Ave, Springfield', '1975-09-23', 'Female', 'Type 2 Diabetes', 'None recorded', 45.00, 620.00),
(3, 'David Clark', '+15559453312', 'david.c@clarkarch.com', '450 Oak Boulevard, Springfield', '1984-11-05', 'Male', 'Moderate persistent asthma', 'Aspirin/NSAIDs', 0.00, 310.00),
(4, 'Fatima Al-Mansoor', '+15551564423', 'fatima.almansoor@email.com', '89 Maple Court, Springfield', '1992-06-18', 'Female', 'Allergic rhinitis', 'None', 0.00, 185.00);

-- Prescriptions
INSERT INTO prescriptions (id, prescription_number, customer_id, doctor_name, doctor_clinic, doctor_license, prescription_date, status, notes) VALUES
(1, 'RX-2026-0891', 1, 'Dr. Gregory House, MD', 'Mercy Memorial Cardiology Clinic', 'MD-CARDIO-4921', '2026-09-29', 'Pending', 'Cardiovascular maintenance regimen.'),
(2, 'RX-2026-0885', 2, 'Dr. Allison Cameron, MD', 'Springfield Endocrinology Center', 'MD-ENDO-8841', '2026-09-25', 'Partially Dispensed', 'HbA1c target < 6.8%'),
(3, 'RX-2026-0870', 3, 'Dr. James Wilson, MD', 'Chest & Allergy Specialist Clinic', 'MD-PULM-7712', '2026-09-18', 'Dispensed', 'Spacer technique demonstrated.');

INSERT INTO prescription_items (id, prescription_id, medicine_id, dosage, frequency, duration, prescribed_quantity, dispensed_quantity, instructions) VALUES
(1, 1, 3, '1 Tablet (5mg)', 'OD (Morning)', '30 days', 1, 0, 'Take 1 tablet every morning.'),
(2, 1, 2, '1 Tablet (20mg)', 'ON (Bedtime)', '30 days', 1, 0, 'Take 1 tablet at night.'),
(3, 2, 6, '1 Tablet (500mg)', 'BD (Meals)', '60 days', 2, 1, 'Take with meals.'),
(4, 3, 9, '1-2 Puffs', 'PRN', 'Rescue', 1, 1, 'Inhale 1-2 puffs for acute wheeze.');

-- Audit Log initialization
INSERT INTO audit_logs (user_name, user_role, action, entity, entity_id, description, ip_address) VALUES
('Dr. Sarah Jenkins', 'admin', 'SYSTEM_INITIALIZATION', 'System', '0', 'Production schema seeded with initial master data and demo records.', '127.0.0.1');
