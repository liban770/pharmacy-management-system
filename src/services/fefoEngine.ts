import { MedicineBatch, BatchAllocation, BatchExpiryStatus } from '../types/pharmacy';

export function calculateDaysToExpiry(expiryDateStr: string): number {
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  // Normalize to start of day for clean day math
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getBatchExpiryStatus(expiryDateStr: string): BatchExpiryStatus {
  const days = calculateDaysToExpiry(expiryDateStr);
  if (days <= 0) return 'expired';
  if (days <= 30) return 'near_expiry_30';
  if (days <= 60) return 'near_expiry_60';
  if (days <= 90) return 'near_expiry_90';
  return 'normal';
}

export interface FefoAllocationResult {
  success: boolean;
  allocations: BatchAllocation[];
  allocatedQuantity: number;
  remainingRequested: number;
  error?: string;
  expiredBatchesSkipped: { batchNumber: string; qty: number; expiryDate: string }[];
}

/**
 * FEFO (First Expired, First Out) Allocation Engine
 * Selects batches with nearest expiry dates that are NOT expired.
 * Never allows expired batches to be sold.
 */
export function allocateBatchesFefo(
  batches: MedicineBatch[],
  requestedQuantity: number,
  medicineName: string = 'Medicine'
): FefoAllocationResult {
  if (requestedQuantity <= 0) {
    return {
      success: true,
      allocations: [],
      allocatedQuantity: 0,
      remainingRequested: 0,
      expiredBatchesSkipped: []
    };
  }

  // Filter out batches with 0 current quantity
  const availableBatches = batches.filter(b => b.currentQuantity > 0);

  const expiredBatchesSkipped: { batchNumber: string; qty: number; expiryDate: string }[] = [];
  const validBatches: MedicineBatch[] = [];

  for (const b of availableBatches) {
    const days = calculateDaysToExpiry(b.expiryDate);
    if (days <= 0) {
      expiredBatchesSkipped.push({
        batchNumber: b.batchNumber,
        qty: b.currentQuantity,
        expiryDate: b.expiryDate
      });
    } else {
      validBatches.push(b);
    }
  }

  // Strict FEFO: Sort valid batches by expiry date ASCENDING (nearest expiry first)
  validBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  let needed = requestedQuantity;
  const allocations: BatchAllocation[] = [];

  for (const batch of validBatches) {
    if (needed <= 0) break;
    const take = Math.min(batch.currentQuantity, needed);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: take,
      unitPrice: batch.sellingPrice,
      expiryDate: batch.expiryDate
    });
    needed -= take;
  }

  if (needed > 0) {
    const totalValidStock = validBatches.reduce((sum, b) => sum + b.currentQuantity, 0);
    const expiredStock = expiredBatchesSkipped.reduce((sum, b) => sum + b.qty, 0);
    let errorMsg = `Insufficient valid stock for ${medicineName}. Requested: ${requestedQuantity}, Available non-expired: ${totalValidStock}.`;
    if (expiredStock > 0) {
      errorMsg += ` (${expiredStock} units exist in expired batches and were automatically locked by FEFO rules).`;
    }

    return {
      success: false,
      allocations: [],
      allocatedQuantity: 0,
      remainingRequested: needed,
      error: errorMsg,
      expiredBatchesSkipped
    };
  }

  return {
    success: true,
    allocations,
    allocatedQuantity: requestedQuantity,
    remainingRequested: 0,
    expiredBatchesSkipped
  };
}
