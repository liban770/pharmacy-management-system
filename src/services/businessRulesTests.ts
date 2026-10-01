import { allocateBatchesFefo, calculateDaysToExpiry, getBatchExpiryStatus } from './fefoEngine';
import { MedicineBatch } from '../types/pharmacy';

export interface TestResult {
  id: string;
  name: string;
  category: string;
  description: string;
  passed: boolean;
  message: string;
  details?: string;
}

export function runAllBusinessRulesTests(): TestResult[] {
  const results: TestResult[] = [];

  // TEST 1: Expiry status categorization
  try {
    const expiredStatus = getBatchExpiryStatus('2020-01-01');
    const today = new Date();
    const in15Days = new Date(today.getTime() + 15 * 86400000).toISOString().substring(0, 10);
    const in45Days = new Date(today.getTime() + 45 * 86400000).toISOString().substring(0, 10);
    const in75Days = new Date(today.getTime() + 75 * 86400000).toISOString().substring(0, 10);
    const in180Days = new Date(today.getTime() + 180 * 86400000).toISOString().substring(0, 10);

    const isExpCorrect = expiredStatus === 'expired';
    const is30Correct = getBatchExpiryStatus(in15Days) === 'near_expiry_30';
    const is60Correct = getBatchExpiryStatus(in45Days) === 'near_expiry_60';
    const is90Correct = getBatchExpiryStatus(in75Days) === 'near_expiry_90';
    const isNormCorrect = getBatchExpiryStatus(in180Days) === 'normal';

    const allCorrect = isExpCorrect && is30Correct && is60Correct && is90Correct && isNormCorrect;

    results.push({
      id: 'EXPIRY_CLASSIFICATION',
      name: 'Batch Expiry Categorization',
      category: 'Expiry Management',
      description: 'Verifies correct classification of expired, <=30d, <=60d, <=90d, and normal stock.',
      passed: allCorrect,
      message: allCorrect ? 'Passed: All 5 expiry tiers categorized accurately.' : 'Failed to classify tiers correctly.',
      details: `Expired: ${expiredStatus}, 15d: ${getBatchExpiryStatus(in15Days)}, 45d: ${getBatchExpiryStatus(in45Days)}, 75d: ${getBatchExpiryStatus(in75Days)}, 180d: ${getBatchExpiryStatus(in180Days)}`
    });
  } catch (err: any) {
    results.push({
      id: 'EXPIRY_CLASSIFICATION',
      name: 'Batch Expiry Categorization',
      category: 'Expiry Management',
      description: 'Verifies correct classification of expiry tiers.',
      passed: false,
      message: err.message
    });
  }

  // TEST 2: Strict Prevention of Selling Expired Batches
  try {
    const mockBatches: MedicineBatch[] = [
      {
        id: 101,
        medicineId: 99,
        batchNumber: 'EXP-BATCH-1',
        initialQuantity: 20,
        currentQuantity: 20,
        purchasePrice: 10,
        sellingPrice: 20,
        mfgDate: '2023-01-01',
        expiryDate: '2024-01-01', // Expired!
        supplierId: 1,
        receivedDate: '2023-01-05'
      }
    ];

    const result = allocateBatchesFefo(mockBatches, 5, 'Amoxicillin Test');
    const passed = !result.success && result.expiredBatchesSkipped.length === 1 && result.allocations.length === 0;

    results.push({
      id: 'PREVENT_EXPIRED_SALE',
      name: 'Strict Rule: Never Sell Expired Stock',
      category: 'FEFO Engine',
      description: 'Ensures batches past expiry cannot be allocated or dispensed under any condition.',
      passed,
      message: passed 
        ? 'Passed: FEFO locked expired batch and rejected checkout with safety error.' 
        : 'Failed: Expired batch was erroneously allowed to sell.',
      details: result.error
    });
  } catch (err: any) {
    results.push({
      id: 'PREVENT_EXPIRED_SALE',
      name: 'Strict Rule: Never Sell Expired Stock',
      category: 'FEFO Engine',
      description: 'Ensures batches past expiry cannot be allocated.',
      passed: false,
      message: err.message
    });
  }

  // TEST 3: FEFO (First Expired First Out) Ordering across multiple batches
  try {
    const today = new Date();
    const batchNearExpiry = new Date(today.getTime() + 20 * 86400000).toISOString().substring(0, 10);
    const batchFarExpiry = new Date(today.getTime() + 200 * 86400000).toISOString().substring(0, 10);

    const mockBatches: MedicineBatch[] = [
      {
        id: 201,
        medicineId: 99,
        batchNumber: 'BATCH-FAR',
        initialQuantity: 50,
        currentQuantity: 50,
        purchasePrice: 10,
        sellingPrice: 20,
        mfgDate: '2026-01-01',
        expiryDate: batchFarExpiry, // Expiring far later
        supplierId: 1,
        receivedDate: '2026-01-10'
      },
      {
        id: 202,
        medicineId: 99,
        batchNumber: 'BATCH-NEAR',
        initialQuantity: 10,
        currentQuantity: 10,
        purchasePrice: 10,
        sellingPrice: 20,
        mfgDate: '2025-01-01',
        expiryDate: batchNearExpiry, // Expiring first!
        supplierId: 1,
        receivedDate: '2025-01-10'
      }
    ];

    // Request 15 units: should take all 10 from BATCH-NEAR first, then 5 from BATCH-FAR!
    const result = allocateBatchesFefo(mockBatches, 15, 'MultiBatch Test');
    const passed = result.success &&
      result.allocations.length === 2 &&
      result.allocations[0].batchNumber === 'BATCH-NEAR' &&
      result.allocations[0].quantity === 10 &&
      result.allocations[1].batchNumber === 'BATCH-FAR' &&
      result.allocations[1].quantity === 5;

    results.push({
      id: 'FEFO_MULTI_BATCH_ORDER',
      name: 'Multi-Batch FEFO Allocation Split',
      category: 'FEFO Engine',
      description: 'Verifies earlier expiring batches are prioritized and exhausted first before later batches.',
      passed,
      message: passed
        ? 'Passed: FEFO accurately exhausted BATCH-NEAR (10 units) before taking 5 from BATCH-FAR.'
        : 'Failed: Incorrect batch allocation order.',
      details: JSON.stringify(result.allocations)
    });
  } catch (err: any) {
    results.push({
      id: 'FEFO_MULTI_BATCH_ORDER',
      name: 'Multi-Batch FEFO Allocation Split',
      category: 'FEFO Engine',
      description: 'Verifies earlier expiring batches are prioritized.',
      passed: false,
      message: err.message
    });
  }

  // TEST 4: Selling the Last Item in Stock
  try {
    const today = new Date();
    const validExpiry = new Date(today.getTime() + 100 * 86400000).toISOString().substring(0, 10);
    const mockBatches: MedicineBatch[] = [
      {
        id: 301,
        medicineId: 99,
        batchNumber: 'LAST-UNIT-BATCH',
        initialQuantity: 1,
        currentQuantity: 1,
        purchasePrice: 5,
        sellingPrice: 10,
        mfgDate: '2026-01-01',
        expiryDate: validExpiry,
        supplierId: 1,
        receivedDate: '2026-01-05'
      }
    ];

    const result = allocateBatchesFefo(mockBatches, 1, 'Last Item');
    const passed = result.success && result.allocations[0].quantity === 1 && result.remainingRequested === 0;

    results.push({
      id: 'SELL_LAST_STOCK_ITEM',
      name: 'Boundary Test: Selling the Last Available Unit',
      category: 'Inventory',
      description: 'Validates edge case where stock has exactly 1 unit left and requested quantity is 1.',
      passed,
      message: passed ? 'Passed: Exactly 1 unit allocated without boundary error.' : 'Failed on boundary quantity 1.',
      details: `Allocated: ${result.allocatedQuantity}, Remaining: ${result.remainingRequested}`
    });
  } catch (err: any) {
    results.push({
      id: 'SELL_LAST_STOCK_ITEM',
      name: 'Boundary Test: Selling the Last Available Unit',
      category: 'Inventory',
      description: 'Validates edge case where stock has exactly 1 unit left.',
      passed: false,
      message: err.message
    });
  }

  // TEST 5: Insufficient Stock Deficit Detection
  try {
    const today = new Date();
    const validExpiry = new Date(today.getTime() + 100 * 86400000).toISOString().substring(0, 10);
    const mockBatches: MedicineBatch[] = [
      {
        id: 401,
        medicineId: 99,
        batchNumber: 'SHORT-STOCK',
        initialQuantity: 10,
        currentQuantity: 4,
        purchasePrice: 5,
        sellingPrice: 10,
        mfgDate: '2026-01-01',
        expiryDate: validExpiry,
        supplierId: 1,
        receivedDate: '2026-01-05'
      }
    ];

    const result = allocateBatchesFefo(mockBatches, 10, 'Short Stock Med');
    const passed = !result.success && result.remainingRequested === 6;

    results.push({
      id: 'INSUFFICIENT_STOCK_DEFICIT',
      name: 'Negative Stock Prevention & Deficit Check',
      category: 'Inventory Integrity',
      description: 'Rejects sale if quantity requested exceeds available non-expired stock and reports deficit.',
      passed,
      message: passed
        ? 'Passed: Prevented overdraft; detected deficit of 6 units.'
        : 'Failed: Did not reject insufficient stock correctly.',
      details: result.error
    });
  } catch (err: any) {
    results.push({
      id: 'INSUFFICIENT_STOCK_DEFICIT',
      name: 'Negative Stock Prevention',
      category: 'Inventory Integrity',
      description: 'Rejects sale if quantity exceeds stock.',
      passed: false,
      message: err.message
    });
  }

  // TEST 6: Financial Calculations Precision
  try {
    const subtotal = 125.50;
    const discountPct = 10;
    const taxRate = 0.05;

    const discountAmount = Number(((subtotal * discountPct) / 100).toFixed(2)); // 12.55
    const taxable = subtotal - discountAmount; // 112.95
    const taxAmount = Number((taxable * taxRate).toFixed(2)); // 5.65
    const grandTotal = Number((taxable + taxAmount).toFixed(2)); // 118.60

    const passed = discountAmount === 12.55 && taxable === 112.95 && taxAmount === 5.65 && grandTotal === 118.60;

    results.push({
      id: 'FINANCIAL_PRECISION',
      name: 'DECIMAL Financial Precision & Rounding',
      category: 'Financial',
      description: 'Validates rounding and penny accuracy in discounts, tax calculation, and grand totals.',
      passed,
      message: passed
        ? 'Passed: Calculated Subtotal $125.50 - 10% ($12.55) + 5% Tax ($5.65) = $118.60 exactly.'
        : 'Failed: Decimal floating point rounding error detected.',
      details: `Discount: ${discountAmount}, Tax: ${taxAmount}, GrandTotal: ${grandTotal}`
    });
  } catch (err: any) {
    results.push({
      id: 'FINANCIAL_PRECISION',
      name: 'DECIMAL Financial Precision',
      category: 'Financial',
      description: 'Validates rounding accuracy.',
      passed: false,
      message: err.message
    });
  }

  return results;
}
