<?php
/**
 * PharmOS Enterprise - FEFO (First Expired, First Out) Inventory Service
 * Enforces pharmaceutical regulatory safety rules.
 */

declare(strict_types=1);

namespace PharmOS\Services;

use PDO;
use RuntimeException;

class FefoService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Allocates batches for a sale using strict FEFO.
     * Batches with earliest non-expired date are consumed first.
     * Batches where expiry_date <= CURDATE() are NEVER sold.
     *
     * @param int $medicineId
     * @param int $requestedQuantity
     * @return array List of batch allocations: [['batch_id' => int, 'quantity' => int, 'batch_number' => string, 'unit_price' => float]]
     * @throws RuntimeException If stock is insufficient or expired
     */
    public function allocateStock(int $medicineId, int $requestedQuantity): array
    {
        if ($requestedQuantity <= 0) {
            throw new RuntimeException("Requested quantity must be greater than zero.");
        }

        // Fetch medicine details
        $medStmt = $this->db->prepare("SELECT name FROM medicines WHERE id = :id AND status = 'active'");
        $medStmt->execute([':id' => $medicineId]);
        $medicine = $medStmt->fetch();

        if (!$medicine) {
            throw new RuntimeException("Active medicine record with ID {$medicineId} not found.");
        }

        // Fetch all non-zero batches ordered strictly by expiry_date ASC
        $sql = "SELECT id, batch_number, current_quantity, selling_price, expiry_date,
                       DATEDIFF(expiry_date, CURDATE()) AS days_to_expiry
                FROM medicine_batches
                WHERE medicine_id = :medicine_id AND current_quantity > 0
                ORDER BY expiry_date ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':medicine_id' => $medicineId]);
        $batches = $stmt->fetchAll();

        $allocations = [];
        $needed = $requestedQuantity;
        $totalValidAvailable = 0;
        $expiredCount = 0;

        foreach ($batches as $batch) {
            $daysToExpiry = (int)$batch['days_to_expiry'];

            // Strict rule: Expired medicine CANNOT be sold
            if ($daysToExpiry <= 0) {
                $expiredCount += (int)$batch['current_quantity'];
                continue; // Skip expired batch
            }

            $currentQty = (int)$batch['current_quantity'];
            $totalValidAvailable += $currentQty;

            if ($needed > 0) {
                $take = min($currentQty, $needed);
                $allocations[] = [
                    'batch_id' => (int)$batch['id'],
                    'batch_number' => $batch['batch_number'],
                    'quantity' => $take,
                    'unit_price' => (float)$batch['selling_price'],
                    'expiry_date' => $batch['expiry_date']
                ];
                $needed -= $take;
            }
        }

        if ($needed > 0) {
            $msg = "Insufficient valid stock for '{$medicine['name']}'. Requested: {$requestedQuantity}, Available non-expired: {$totalValidAvailable}.";
            if ($expiredCount > 0) {
                $msg .= " ({$expiredCount} units exist in expired batches and are locked from sale by FEFO rules).";
            }
            throw new RuntimeException($msg);
        }

        return $allocations;
    }
}
