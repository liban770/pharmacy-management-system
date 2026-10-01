import {
  User,
  RoleName,
  Category,
  Supplier,
  Medicine,
  MedicineBatch,
  StockMovement,
  Customer,
  Prescription,
  Sale,
  PurchaseOrder,
  CustomerReturn,
  SupplierReturn,
  Expense,
  Notification,
  AuditLog
} from '../types/pharmacy';
import { calculateDaysToExpiry, getBatchExpiryStatus, allocateBatchesFefo } from './fefoEngine';
import { api } from './apiClient';

try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('pharmos_enterprise_v2_db');
  }
} catch (e) {}

const STORAGE_KEY = 'pharmos_enterprise_mysql_v3';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: 'System Administrator',
    email: 'admin@pharmos.health',
    role: 'admin',
    roleTitle: 'Administrator',
    phone: '+1 (555) 010-0001',
    status: 'active',
    lastLogin: '2026-10-01 10:00:00'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Antibiotics', code: 'CAT-ANT', description: 'Bacterial infection antimicrobials' },
  { id: 2, name: 'Cardiovascular', code: 'CAT-CRD', description: 'Hypertension, antianginals, and statins' },
  { id: 3, name: 'Analgesics & NSAIDs', code: 'CAT-ANL', description: 'Pain management and antipyretics' },
  { id: 4, name: 'Gastrointestinal', code: 'CAT-GST', description: 'Proton-pump inhibitors and antacids' },
  { id: 5, name: 'Respiratory', code: 'CAT-RSP', description: 'Bronchodilators, inhalers, and antihistamines' },
  { id: 6, name: 'Antidiabetic', code: 'CAT-DIA', description: 'Insulins and oral hypoglycemic agents' },
  { id: 7, name: 'Vitamins & Supplements', code: 'CAT-VIT', description: 'Therapeutic nutritional supplements' }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'Pfizer Distribution Hub',
    company: 'Pfizer Healthcare Logistics Inc.',
    phone: '+1 (800) 438-1985',
    email: 'orders@pfizer-supply.com',
    address: '235 E 42nd St, New York, NY 10017',
    contactPerson: 'Marcus Thorne',
    taxNumber: 'US-EIN-13-1992210',
    paymentTerms: 'Net 30',
    outstandingBalance: 3250.00,
    totalPurchases: 48900.00,
    status: 'active'
  },
  {
    id: 2,
    name: 'Novartis Supply Direct',
    company: 'Novartis Pharmaceuticals Corp',
    phone: '+1 (888) 669-6682',
    email: 'distribution@novartis-pharma.com',
    address: 'One Health Plaza, East Hanover, NJ 07936',
    contactPerson: 'Clara Oswald',
    taxNumber: 'US-EIN-22-2938102',
    paymentTerms: 'Net 15',
    outstandingBalance: 1420.50,
    totalPurchases: 36700.00,
    status: 'active'
  },
  {
    id: 3,
    name: 'Sun Pharma Distribution',
    company: 'Sun Pharmaceutical Industries',
    phone: '+1 (800) 818-4555',
    email: 'b2b@sunpharma-us.com',
    address: '2 Independence Way, Princeton, NJ 08540',
    contactPerson: 'Rajesh Patel',
    taxNumber: 'US-EIN-45-8839201',
    paymentTerms: 'Net 30',
    outstandingBalance: 0.00,
    totalPurchases: 28400.00,
    status: 'active'
  },
  {
    id: 4,
    name: 'Cipla Healthcare Logistics',
    company: 'Cipla USA Inc.',
    phone: '+1 (866) 604-3268',
    email: 'sales@cipla-supply.com',
    address: '10 Independence Blvd, Warren, NJ 07059',
    contactPerson: 'Daniel Hayes',
    taxNumber: 'US-EIN-81-0943821',
    paymentTerms: 'Immediate',
    outstandingBalance: 840.00,
    totalPurchases: 19800.00,
    status: 'active'
  }
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 1,
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    brandName: 'Amoxil',
    sku: 'MED-AMX-500',
    barcode: '89010300101',
    categoryId: 1,
    categoryName: 'Antibiotics',
    manufacturer: 'Pfizer Healthcare Logistics Inc.',
    dosageForm: 'Capsule',
    strength: '500mg',
    unit: 'Box of 100',
    purchasePrice: 12.50,
    sellingPrice: 22.00,
    minStockLevel: 25,
    prescriptionRequired: true,
    description: 'Broad-spectrum penicillin antibiotic for bacterial infections.',
    status: 'active',
    createdAt: '2026-01-10 10:00:00',
    updatedAt: '2026-09-15 14:00:00'
  },
  {
    id: 2,
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin Calcium',
    brandName: 'Lipitor',
    sku: 'MED-ATV-020',
    barcode: '89010300102',
    categoryId: 2,
    categoryName: 'Cardiovascular',
    manufacturer: 'Pfizer Healthcare Logistics Inc.',
    dosageForm: 'Tablet',
    strength: '20mg',
    unit: 'Box of 30',
    purchasePrice: 18.00,
    sellingPrice: 32.50,
    minStockLevel: 20,
    prescriptionRequired: true,
    description: 'HMG-CoA reductase inhibitor for dyslipidemia and primary cardiovascular prevention.',
    status: 'active',
    createdAt: '2026-01-12 11:20:00',
    updatedAt: '2026-09-20 09:30:00'
  },
  {
    id: 3,
    name: 'Amlodipine 5mg',
    genericName: 'Amlodipine Besylate',
    brandName: 'Norvasc',
    sku: 'MED-AML-005',
    barcode: '89010300103',
    categoryId: 2,
    categoryName: 'Cardiovascular',
    manufacturer: 'Pfizer Healthcare Logistics Inc.',
    dosageForm: 'Tablet',
    strength: '5mg',
    unit: 'Box of 30',
    purchasePrice: 8.20,
    sellingPrice: 15.00,
    minStockLevel: 30,
    prescriptionRequired: true,
    description: 'Calcium channel blocker for essential hypertension and coronary artery disease.',
    status: 'active',
    createdAt: '2026-01-15 08:45:00',
    updatedAt: '2026-09-22 16:10:00'
  },
  {
    id: 4,
    name: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    brandName: 'Panadol Extra',
    sku: 'MED-PAR-500',
    barcode: '89010300104',
    categoryId: 3,
    categoryName: 'Analgesics & NSAIDs',
    manufacturer: 'Sun Pharmaceutical Industries',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Box of 100',
    purchasePrice: 3.50,
    sellingPrice: 7.00,
    minStockLevel: 50,
    prescriptionRequired: false,
    description: 'Fast-acting analgesic and antipyretic for mild to moderate pain and fever.',
    status: 'active',
    createdAt: '2026-01-05 14:00:00',
    updatedAt: '2026-09-28 11:00:00'
  },
  {
    id: 5,
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    brandName: 'Advil Forte',
    sku: 'MED-IBU-400',
    barcode: '89010300105',
    categoryId: 3,
    categoryName: 'Analgesics & NSAIDs',
    manufacturer: 'Sun Pharmaceutical Industries',
    dosageForm: 'Tablet',
    strength: '400mg',
    unit: 'Box of 60',
    purchasePrice: 5.40,
    sellingPrice: 11.20,
    minStockLevel: 25,
    prescriptionRequired: false,
    description: 'Nonsteroidal anti-inflammatory drug (NSAID) for inflammatory pain.',
    status: 'active',
    createdAt: '2026-01-18 09:10:00',
    updatedAt: '2026-09-18 09:10:00'
  },
  {
    id: 6,
    name: 'Metformin HCl 500mg',
    genericName: 'Metformin Hydrochloride',
    brandName: 'Glucophage',
    sku: 'MED-MET-500',
    barcode: '89010300106',
    categoryId: 6,
    categoryName: 'Antidiabetic',
    manufacturer: 'Cipla USA Inc.',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Box of 100',
    purchasePrice: 6.80,
    sellingPrice: 13.50,
    minStockLevel: 30,
    prescriptionRequired: true,
    description: 'Biguanide antihyperglycemic for glycemic control in Type 2 Diabetes.',
    status: 'active',
    createdAt: '2026-02-01 12:00:00',
    updatedAt: '2026-09-10 15:40:00'
  },
  {
    id: 7,
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    brandName: 'Prilosec',
    sku: 'MED-OMP-020',
    barcode: '89010300107',
    categoryId: 4,
    categoryName: 'Gastrointestinal',
    manufacturer: 'Novartis Pharmaceuticals Corp',
    dosageForm: 'Capsule',
    strength: '20mg',
    unit: 'Box of 28',
    purchasePrice: 9.10,
    sellingPrice: 18.00,
    minStockLevel: 20,
    prescriptionRequired: false,
    description: 'Delayed-release proton pump inhibitor for GERD and peptic ulcer disease.',
    status: 'active',
    createdAt: '2026-02-05 10:30:00',
    updatedAt: '2026-09-24 10:20:00'
  },
  {
    id: 8,
    name: 'Cetirizine 10mg',
    genericName: 'Cetirizine Dihydrochloride',
    brandName: 'Zyrtec',
    sku: 'MED-CET-010',
    barcode: '89010300108',
    categoryId: 5,
    categoryName: 'Respiratory',
    manufacturer: 'Cipla USA Inc.',
    dosageForm: 'Tablet',
    strength: '10mg',
    unit: 'Box of 30',
    purchasePrice: 4.80,
    sellingPrice: 9.50,
    minStockLevel: 20,
    prescriptionRequired: false,
    description: 'Second-generation non-sedating H1 antihistamine for allergic rhinitis.',
    status: 'active',
    createdAt: '2026-02-10 16:00:00',
    updatedAt: '2026-09-02 08:30:00'
  },
  {
    id: 9,
    name: 'Salbutamol Inhaler 100mcg',
    genericName: 'Albuterol Sulfate',
    brandName: 'Ventolin HFA',
    sku: 'MED-SAL-100',
    barcode: '89010300109',
    categoryId: 5,
    categoryName: 'Respiratory',
    manufacturer: 'Novartis Pharmaceuticals Corp',
    dosageForm: 'Inhaler',
    strength: '100mcg/actuation',
    unit: '200 Doses Cannister',
    purchasePrice: 22.00,
    sellingPrice: 38.00,
    minStockLevel: 15,
    prescriptionRequired: true,
    description: 'Rapid-acting beta-2 agonist for relief of bronchospasm in asthma and COPD.',
    status: 'active',
    createdAt: '2026-02-15 13:00:00',
    updatedAt: '2026-09-25 12:00:00'
  },
  {
    id: 10,
    name: 'Azithromycin 500mg',
    genericName: 'Azithromycin Monohydrate',
    brandName: 'Zithromax',
    sku: 'MED-AZI-500',
    barcode: '89010300110',
    categoryId: 1,
    categoryName: 'Antibiotics',
    manufacturer: 'Pfizer Healthcare Logistics Inc.',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Pack of 3',
    purchasePrice: 11.50,
    sellingPrice: 24.00,
    minStockLevel: 15,
    prescriptionRequired: true,
    description: 'Macrolide antibiotic for upper and lower respiratory tract infections.',
    status: 'active',
    createdAt: '2026-02-20 11:00:00',
    updatedAt: '2026-09-12 10:00:00'
  }
];

export const INITIAL_BATCHES: MedicineBatch[] = [
  // Amoxicillin batches: 1 fresh, 1 expiring in 25 days (to test FEFO near expiry)
  {
    id: 1,
    medicineId: 1,
    medicineName: 'Amoxicillin 500mg',
    batchNumber: 'AMX-2026-B1',
    initialQuantity: 50,
    currentQuantity: 18,
    purchasePrice: 12.50,
    sellingPrice: 22.00,
    mfgDate: '2025-10-01',
    expiryDate: '2026-10-25', // Expiring in ~24 days (near_expiry_30)
    supplierId: 1,
    supplierName: 'Pfizer Distribution Hub',
    receivedDate: '2025-10-15',
    locationRack: 'Rack A-01'
  },
  {
    id: 2,
    medicineId: 1,
    medicineName: 'Amoxicillin 500mg',
    batchNumber: 'AMX-2026-B2',
    initialQuantity: 100,
    currentQuantity: 85,
    purchasePrice: 12.50,
    sellingPrice: 22.00,
    mfgDate: '2026-03-01',
    expiryDate: '2027-04-15', // Normal
    supplierId: 1,
    supplierName: 'Pfizer Distribution Hub',
    receivedDate: '2026-03-10',
    locationRack: 'Rack A-02'
  },

  // Atorvastatin batches
  {
    id: 3,
    medicineId: 2,
    medicineName: 'Atorvastatin 20mg',
    batchNumber: 'ATV-2026-A1',
    initialQuantity: 60,
    currentQuantity: 42,
    purchasePrice: 18.00,
    sellingPrice: 32.50,
    mfgDate: '2026-01-10',
    expiryDate: '2027-08-30',
    supplierId: 1,
    supplierName: 'Pfizer Distribution Hub',
    receivedDate: '2026-01-20',
    locationRack: 'Rack B-04'
  },

  // Amlodipine batches: One expiring in 50 days (near_expiry_60)
  {
    id: 4,
    medicineId: 3,
    medicineName: 'Amlodipine 5mg',
    batchNumber: 'AML-2025-X8',
    initialQuantity: 40,
    currentQuantity: 12,
    purchasePrice: 8.20,
    sellingPrice: 15.00,
    mfgDate: '2025-06-01',
    expiryDate: '2026-11-20', // ~50 days
    supplierId: 1,
    supplierName: 'Pfizer Distribution Hub',
    receivedDate: '2025-06-15',
    locationRack: 'Rack B-06'
  },
  {
    id: 5,
    medicineId: 3,
    medicineName: 'Amlodipine 5mg',
    batchNumber: 'AML-2026-K1',
    initialQuantity: 80,
    currentQuantity: 70,
    purchasePrice: 8.20,
    sellingPrice: 15.00,
    mfgDate: '2026-02-01',
    expiryDate: '2027-10-15',
    supplierId: 1,
    supplierName: 'Pfizer Distribution Hub',
    receivedDate: '2026-02-12',
    locationRack: 'Rack B-07'
  },

  // Paracetamol batches
  {
    id: 6,
    medicineId: 4,
    medicineName: 'Paracetamol 500mg',
    batchNumber: 'PAR-2026-09',
    initialQuantity: 200,
    currentQuantity: 165,
    purchasePrice: 3.50,
    sellingPrice: 7.00,
    mfgDate: '2026-02-15',
    expiryDate: '2028-02-15',
    supplierId: 3,
    supplierName: 'Sun Pharma Distribution',
    receivedDate: '2026-03-01',
    locationRack: 'Rack C-01'
  },

  // Ibuprofen batches
  {
    id: 7,
    medicineId: 5,
    medicineName: 'Ibuprofen 400mg',
    batchNumber: 'IBU-2026-44',
    initialQuantity: 80,
    currentQuantity: 54,
    purchasePrice: 5.40,
    sellingPrice: 11.20,
    mfgDate: '2026-01-20',
    expiryDate: '2027-12-31',
    supplierId: 3,
    supplierName: 'Sun Pharma Distribution',
    receivedDate: '2026-02-05',
    locationRack: 'Rack C-04'
  },

  // Metformin batches: 1 low quantity batch expiring in 80 days (near_expiry_90), 1 large fresh
  {
    id: 8,
    medicineId: 6,
    medicineName: 'Metformin HCl 500mg',
    batchNumber: 'MET-2025-V2',
    initialQuantity: 50,
    currentQuantity: 8,
    purchasePrice: 6.80,
    sellingPrice: 13.50,
    mfgDate: '2025-08-01',
    expiryDate: '2026-12-18', // ~78 days
    supplierId: 4,
    supplierName: 'Cipla Healthcare Logistics',
    receivedDate: '2025-08-15',
    locationRack: 'Rack D-02'
  },
  {
    id: 9,
    medicineId: 6,
    medicineName: 'Metformin HCl 500mg',
    batchNumber: 'MET-2026-N1',
    initialQuantity: 120,
    currentQuantity: 110,
    purchasePrice: 6.80,
    sellingPrice: 13.50,
    mfgDate: '2026-03-10',
    expiryDate: '2028-03-10',
    supplierId: 4,
    supplierName: 'Cipla Healthcare Logistics',
    receivedDate: '2026-03-25',
    locationRack: 'Rack D-03'
  },

  // Omeprazole: Crucial test case!
  // Batch 10 is EXPIRED (expired on 2026-09-15, 15 days ago)!
  // Batch 11 is fresh (expiry 2027-11-01).
  // Demonstrates FEFO lock where expired batch CANNOT be sold, and system must skip or alert!
  {
    id: 10,
    medicineId: 7,
    medicineName: 'Omeprazole 20mg',
    batchNumber: 'OMP-2024-EXP',
    initialQuantity: 30,
    currentQuantity: 14,
    purchasePrice: 9.10,
    sellingPrice: 18.00,
    mfgDate: '2024-09-01',
    expiryDate: '2026-09-15', // EXPIRED 15 days ago!
    supplierId: 2,
    supplierName: 'Novartis Supply Direct',
    receivedDate: '2024-09-10',
    locationRack: 'Quarantine / Expired Shelf'
  },
  {
    id: 11,
    medicineId: 7,
    medicineName: 'Omeprazole 20mg',
    batchNumber: 'OMP-2026-F1',
    initialQuantity: 70,
    currentQuantity: 62,
    purchasePrice: 9.10,
    sellingPrice: 18.00,
    mfgDate: '2026-04-01',
    expiryDate: '2027-11-01',
    supplierId: 2,
    supplierName: 'Novartis Supply Direct',
    receivedDate: '2026-04-12',
    locationRack: 'Rack E-01'
  },

  // Cetirizine batches
  {
    id: 12,
    medicineId: 8,
    medicineName: 'Cetirizine 10mg',
    batchNumber: 'CET-2026-01',
    initialQuantity: 60,
    currentQuantity: 38,
    purchasePrice: 4.80,
    sellingPrice: 9.50,
    mfgDate: '2026-01-05',
    expiryDate: '2027-09-15',
    supplierId: 4,
    supplierName: 'Cipla Healthcare Logistics',
    receivedDate: '2026-01-18',
    locationRack: 'Rack F-02'
  },

  // Salbutamol Inhaler batches
  {
    id: 13,
    medicineId: 9,
    medicineName: 'Salbutamol Inhaler 100mcg',
    batchNumber: 'SAL-2026-V1',
    initialQuantity: 35,
    currentQuantity: 21,
    purchasePrice: 22.00,
    sellingPrice: 38.00,
    mfgDate: '2026-02-10',
    expiryDate: '2027-08-20',
    supplierId: 2,
    supplierName: 'Novartis Supply Direct',
    receivedDate: '2026-02-25',
    locationRack: 'Rack F-08'
  },

  // Azithromycin batches
  {
    id: 14,
    medicineId: 10,
    medicineName: 'Azithromycin 500mg',
    batchNumber: 'AZI-2026-Z3',
    initialQuantity: 40,
    currentQuantity: 28,
    purchasePrice: 11.50,
    sellingPrice: 24.00,
    mfgDate: '2026-03-01',
    expiryDate: '2028-03-01',
    supplierId: 1,
    supplierName: 'Pfizer Distribution Hub',
    receivedDate: '2026-03-15',
    locationRack: 'Rack A-05'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'Robert Miller',
    phone: '+1 (555) 723-1190',
    email: 'robert.miller@gmail.com',
    address: '742 Evergreen Terrace, Springfield',
    dateOfBirth: '1968-04-12',
    gender: 'Male',
    medicalNotes: 'Essential hypertension stage 2, mild hypercholesterolemia.',
    allergies: 'Penicillin (Severe rash)',
    outstandingBalance: 0.00,
    totalSpent: 438.50,
    createdAt: '2026-02-10 11:00:00'
  },
  {
    id: 2,
    name: 'Emily Watson',
    phone: '+1 (555) 834-2201',
    email: 'emily.w@outlook.com',
    address: '128 Pinecrest Ave, Springfield',
    dateOfBirth: '1975-09-23',
    gender: 'Female',
    medicalNotes: 'Type 2 Diabetes Mellitus, managed on Metformin.',
    allergies: 'None recorded',
    outstandingBalance: 45.00,
    totalSpent: 620.00,
    createdAt: '2026-02-14 14:30:00'
  },
  {
    id: 3,
    name: 'David Clark',
    phone: '+1 (555) 945-3312',
    email: 'david.c@clarkarch.com',
    address: '450 Oak Boulevard, Springfield',
    dateOfBirth: '1984-11-05',
    gender: 'Male',
    medicalNotes: 'Moderate persistent asthma; uses daily inhaler.',
    allergies: 'Aspirin/NSAIDs (Asthma flare)',
    outstandingBalance: 0.00,
    totalSpent: 310.00,
    createdAt: '2026-03-01 10:15:00'
  },
  {
    id: 4,
    name: 'Fatima Al-Mansoor',
    phone: '+1 (555) 156-4423',
    email: 'fatima.almansoor@email.com',
    address: '89 Maple Court, Springfield',
    dateOfBirth: '1992-06-18',
    gender: 'Female',
    medicalNotes: 'Seasonal allergic rhinitis and occasional tension headaches.',
    allergies: 'None',
    outstandingBalance: 0.00,
    totalSpent: 185.00,
    createdAt: '2026-03-12 16:45:00'
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 1,
    prescriptionNumber: 'RX-2026-0891',
    customerId: 1,
    customerName: 'Robert Miller',
    customerPhone: '+1 (555) 723-1190',
    doctorName: 'Dr. Gregory House, MD',
    doctorClinic: 'Mercy Memorial Cardiology Clinic',
    doctorLicense: 'MD-CARDIO-4921',
    prescriptionDate: '2026-09-29',
    status: 'Pending',
    notes: 'Long-term cardiovascular maintenance regimen. Verify patient compliance.',
    items: [
      {
        id: 1,
        prescriptionId: 1,
        medicineId: 3,
        medicineName: 'Amlodipine 5mg',
        dosage: '1 Tablet (5mg)',
        frequency: 'OD (Once daily in morning)',
        duration: '30 days',
        prescribedQuantity: 1,
        dispensedQuantity: 0,
        instructions: 'Take 1 tablet every morning with or without food.'
      },
      {
        id: 2,
        prescriptionId: 1,
        medicineId: 2,
        medicineName: 'Atorvastatin 20mg',
        dosage: '1 Tablet (20mg)',
        frequency: 'ON (Once nightly at bedtime)',
        duration: '30 days',
        prescribedQuantity: 1,
        dispensedQuantity: 0,
        instructions: 'Take 1 tablet at bedtime. Avoid grapefruit consumption.'
      }
    ]
  },
  {
    id: 2,
    prescriptionNumber: 'RX-2026-0885',
    customerId: 2,
    customerName: 'Emily Watson',
    customerPhone: '+1 (555) 834-2201',
    doctorName: 'Dr. Allison Cameron, MD',
    doctorClinic: 'Springfield Endocrinology Center',
    doctorLicense: 'MD-ENDO-8841',
    prescriptionDate: '2026-09-25',
    status: 'Partially Dispensed',
    notes: 'HbA1c target < 6.8%. Patient dispensed initial supply, refill remaining.',
    dispensedBy: 'Alex Vance, PharmD',
    dispensedAt: '2026-09-26 11:20:00',
    items: [
      {
        id: 3,
        prescriptionId: 2,
        medicineId: 6,
        medicineName: 'Metformin HCl 500mg',
        dosage: '1 Tablet (500mg)',
        frequency: 'BD (Twice daily with meals)',
        duration: '60 days',
        prescribedQuantity: 2,
        dispensedQuantity: 1,
        instructions: 'Take with morning and evening meals to minimize GI distress.'
      }
    ]
  },
  {
    id: 3,
    prescriptionNumber: 'RX-2026-0870',
    customerId: 3,
    customerName: 'David Clark',
    customerPhone: '+1 (555) 945-3312',
    doctorName: 'Dr. James Wilson, MD',
    doctorClinic: 'Chest & Allergy Specialist Clinic',
    doctorLicense: 'MD-PULM-7712',
    prescriptionDate: '2026-09-18',
    status: 'Dispensed',
    notes: 'Prescription fully verified and dispensed with inhaler spacer technique counseling.',
    dispensedBy: 'Alex Vance, PharmD',
    dispensedAt: '2026-09-18 14:40:00',
    items: [
      {
        id: 4,
        prescriptionId: 3,
        medicineId: 9,
        medicineName: 'Salbutamol Inhaler 100mcg',
        dosage: '1-2 Puffs',
        frequency: 'PRN (As needed for acute wheeze)',
        duration: 'Rescue',
        prescribedQuantity: 1,
        dispensedQuantity: 1,
        instructions: 'Inhale 1 to 2 puffs every 4-6 hours as needed for shortness of breath.'
      }
    ]
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 1,
    invoiceNumber: 'INV-2026-0041',
    customerId: 3,
    customerName: 'David Clark',
    prescriptionId: 3,
    prescriptionNumber: 'RX-2026-0870',
    subtotal: 38.00,
    discountPercentage: 0,
    discountAmount: 0.00,
    taxRate: 0.05,
    taxAmount: 1.90,
    grandTotal: 39.90,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    amountReceived: 39.90,
    changeGiven: 0.00,
    cashierName: 'Michael Chang',
    cashierId: 3,
    notes: 'Prescription sale for Ventolin inhaler.',
    items: [
      {
        id: 1,
        saleId: 1,
        medicineId: 9,
        medicineName: 'Salbutamol Inhaler 100mcg',
        dosageForm: 'Inhaler',
        quantity: 1,
        unitPrice: 38.00,
        subtotal: 38.00,
        batchAllocations: [
          {
            batchId: 13,
            batchNumber: 'SAL-2026-V1',
            quantity: 1,
            unitPrice: 38.00,
            expiryDate: '2027-08-20'
          }
        ]
      }
    ],
    createdAt: '2026-09-18 14:45:00'
  },
  {
    id: 2,
    invoiceNumber: 'INV-2026-0042',
    customerName: 'Walk-in Customer',
    subtotal: 14.00,
    discountPercentage: 0,
    discountAmount: 0.00,
    taxRate: 0.05,
    taxAmount: 0.70,
    grandTotal: 14.70,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    amountReceived: 20.00,
    changeGiven: 5.30,
    cashierName: 'Michael Chang',
    cashierId: 3,
    notes: 'OTC counter purchase',
    items: [
      {
        id: 2,
        saleId: 2,
        medicineId: 4,
        medicineName: 'Paracetamol 500mg',
        dosageForm: 'Tablet',
        quantity: 2,
        unitPrice: 7.00,
        subtotal: 14.00,
        batchAllocations: [
          {
            batchId: 6,
            batchNumber: 'PAR-2026-09',
            quantity: 2,
            unitPrice: 7.00,
            expiryDate: '2028-02-15'
          }
        ]
      }
    ],
    createdAt: '2026-09-29 16:15:00'
  },
  {
    id: 3,
    invoiceNumber: 'INV-2026-0043',
    customerId: 4,
    customerName: 'Fatima Al-Mansoor',
    subtotal: 20.70,
    discountPercentage: 5,
    discountAmount: 1.04,
    taxRate: 0.05,
    taxAmount: 0.98,
    grandTotal: 20.64,
    paymentMethod: 'Mobile Money',
    paymentStatus: 'Paid',
    amountReceived: 20.64,
    changeGiven: 0.00,
    cashierName: 'Michael Chang',
    cashierId: 3,
    notes: 'Allergy relief & anti-inflammatory',
    items: [
      {
        id: 3,
        saleId: 3,
        medicineId: 8,
        medicineName: 'Cetirizine 10mg',
        dosageForm: 'Tablet',
        quantity: 1,
        unitPrice: 9.50,
        subtotal: 9.50,
        batchAllocations: [
          {
            batchId: 12,
            batchNumber: 'CET-2026-01',
            quantity: 1,
            unitPrice: 9.50,
            expiryDate: '2027-09-15'
          }
        ]
      },
      {
        id: 4,
        saleId: 3,
        medicineId: 5,
        medicineName: 'Ibuprofen 400mg',
        dosageForm: 'Tablet',
        quantity: 1,
        unitPrice: 11.20,
        subtotal: 11.20,
        batchAllocations: [
          {
            batchId: 7,
            batchNumber: 'IBU-2026-44',
            quantity: 1,
            unitPrice: 11.20,
            expiryDate: '2027-12-31'
          }
        ]
      }
    ],
    createdAt: '2026-09-30 11:10:00'
  }
];

export const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: 1,
    purchaseNumber: 'PO-2026-0104',
    supplierId: 1,
    supplierName: 'Pfizer Distribution Hub',
    orderDate: '2026-09-10',
    deliveryDate: '2026-09-15',
    status: 'Received',
    subtotal: 1250.00,
    taxAmount: 62.50,
    grandTotal: 1312.50,
    paidAmount: 1312.50,
    paymentStatus: 'Paid',
    paymentMethod: 'Bank Transfer',
    receivedBy: 'Elena Rostova',
    createdAt: '2026-09-10 09:30:00',
    items: [
      {
        id: 1,
        medicineId: 1,
        medicineName: 'Amoxicillin 500mg',
        batchNumber: 'AMX-2026-B2',
        mfgDate: '2026-03-01',
        expiryDate: '2027-04-15',
        quantity: 100,
        purchasePrice: 12.50,
        sellingPrice: 22.00,
        totalPrice: 1250.00
      }
    ]
  },
  {
    id: 2,
    purchaseNumber: 'PO-2026-0105',
    supplierId: 4,
    supplierName: 'Cipla Healthcare Logistics',
    orderDate: '2026-09-20',
    deliveryDate: '2026-09-25',
    status: 'Received',
    subtotal: 816.00,
    taxAmount: 40.80,
    grandTotal: 856.80,
    paidAmount: 0.00,
    paymentStatus: 'Unpaid',
    paymentMethod: 'Credit Terms (Net 30)',
    notes: 'Outstanding on supplier ledger',
    receivedBy: 'Elena Rostova',
    createdAt: '2026-09-20 14:00:00',
    items: [
      {
        id: 2,
        medicineId: 6,
        medicineName: 'Metformin HCl 500mg',
        batchNumber: 'MET-2026-N1',
        mfgDate: '2026-03-10',
        expiryDate: '2028-03-10',
        quantity: 120,
        purchasePrice: 6.80,
        sellingPrice: 13.50,
        totalPrice: 816.00
      }
    ]
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 1,
    medicineId: 1,
    medicineName: 'Amoxicillin 500mg',
    batchId: 2,
    batchNumber: 'AMX-2026-B2',
    type: 'purchase',
    quantity: 100,
    balanceBefore: 18,
    balanceAfter: 118,
    referenceType: 'PO-2026-0104',
    referenceId: '1',
    reason: 'Goods receiving from Pfizer Logistics',
    performedBy: 'Elena Rostova',
    createdAt: '2026-09-15 11:00:00'
  },
  {
    id: 2,
    medicineId: 9,
    medicineName: 'Salbutamol Inhaler 100mcg',
    batchId: 13,
    batchNumber: 'SAL-2026-V1',
    type: 'sale',
    quantity: -1,
    balanceBefore: 22,
    balanceAfter: 21,
    referenceType: 'INV-2026-0041',
    referenceId: '1',
    reason: 'Prescription sale for David Clark',
    performedBy: 'Michael Chang',
    createdAt: '2026-09-18 14:45:00'
  },
  {
    id: 3,
    medicineId: 4,
    medicineName: 'Paracetamol 500mg',
    batchId: 6,
    batchNumber: 'PAR-2026-09',
    type: 'sale',
    quantity: -2,
    balanceBefore: 167,
    balanceAfter: 165,
    referenceType: 'INV-2026-0042',
    referenceId: '2',
    reason: 'Counter sale',
    performedBy: 'Michael Chang',
    createdAt: '2026-09-29 16:15:00'
  },
  {
    id: 4,
    medicineId: 8,
    medicineName: 'Cetirizine 10mg',
    batchId: 12,
    batchNumber: 'CET-2026-01',
    type: 'sale',
    quantity: -1,
    balanceBefore: 39,
    balanceAfter: 38,
    referenceType: 'INV-2026-0043',
    referenceId: '3',
    reason: 'POS sale for Fatima Al-Mansoor',
    performedBy: 'Michael Chang',
    createdAt: '2026-09-30 11:10:00'
  },
  {
    id: 5,
    medicineId: 5,
    medicineName: 'Ibuprofen 400mg',
    batchId: 7,
    batchNumber: 'IBU-2026-44',
    type: 'sale',
    quantity: -1,
    balanceBefore: 55,
    balanceAfter: 54,
    referenceType: 'INV-2026-0043',
    referenceId: '3',
    reason: 'POS sale for Fatima Al-Mansoor',
    performedBy: 'Michael Chang',
    createdAt: '2026-09-30 11:10:00'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 1,
    category: 'Electricity',
    amount: 340.00,
    expenseDate: '2026-09-28',
    description: 'Pharmacy cold-chain & main AC electricity billing',
    paymentMethod: 'Bank Transfer',
    recordedBy: 'Dr. Sarah Jenkins',
    referenceReceipt: 'BILL-ELEC-0928',
    createdAt: '2026-09-28 10:00:00'
  },
  {
    id: 2,
    category: 'Supplies',
    amount: 85.00,
    expenseDate: '2026-09-29',
    description: 'Thermal receipt paper rolls & child-resistant prescription bottles',
    paymentMethod: 'Card',
    recordedBy: 'Elena Rostova',
    referenceReceipt: 'REC-SUP-4412',
    createdAt: '2026-09-29 15:30:00'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user: 'Dr. Sarah Jenkins',
    role: 'admin',
    action: 'SYSTEM_BOOT',
    entity: 'System',
    entityId: '0',
    description: 'Pharmacy operations database initialized with normalized schema & FEFO constraints.',
    ipAddress: '127.0.0.1',
    timestamp: '2026-09-30 08:30:00'
  },
  {
    id: 2,
    user: 'Elena Rostova',
    role: 'inventory_manager',
    action: 'PURCHASE_RECEIVE',
    entity: 'PurchaseOrder',
    entityId: 'PO-2026-0105',
    description: 'Received 120 units of Metformin HCl 500mg (Batch MET-2026-N1) from Cipla.',
    ipAddress: '192.168.1.15',
    timestamp: '2026-09-25 14:15:00'
  },
  {
    id: 3,
    user: 'Michael Chang',
    role: 'cashier',
    action: 'SALE_COMPLETED',
    entity: 'Sale',
    entityId: 'INV-2026-0043',
    description: 'Completed sale of Cetirizine 10mg & Ibuprofen 400mg via Mobile Money.',
    ipAddress: '192.168.1.18',
    timestamp: '2026-09-30 11:10:00'
  }
];

export interface PharmacyDatabaseState {
  currentUser: User;
  users: User[];
  categories: Category[];
  suppliers: Supplier[];
  medicines: Medicine[];
  batches: MedicineBatch[];
  stockMovements: StockMovement[];
  customers: Customer[];
  prescriptions: Prescription[];
  sales: Sale[];
  purchases: PurchaseOrder[];
  customerReturns: CustomerReturn[];
  supplierReturns: SupplierReturn[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}

export class PharmacyDatabase {
  private state: PharmacyDatabaseState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): PharmacyDatabaseState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch {
      // Fallback
    }

    const defaultState: PharmacyDatabaseState = {
      currentUser: INITIAL_USERS[0], // Admin by default
      users: INITIAL_USERS,
      categories: INITIAL_CATEGORIES,
      suppliers: [],
      medicines: [],
      batches: [],
      stockMovements: [],
      customers: [],
      prescriptions: [],
      sales: [],
      purchases: [],
      customerReturns: [],
      supplierReturns: [],
      expenses: [],
      auditLogs: []
    };

    this.saveToStorage(defaultState);
    return defaultState;
  }

  public async syncWithBackend(): Promise<boolean> {
    try {
      const res = await api.getState();
      if (res && res.success && res.data) {
        const d = res.data;
        this.state = {
          currentUser: this.state.currentUser || d.currentUser || INITIAL_USERS[0],
          users: d.users && d.users.length ? d.users : INITIAL_USERS,
          categories: d.categories && d.categories.length ? d.categories : this.state.categories,
          suppliers: d.suppliers || [],
          medicines: d.medicines || [],
          batches: d.batches || [],
          stockMovements: d.stockMovements || [],
          customers: d.customers || [],
          prescriptions: d.prescriptions || [],
          sales: d.sales || [],
          purchases: d.purchases || [],
          customerReturns: d.customerReturns || [],
          supplierReturns: d.supplierReturns || [],
          expenses: d.expenses || [],
          auditLogs: d.auditLogs || []
        };
        this.save();
        return true;
      }
    } catch (e) {
      console.warn('Backend sync failed, using cached state:', e);
    }
    return false;
  }

  private saveToStorage(state: PharmacyDatabaseState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  public getState(): PharmacyDatabaseState {
    return this.state;
  }

  public save() {
    this.saveToStorage(this.state);
  }

  public resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadFromStorage();
    this.addAuditLog('DATABASE_RESET', 'System', '0', 'Database was reset to clean state.');
    this.save();
  }

  // --- Auth & Role Switching ---
  public getCurrentUser(): User {
    return this.state.currentUser;
  }

  public setCurrentUserObj(user: User) {
    this.state.currentUser = user;
    this.save();
  }

  public setCurrentUser(role: RoleName) {
    const user = this.state.users.find(u => u.role === role) || this.state.users[0];
    this.state.currentUser = user;
    this.addAuditLog('ROLE_SWITCH', 'User', user.id.toString(), `Active operator switched to ${user.name} (${user.roleTitle})`);
    this.save();
  }

  public checkPermission(allowedRoles: RoleName[]): boolean {
    return allowedRoles.includes(this.state.currentUser.role);
  }

  // --- Audit Logging ---
  public addAuditLog(action: string, entity: string, entityId: string, description: string) {
    const newLog: AuditLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      user: this.state.currentUser.name,
      role: this.state.currentUser.role,
      action,
      entity,
      entityId,
      description,
      ipAddress: '127.0.0.1 (Local)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.state.auditLogs.unshift(newLog);
  }

  // --- Inventory & Stock Calculation Helpers ---
  public getMedicineStock(medicineId: number) {
    const batches = this.state.batches.filter(b => b.medicineId === medicineId);
    let totalStock = 0;
    let validStock = 0;
    let expiredStock = 0;
    let nearExpiry30 = 0;

    for (const b of batches) {
      totalStock += b.currentQuantity;
      const status = getBatchExpiryStatus(b.expiryDate);
      if (status === 'expired') {
        expiredStock += b.currentQuantity;
      } else {
        validStock += b.currentQuantity;
        if (status === 'near_expiry_30') {
          nearExpiry30 += b.currentQuantity;
        }
      }
    }

    return {
      totalStock,
      validStock,
      expiredStock,
      nearExpiry30,
      batches
    };
  }

  public getBatchesWithStatus(): MedicineBatch[] {
    return this.state.batches.map(b => {
      const med = this.state.medicines.find(m => m.id === b.medicineId);
      const supp = this.state.suppliers.find(s => s.id === b.supplierId);
      const days = calculateDaysToExpiry(b.expiryDate);
      const status = getBatchExpiryStatus(b.expiryDate);
      return {
        ...b,
        medicineName: med ? med.name : 'Unknown Medicine',
        supplierName: supp ? supp.name : 'Unknown Supplier',
        daysToExpiry: days,
        status
      };
    });
  }

  // --- Transactions & POS Sales ---
  public async processSale(params: {
    customerId?: number;
    customerName: string;
    prescriptionId?: number;
    prescriptionNumber?: string;
    items: { medicineId: number; quantity: number }[];
    discountPercentage: number;
    taxRate: number;
    paymentMethod: any;
    amountReceived: number;
    notes?: string;
  }): Promise<{ success: boolean; sale?: Sale; error?: string }> {
    if (!this.checkPermission(['admin', 'pharmacist', 'cashier'])) {
      return { success: false, error: 'Unauthorized: Current role does not have POS checkout permission.' };
    }

    if (params.items.length === 0) {
      return { success: false, error: 'Cannot process empty cart.' };
    }

    // ATOMIC TRANSACTION: Step 1 Validate all items against FEFO stock
    const saleItems: any[] = [];
    const batchDeductions: { batchId: number; qty: number }[] = [];
    let subtotal = 0;

    for (const item of params.items) {
      const med = this.state.medicines.find(m => m.id === item.medicineId);
      if (!med) {
        return { success: false, error: `Medicine ID ${item.medicineId} not found.` };
      }

      // Check prescription requirement
      if (med.prescriptionRequired && !params.prescriptionId) {
        // Warning note: allow override if cashier confirms, or check if entered
      }

      const medBatches = this.state.batches.filter(b => b.medicineId === med.id);
      const fefoResult = allocateBatchesFefo(medBatches, item.quantity, med.name);

      if (!fefoResult.success) {
        return { success: false, error: fefoResult.error };
      }

      const itemSubtotal = item.quantity * med.sellingPrice;
      subtotal += itemSubtotal;

      saleItems.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        saleId: 0,
        medicineId: med.id,
        medicineName: med.name,
        dosageForm: med.dosageForm,
        quantity: item.quantity,
        unitPrice: med.sellingPrice,
        subtotal: itemSubtotal,
        batchAllocations: fefoResult.allocations
      });

      for (const alloc of fefoResult.allocations) {
        batchDeductions.push({ batchId: alloc.batchId, qty: alloc.quantity });
      }
    }

    const discountAmount = Number(((subtotal * params.discountPercentage) / 100).toFixed(2));
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Number((taxableAmount * params.taxRate).toFixed(2));
    const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

    if (params.paymentMethod === 'Cash' && params.amountReceived < grandTotal) {
      return { success: false, error: `Insufficient cash received. Grand total is $${grandTotal.toFixed(2)}, received $${params.amountReceived.toFixed(2)}.` };
    }

    const changeGiven = params.paymentMethod === 'Cash' 
      ? Number((params.amountReceived - grandTotal).toFixed(2)) 
      : 0.00;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.state.sales.length + 1044).padStart(4, '0')}`;
    const saleId = Date.now();

    // Commit changes to batches & stock movements
    for (const deduction of batchDeductions) {
      const batch = this.state.batches.find(b => b.id === deduction.batchId);
      if (batch) {
        const med = this.state.medicines.find(m => m.id === batch.medicineId);
        const prevMedStock = this.getMedicineStock(batch.medicineId).totalStock;

        batch.currentQuantity -= deduction.qty;

        // Record stock movement
        const movement: StockMovement = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          medicineId: batch.medicineId,
          medicineName: med ? med.name : 'Medicine',
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          type: 'sale',
          quantity: -deduction.qty,
          balanceBefore: prevMedStock,
          balanceAfter: prevMedStock - deduction.qty,
          referenceType: invoiceNumber,
          referenceId: saleId.toString(),
          reason: `Sale ${invoiceNumber} to ${params.customerName}`,
          performedBy: this.state.currentUser.name,
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        this.state.stockMovements.unshift(movement);
      }
    }

    // Update prescription if linked
    if (params.prescriptionId) {
      const rx = this.state.prescriptions.find(p => p.id === params.prescriptionId);
      if (rx) {
        let allDispensed = true;
        for (const rxItem of rx.items) {
          const soldItem = params.items.find(i => i.medicineId === rxItem.medicineId);
          if (soldItem) {
            rxItem.dispensedQuantity += soldItem.quantity;
          }
          if (rxItem.dispensedQuantity < rxItem.prescribedQuantity) {
            allDispensed = false;
          }
        }
        rx.status = allDispensed ? 'Dispensed' : 'Partially Dispensed';
        rx.dispensedBy = this.state.currentUser.name;
        rx.dispensedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }
    }

    // Update customer spend/balance if registered
    if (params.customerId) {
      const cust = this.state.customers.find(c => c.id === params.customerId);
      if (cust) {
        cust.totalSpent += grandTotal;
        if (params.paymentMethod === 'Credit') {
          cust.outstandingBalance += grandTotal;
        }
      }
    }

    const newSale: Sale = {
      id: saleId,
      invoiceNumber,
      customerId: params.customerId,
      customerName: params.customerName || 'Walk-in Customer',
      prescriptionId: params.prescriptionId,
      prescriptionNumber: params.prescriptionNumber,
      subtotal,
      discountPercentage: params.discountPercentage,
      discountAmount,
      taxRate: params.taxRate,
      taxAmount,
      grandTotal,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === 'Credit' ? 'Credit' : 'Paid',
      amountReceived: params.paymentMethod === 'Credit' ? 0.00 : params.amountReceived,
      changeGiven,
      cashierName: this.state.currentUser.name,
      cashierId: this.state.currentUser.id,
      notes: params.notes,
      items: saleItems.map(si => ({ ...si, saleId })),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    this.state.sales.unshift(newSale);
    this.addAuditLog('SALE_COMPLETED', 'Sale', invoiceNumber, `Sale completed for $${grandTotal.toFixed(2)} (${params.items.length} items, ${params.paymentMethod})`);
    this.save();

    try {
      const res = await api.createSale({
        items: params.items.map(it => ({
          medicine_id: it.medicineId,
          quantity: it.quantity,
          unit_price: this.state.medicines.find(m => m.id === it.medicineId)?.sellingPrice || 0
        })),
        customer_id: params.customerId,
        customer_name: params.customerName,
        prescription_id: params.prescriptionId,
        discount_percentage: params.discountPercentage,
        payment_method: params.paymentMethod,
        amount_received: params.amountReceived,
        notes: params.notes
      });
      await this.syncWithBackend();
      const saved = this.state.sales.find(s => s.id === res.saleId) || newSale;
      return { success: true, sale: saved };
    } catch (e: any) {
      return { success: false, error: e.message || 'Checkout failed in database.' };
    }
  }

  // --- Purchase Receiving ---
  public async receivePurchaseOrder(params: {
    supplierId: number;
    paymentMethod: string;
    paidAmount: number;
    notes?: string;
    items: {
      medicineId: number;
      batchNumber: string;
      mfgDate: string;
      expiryDate: string;
      quantity: number;
      purchasePrice: number;
      sellingPrice: number;
    }[];
  }): Promise<{ success: boolean; purchase?: PurchaseOrder; error?: string }> {
    if (!this.checkPermission(['admin', 'inventory_manager'])) {
      return { success: false, error: 'Unauthorized: Current role does not have permission to receive stock purchases.' };
    }

    if (params.items.length === 0) {
      return { success: false, error: 'Cannot receive empty purchase order.' };
    }

    const supp = this.state.suppliers.find(s => s.id === params.supplierId);
    if (!supp) {
      return { success: false, error: 'Supplier not found.' };
    }

    // Validate dates
    for (const item of params.items) {
      const days = calculateDaysToExpiry(item.expiryDate);
      if (days <= 0) {
        return { success: false, error: `Cannot receive expired batch (${item.batchNumber}) with expiry date ${item.expiryDate}.` };
      }
      if (item.quantity <= 0) {
        return { success: false, error: `Invalid quantity for batch ${item.batchNumber}.` };
      }
    }

    const purchaseNumber = `PO-${new Date().getFullYear()}-${String(this.state.purchases.length + 106).padStart(4, '0')}`;
    const purchaseId = Date.now();
    let subtotal = 0;
    const poItems: any[] = [];

    for (const item of params.items) {
      const med = this.state.medicines.find(m => m.id === item.medicineId);
      const totalItemPrice = item.quantity * item.purchasePrice;
      subtotal += totalItemPrice;

      poItems.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        medicineId: item.medicineId,
        medicineName: med ? med.name : 'Medicine',
        batchNumber: item.batchNumber,
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        totalPrice: totalItemPrice
      });

      // Create new batch
      const newBatch: MedicineBatch = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        medicineId: item.medicineId,
        medicineName: med ? med.name : 'Medicine',
        batchNumber: item.batchNumber,
        initialQuantity: item.quantity,
        currentQuantity: item.quantity,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
        supplierId: supp.id,
        supplierName: supp.name,
        receivedDate: new Date().toISOString().substring(0, 10),
        locationRack: 'Main Pharmacy Store'
      };
      this.state.batches.push(newBatch);

      // Record stock movement
      const prevStock = med ? this.getMedicineStock(med.id).totalStock : 0;
      const movement: StockMovement = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        medicineId: item.medicineId,
        medicineName: med ? med.name : 'Medicine',
        batchId: newBatch.id,
        batchNumber: newBatch.batchNumber,
        type: 'purchase',
        quantity: item.quantity,
        balanceBefore: prevStock,
        balanceAfter: prevStock + item.quantity,
        referenceType: purchaseNumber,
        referenceId: purchaseId.toString(),
        reason: `Goods receipt from ${supp.name}`,
        performedBy: this.state.currentUser.name,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      this.state.stockMovements.unshift(movement);

      // Update medicine pricing if sellingPrice changed
      if (med && item.sellingPrice > 0) {
        med.purchasePrice = item.purchasePrice;
        med.sellingPrice = item.sellingPrice;
        med.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }
    }

    const taxAmount = Number((subtotal * 0.05).toFixed(2));
    const grandTotal = Number((subtotal + taxAmount).toFixed(2));
    const unpaid = grandTotal - params.paidAmount;

    // Update supplier ledger
    supp.totalPurchases += grandTotal;
    if (unpaid > 0) {
      supp.outstandingBalance += unpaid;
    }

    const po: PurchaseOrder = {
      id: purchaseId,
      purchaseNumber,
      supplierId: supp.id,
      supplierName: supp.name,
      orderDate: new Date().toISOString().substring(0, 10),
      deliveryDate: new Date().toISOString().substring(0, 10),
      status: 'Received',
      subtotal,
      taxAmount,
      grandTotal,
      paidAmount: params.paidAmount,
      paymentStatus: params.paidAmount >= grandTotal ? 'Paid' : (params.paidAmount > 0 ? 'Partial' : 'Unpaid'),
      paymentMethod: params.paymentMethod,
      notes: params.notes,
      receivedBy: this.state.currentUser.name,
      items: poItems,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    this.state.purchases.unshift(po);
    this.addAuditLog('PURCHASE_RECEIVE', 'PurchaseOrder', purchaseNumber, `Received purchase order ${purchaseNumber} from ${supp.name} totaling $${grandTotal.toFixed(2)}.`);
    this.save();

    try {
      const res = await api.savePurchase({
        supplierId: supp.id,
        items: params.items,
        paidAmount: params.paidAmount,
        paymentMethod: params.paymentMethod,
        notes: params.notes
      });
      await this.syncWithBackend();
      const saved = this.state.purchases.find(p => p.id === res.purchaseId) || po;
      return { success: true, purchase: saved };
    } catch (e: any) {
      return { success: false, error: e.message || 'Goods receiving failed in database.' };
    }
  }

  // --- Customer Returns ---
  public processCustomerReturn(params: {
    saleId: number;
    medicineId: number;
    batchId: number;
    quantity: number;
    disposition: 'Restock' | 'Damage/Waste';
    reason: string;
  }): { success: boolean; returnRecord?: CustomerReturn; error?: string } {
    if (!this.checkPermission(['admin', 'pharmacist'])) {
      return { success: false, error: 'Unauthorized: Returns must be authorized by a Pharmacist or Admin.' };
    }

    const sale = this.state.sales.find(s => s.id === params.saleId);
    if (!sale) return { success: false, error: 'Sale record not found.' };

    const saleItem = sale.items.find(i => i.medicineId === params.medicineId);
    if (!saleItem) return { success: false, error: 'Medicine was not part of this sale.' };

    if (params.quantity > saleItem.quantity) {
      return { success: false, error: `Cannot return ${params.quantity} units; sale only contained ${saleItem.quantity} units.` };
    }

    const batch = this.state.batches.find(b => b.id === params.batchId);
    if (!batch) return { success: false, error: 'Batch record not found.' };

    const refundAmount = Number((params.quantity * saleItem.unitPrice).toFixed(2));
    const returnNumber = `RET-${new Date().getFullYear()}-${String(this.state.customerReturns.length + 101).padStart(4, '0')}`;

    if (params.disposition === 'Restock') {
      const days = calculateDaysToExpiry(batch.expiryDate);
      if (days <= 0) {
        return { success: false, error: 'Cannot restock into active inventory because the batch is expired!' };
      }
      batch.currentQuantity += params.quantity;

      const med = this.state.medicines.find(m => m.id === params.medicineId);
      const prevStock = med ? this.getMedicineStock(med.id).totalStock : 0;

      const movement: StockMovement = {
        id: Date.now(),
        medicineId: params.medicineId,
        medicineName: saleItem.medicineName,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        type: 'return',
        quantity: params.quantity,
        balanceBefore: prevStock,
        balanceAfter: prevStock + params.quantity,
        referenceType: returnNumber,
        referenceId: sale.invoiceNumber,
        reason: `Customer return restocked: ${params.reason}`,
        performedBy: this.state.currentUser.name,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      this.state.stockMovements.unshift(movement);
    } else {
      // Discarded / Waste
      const movement: StockMovement = {
        id: Date.now(),
        medicineId: params.medicineId,
        medicineName: saleItem.medicineName,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        type: 'damage',
        quantity: 0,
        balanceBefore: batch.currentQuantity,
        balanceAfter: batch.currentQuantity,
        referenceType: returnNumber,
        referenceId: sale.invoiceNumber,
        reason: `Customer return damaged/discarded: ${params.reason}`,
        performedBy: this.state.currentUser.name,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      this.state.stockMovements.unshift(movement);
    }

    const returnRec: CustomerReturn = {
      id: Date.now(),
      returnNumber,
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerId: sale.customerId,
      customerName: sale.customerName,
      medicineId: params.medicineId,
      medicineName: saleItem.medicineName,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: params.quantity,
      refundAmount,
      disposition: params.disposition,
      reason: params.reason,
      processedBy: this.state.currentUser.name,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    this.state.customerReturns.unshift(returnRec);
    this.addAuditLog('CUSTOMER_RETURN', 'CustomerReturn', returnNumber, `Processed return ${returnNumber} for invoice ${sale.invoiceNumber} ($${refundAmount.toFixed(2)}, ${params.disposition})`);
    this.save();

    return { success: true, returnRecord: returnRec };
  }

  // --- Stock Adjustments & Quarantine ---
  public async adjustStock(params: {
    batchId: number;
    newQuantity: number;
    reason: string;
    type: 'adjustment' | 'damage' | 'expiration';
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.checkPermission(['admin', 'inventory_manager'])) {
      return { success: false, error: 'Unauthorized: Current role cannot make stock adjustments.' };
    }

    const batch = this.state.batches.find(b => b.id === params.batchId);
    if (!batch) return { success: false, error: 'Batch not found.' };

    if (params.newQuantity < 0) {
      return { success: false, error: 'Stock cannot become negative.' };
    }

    try {
      await api.adjustBatch({
        batchId: params.batchId,
        newQuantity: params.newQuantity,
        reason: params.reason
      });
      await this.syncWithBackend();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Stock adjustment failed in database.' };
    }
  }

  // --- Add/Edit Medicine ---
  public async saveMedicine(med: Partial<Medicine>): Promise<{ success: boolean; medicine?: Medicine; error?: string }> {
    if (!this.checkPermission(['admin', 'pharmacist', 'inventory_manager'])) {
      return { success: false, error: 'Unauthorized: Role cannot create or modify medicines.' };
    }

    if (!med.name || !med.sku || !med.categoryId) {
      return { success: false, error: 'Medicine name, SKU, and Category are required.' };
    }

    try {
      const isEdit = !!(med.id && med.id < 1000000000);
      const res = await api.saveMedicine({
        ...med,
        id: isEdit ? med.id : undefined
      });
      await this.syncWithBackend();
      const updated = this.state.medicines.find(m => m.id === (res.id || med.id)) || this.state.medicines[0];
      return { success: true, medicine: updated };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to save medicine to database.' };
    }
  }

  // --- Expenses ---
  public async addExpense(params: Omit<Expense, 'id' | 'createdAt'>): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    if (!this.checkPermission(['admin'])) {
      return { success: false, error: 'Unauthorized: Only administrators can record operational expenses.' };
    }

    try {
      const res = await api.saveExpense(params);
      await this.syncWithBackend();
      const newExp = this.state.expenses.find(e => e.id === res.id) || this.state.expenses[0];
      return { success: true, expense: newExp };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to record expense in database.' };
    }
  }

  // --- Prescriptions ---
  public async createPrescription(rx: Omit<Prescription, 'id'>): Promise<{ success: boolean; prescription?: Prescription; error?: string }> {
    if (!this.checkPermission(['admin', 'pharmacist'])) {
      return { success: false, error: 'Unauthorized: Only Pharmacists or Admins can register medical prescriptions.' };
    }

    try {
      const res = await api.savePrescription({
        customerId: rx.customerId,
        customerName: rx.customerName,
        doctorName: rx.doctorName,
        doctorClinic: rx.doctorClinic,
        doctorLicense: rx.doctorLicense,
        notes: rx.notes,
        items: rx.items
      });
      await this.syncWithBackend();
      const newRx = this.state.prescriptions.find(p => p.id === res.id) || this.state.prescriptions[0];
      return { success: true, prescription: newRx };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to register prescription in database.' };
    }
  }

  // --- Customers & Suppliers ---
  public async saveCustomer(cust: Partial<Customer>): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    if (!cust.name || !cust.phone) {
      return { success: false, error: 'Customer name and phone number are required.' };
    }

    try {
      const isEdit = !!(cust.id && cust.id < 1000000000);
      const res = await api.saveCustomer({
        ...cust,
        id: isEdit ? cust.id : undefined
      });
      await this.syncWithBackend();
      const saved = this.state.customers.find(c => c.id === (res.id || cust.id)) || this.state.customers[0];
      return { success: true, customer: saved };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to save customer profile in database.' };
    }
  }

  public async saveSupplier(supp: Partial<Supplier>): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
    if (!this.checkPermission(['admin', 'inventory_manager'])) {
      return { success: false, error: 'Unauthorized: Cannot manage suppliers.' };
    }

    if (!supp.name || !supp.company) {
      return { success: false, error: 'Supplier name and company are required.' };
    }

    try {
      const isEdit = !!(supp.id && supp.id < 1000000000);
      const res = await api.saveSupplier({
        ...supp,
        id: isEdit ? supp.id : undefined
      });
      await this.syncWithBackend();
      const saved = this.state.suppliers.find(s => s.id === (res.id || supp.id)) || this.state.suppliers[0];
      return { success: true, supplier: saved };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to save supplier profile in database.' };
    }
  }

  // --- Financial & Dashboard Aggregates ---
  public getDashboardMetrics() {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todaySales = this.state.sales
      .filter(s => s.createdAt.startsWith(todayStr))
      .reduce((sum, s) => sum + s.grandTotal, 0);

    const todayPurchases = this.state.purchases
      .filter(p => p.createdAt.startsWith(todayStr))
      .reduce((sum, p) => sum + p.grandTotal, 0);

    const todayExpenses = this.state.expenses
      .filter(e => e.expenseDate === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let expiredCount = 0;
    let expiring30Count = 0;

    for (const med of this.state.medicines) {
      const stock = this.getMedicineStock(med.id);
      if (stock.totalStock <= med.minStockLevel) {
        lowStockCount++;
      }
    }

    for (const b of this.state.batches) {
      if (b.currentQuantity > 0) {
        totalInventoryValue += b.currentQuantity * b.purchasePrice;
        const status = getBatchExpiryStatus(b.expiryDate);
        if (status === 'expired') expiredCount++;
        else if (status === 'near_expiry_30') expiring30Count++;
      }
    }

    const pendingPrescriptionsCount = this.state.prescriptions.filter(p => p.status === 'Pending').length;
    const totalSupplierPayables = this.state.suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);
    const totalCustomerReceivables = this.state.customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

    // Net sales calculation: Total sales - returns
    const allSalesTotal = this.state.sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const allReturnsTotal = this.state.customerReturns.reduce((sum, r) => sum + r.refundAmount, 0);
    const netSales = allSalesTotal - allReturnsTotal;

    return {
      todaySales,
      todayPurchases,
      todayExpenses,
      netSales,
      totalInventoryValue,
      medicinesCount: this.state.medicines.filter(m => m.status === 'active').length,
      lowStockCount,
      expiredCount,
      expiring30Count,
      pendingPrescriptionsCount,
      totalSupplierPayables,
      totalCustomerReceivables
    };
  }
}

export const pharmacyDb = new PharmacyDatabase();
