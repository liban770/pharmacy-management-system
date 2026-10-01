<?php
/**
 * PharmOS Enterprise - Point of Sale (POS) Atomic Transaction Service
 * Implements strict database transaction rollback on any validation failure.
 */

declare(strict_types=1);

namespace PharmOS\Services;

use PDO;
use Exception;
use RuntimeException;

class PosService
{
    private PDO $db;
    private FefoService $fefoService;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->fefoService = new FefoService($db);
    }

    /**
     * Executes atomic sale transaction.
     * 1. Validates cart & customer
     * 2. Runs FEFO allocation on each medicine
     * 3. Inserts sale record
     * 4. Deducts batch stock & creates stock_movements
     * 5. Updates prescription status if linked
     * 6. Commits transaction or rolls back entirely on error
     */
    public function executeSale(array $data, int $cashierUserId): array
    {
        if (empty($data['items'])) {
            throw new RuntimeException("Cart cannot be empty.");
        }

        $this->db->beginTransaction();

        try {
            $subtotal = 0.0;
            $preparedAllocations = [];

            // 1. FEFO Validation & Pre-allocation
            foreach ($data['items'] as $item) {
                $medId = (int)$item['medicine_id'];
                $qty = (int)$item['quantity'];

                $allocations = $this->fefoService->allocateStock($medId, $qty);

                foreach ($allocations as $alloc) {
                    $subtotal += ($alloc['quantity'] * $alloc['unit_price']);
                }

                $preparedAllocations[$medId] = [
                    'medicine_id' => $medId,
                    'quantity' => $qty,
                    'allocations' => $allocations
                ];
            }

            // 2. Financial calculation
            $discountPct = (float)($data['discount_percentage'] ?? 0.0);
            $discountAmount = round(($subtotal * $discountPct) / 100, 2);
            $taxRate = (float)($data['tax_rate'] ?? 0.05);
            $taxable = $subtotal - $discountAmount;
            $taxAmount = round($taxable * $taxRate, 2);
            $grandTotal = round($taxable + $taxAmount, 2);

            $paymentMethod = $data['payment_method'] ?? 'Cash';
            $amountReceived = (float)($data['amount_received'] ?? $grandTotal);

            if ($paymentMethod === 'Cash' && $amountReceived < $grandTotal) {
                throw new RuntimeException("Amount received ({$amountReceived}) is less than grand total ({$grandTotal}).");
            }

            $changeGiven = ($paymentMethod === 'Cash') ? round($amountReceived - $grandTotal, 2) : 0.0;
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

            // 3. Insert Sale Record
            $saleSql = "INSERT INTO sales (
                invoice_number, customer_id, customer_name, prescription_id, cashier_user_id,
                subtotal, discount_percentage, discount_amount, tax_rate, tax_amount, grand_total,
                payment_method, payment_status, amount_received, change_given, notes
            ) VALUES (
                :invoice_number, :customer_id, :customer_name, :prescription_id, :cashier_user_id,
                :subtotal, :discount_percentage, :discount_amount, :tax_rate, :tax_amount, :grand_total,
                :payment_method, :payment_status, :amount_received, :change_given, :notes
            )";

            $saleStmt = $this->db->prepare($saleSql);
            $saleStmt->execute([
                ':invoice_number' => $invoiceNumber,
                ':customer_id' => $data['customer_id'] ?? null,
                ':customer_name' => $data['customer_name'] ?? 'Walk-in Customer',
                ':prescription_id' => $data['prescription_id'] ?? null,
                ':cashier_user_id' => $cashierUserId,
                ':subtotal' => $subtotal,
                ':discount_percentage' => $discountPct,
                ':discount_amount' => $discountAmount,
                ':tax_rate' => $taxRate,
                ':tax_amount' => $taxAmount,
                ':grand_total' => $grandTotal,
                ':payment_method' => $paymentMethod,
                ':payment_status' => ($paymentMethod === 'Credit') ? 'Credit' : 'Paid',
                ':amount_received' => $amountReceived,
                ':change_given' => $changeGiven,
                ':notes' => $data['notes'] ?? null
            ]);

            $saleId = (int)$this->db->lastInsertId();

            // 4. Record items, deduct inventory, and record stock movements
            $itemStmt = $this->db->prepare("INSERT INTO sale_items (sale_id, medicine_id, batch_id, quantity, unit_price, subtotal) VALUES (:sale_id, :medicine_id, :batch_id, :quantity, :unit_price, :subtotal)");
            $batchDeductStmt = $this->db->prepare("UPDATE medicine_batches SET current_quantity = current_quantity - :qty WHERE id = :id AND current_quantity >= :qty");
            $movementStmt = $this->db->prepare("INSERT INTO stock_movements (medicine_id, batch_id, type, quantity, balance_before, balance_after, reference_type, reference_id, reason, performed_by_user_id) VALUES (:med_id, :batch_id, 'sale', :qty, :before, :after, :ref_type, :ref_id, :reason, :user_id)");

            foreach ($preparedAllocations as $medItem) {
                foreach ($medItem['allocations'] as $alloc) {
                    $itemSub = round($alloc['quantity'] * $alloc['unit_price'], 2);

                    // Insert sale item
                    $itemStmt->execute([
                        ':sale_id' => $saleId,
                        ':medicine_id' => $medItem['medicine_id'],
                        ':batch_id' => $alloc['batch_id'],
                        ':quantity' => $alloc['quantity'],
                        ':unit_price' => $alloc['unit_price'],
                        ':subtotal' => $itemSub
                    ]);

                    // Deduct batch stock with atomic condition
                    $batchDeductStmt->execute([
                        ':qty' => $alloc['quantity'],
                        ':id' => $alloc['batch_id']
                    ]);

                    if ($batchDeductStmt->rowCount() === 0) {
                        throw new RuntimeException("Concurrent conflict: Batch #{$alloc['batch_number']} had insufficient units during atomic deduction.");
                    }

                    // Record movement ledger
                    $movementStmt->execute([
                        ':med_id' => $medItem['medicine_id'],
                        ':batch_id' => $alloc['batch_id'],
                        ':qty' => -$alloc['quantity'],
                        ':before' => 0, // In MySQL trigger or calculated
                        ':after' => 0,
                        ':ref_type' => 'SALE',
                        ':ref_id' => (string)$saleId,
                        ':reason' => "POS Sale #{$invoiceNumber}",
                        ':user_id' => $cashierUserId
                    ]);
                }
            }

            // 5. Update Prescription if provided
            if (!empty($data['prescription_id'])) {
                $rxId = (int)$data['prescription_id'];
                $rxStmt = $this->db->prepare("UPDATE prescriptions SET status = 'Dispensed', dispensed_by_user_id = :user_id, dispensed_at = NOW() WHERE id = :id");
                $rxStmt->execute([':user_id' => $cashierUserId, ':id' => $rxId]);
            }

            // 6. Update Customer balance if Credit
            if (!empty($data['customer_id'])) {
                $custStmt = $this->db->prepare("UPDATE customers SET total_spent = total_spent + :spent, outstanding_balance = outstanding_balance + :bal WHERE id = :id");
                $custStmt->execute([
                    ':spent' => $grandTotal,
                    ':bal' => ($paymentMethod === 'Credit') ? $grandTotal : 0.0,
                    ':id' => $data['customer_id']
                ]);
            }

            // 7. Audit Log
            $auditStmt = $this->db->prepare("INSERT INTO audit_logs (user_id, user_name, user_role, action, entity, entity_id, description, ip_address) VALUES (:uid, 'Cashier', 'cashier', 'SALE_COMPLETED', 'Sale', :inv, :desc, :ip)");
            $auditStmt->execute([
                ':uid' => $cashierUserId,
                ':inv' => $invoiceNumber,
                ':desc' => "Processed POS invoice {$invoiceNumber} for amount \${$grandTotal}",
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ]);

            // Commit atomic transaction
            $this->db->commit();

            return [
                'success' => true,
                'sale_id' => $saleId,
                'invoice_number' => $invoiceNumber,
                'grand_total' => $grandTotal,
                'change_given' => $changeGiven
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
