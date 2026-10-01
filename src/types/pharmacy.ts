export type RoleName = 'admin' | 'pharmacist' | 'cashier' | 'inventory_manager';

export interface User {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  roleTitle: string;
  avatarUrl?: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export type DosageForm = 
  | 'Tablet' 
  | 'Capsule' 
  | 'Syrup' 
  | 'Injection' 
  | 'Cream' 
  | 'Ointment' 
  | 'Drops' 
  | 'Inhaler'
  | 'Suspension';

export interface Category {
  id: number;
  name: string;
  description: string;
  code: string;
  itemCount?: number;
}

export interface Manufacturer {
  id: number;
  name: string;
  country: string;
  contactEmail: string;
}

export interface Supplier {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  taxNumber: string;
  paymentTerms: string; // e.g. 'Net 30', 'Net 15', 'Immediate'
  outstandingBalance: number;
  totalPurchases: number;
  status: 'active' | 'inactive';
}

export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  brandName: string;
  sku: string;
  barcode: string;
  categoryId: number;
  categoryName: string;
  manufacturer: string;
  dosageForm: DosageForm;
  strength: string; // e.g. "500mg", "10mg/5ml"
  unit: string; // "Strip", "Bottle", "Box", "Vial", "Tube"
  purchasePrice: number;
  sellingPrice: number;
  minStockLevel: number;
  prescriptionRequired: boolean;
  description: string;
  status: 'active' | 'archived';
  storageCondition?: string;
  createdAt: string;
  updatedAt: string;
}

export type BatchExpiryStatus = 'expired' | 'near_expiry_30' | 'near_expiry_60' | 'near_expiry_90' | 'normal';

export interface MedicineBatch {
  id: number;
  medicineId: number;
  medicineName?: string;
  batchNumber: string;
  initialQuantity: number;
  currentQuantity: number;
  purchasePrice: number;
  sellingPrice: number;
  mfgDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  supplierId: number;
  supplierName?: string;
  receivedDate: string;
  locationRack?: string;
  status?: BatchExpiryStatus;
  daysToExpiry?: number;
}

export type StockMovementType = 
  | 'purchase' 
  | 'sale' 
  | 'return' 
  | 'adjustment' 
  | 'damage' 
  | 'expiration' 
  | 'transfer';

export interface StockMovement {
  id: number;
  medicineId: number;
  medicineName: string;
  batchId?: number;
  batchNumber?: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string; // e.g., 'SALE-1002', 'PO-882', 'ADJ-12'
  referenceId?: string;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  medicalNotes?: string;
  allergies?: string;
  outstandingBalance: number;
  totalSpent: number;
  createdAt: string;
}

export type PrescriptionStatus = 'Pending' | 'Partially Dispensed' | 'Dispensed' | 'Cancelled';

export interface PrescriptionItem {
  id: number;
  prescriptionId: number;
  medicineId: number;
  medicineName: string;
  dosage: string; // e.g. "1 Tablet"
  frequency: string; // e.g. "TDS (3 times daily)"
  duration: string; // e.g. "7 days"
  prescribedQuantity: number;
  dispensedQuantity: number;
  instructions: string;
}

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  doctorName: string;
  doctorClinic?: string;
  doctorLicense?: string;
  prescriptionDate: string;
  status: PrescriptionStatus;
  notes?: string;
  dispensedBy?: string;
  dispensedAt?: string;
  items: PrescriptionItem[];
}

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile Money' | 'Credit' | 'Bank Transfer';

export interface BatchAllocation {
  batchId: number;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  expiryDate: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  medicineId: number;
  medicineName: string;
  dosageForm: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  batchAllocations: BatchAllocation[];
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerId?: number;
  customerName: string;
  prescriptionId?: number;
  prescriptionNumber?: string;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxRate: number; // e.g. 0.05
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Partial' | 'Credit';
  amountReceived: number;
  changeGiven: number;
  cashierName: string;
  cashierId: number;
  notes?: string;
  items: SaleItem[];
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  deliveryDate?: string;
  status: 'Received' | 'Pending' | 'Cancelled';
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  paymentMethod: string;
  notes?: string;
  receivedBy?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface CustomerReturn {
  id: number;
  returnNumber: string;
  saleId: number;
  invoiceNumber: string;
  customerId?: number;
  customerName: string;
  medicineId: number;
  medicineName: string;
  batchId: number;
  batchNumber: string;
  quantity: number;
  refundAmount: number;
  disposition: 'Restock' | 'Damage/Waste';
  reason: string;
  processedBy: string;
  createdAt: string;
}

export interface SupplierReturn {
  id: number;
  returnNumber: string;
  supplierId: number;
  supplierName: string;
  medicineId: number;
  medicineName: string;
  batchId: number;
  batchNumber: string;
  quantity: number;
  creditAmount: number;
  reason: string;
  processedBy: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Electricity' 
  | 'Rent' 
  | 'Transportation' 
  | 'Salaries' 
  | 'Maintenance' 
  | 'Supplies' 
  | 'Software & Licences'
  | 'Other';

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  description: string;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  referenceReceipt?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  linkTab?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  user: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  ipAddress: string;
  timestamp: string;
}
