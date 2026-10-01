import React from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { PharmacyDatabaseState } from '../services/pharmacyDb';
import { calculateDaysToExpiry, getBatchExpiryStatus } from '../services/fefoEngine';
import { TabKey } from './Sidebar';

interface NotificationsModalProps {
  state: PharmacyDatabaseState;
  onClose: () => void;
  onNavigate: (tab: TabKey) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  state, 
  onClose, 
  onNavigate 
}) => {
  // Aggregate dynamic alerts
  const alerts: {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    targetTab: TabKey;
  }[] = [];

  // 1. Expired batches
  state.batches.forEach(b => {
    if (b.currentQuantity > 0) {
      const status = getBatchExpiryStatus(b.expiryDate);
      const med = state.medicines.find(m => m.id === b.medicineId);
      const medName = med ? med.name : 'Medicine';

      if (status === 'expired') {
        alerts.push({
          id: `exp-${b.id}`,
          type: 'critical',
          title: `Expired Batch Lot: ${b.batchNumber}`,
          message: `${medName} (${b.currentQuantity} units) expired on ${b.expiryDate}. FEFO safety rule has locked this lot from POS sales.`,
          targetTab: 'batches'
        });
      } else if (status === 'near_expiry_30') {
        const days = calculateDaysToExpiry(b.expiryDate);
        alerts.push({
          id: `near-${b.id}`,
          type: 'warning',
          title: `Near-Expiry Batch: ${b.batchNumber}`,
          message: `${medName} (${b.currentQuantity} units) expires in ${days} days on ${b.expiryDate}. Prioritize under FEFO dispensing.`,
          targetTab: 'batches'
        });
      }
    }
  });

  // 2. Low stock medicines
  state.medicines.forEach(m => {
    const stock = state.batches
      .filter(b => b.medicineId === m.id)
      .reduce((sum, b) => sum + b.currentQuantity, 0);

    if (stock === 0) {
      alerts.push({
        id: `oos-${m.id}`,
        type: 'critical',
        title: `Out of Stock: ${m.name}`,
        message: `Inventory exhausted (0 units). Minimum safety threshold is ${m.minStockLevel}. Create purchase order.`,
        targetTab: 'purchasing'
      });
    } else if (stock <= m.minStockLevel) {
      alerts.push({
        id: `low-${m.id}`,
        type: 'warning',
        title: `Low Stock Warning: ${m.name}`,
        message: `Current physical count (${stock} units) is at or below minimum threshold (${m.minStockLevel} units).`,
        targetTab: 'inventory'
      });
    }
  });

  // 3. Pending Prescriptions
  const pendingRx = state.prescriptions.filter(p => p.status === 'Pending');
  if (pendingRx.length > 0) {
    alerts.push({
      id: 'pending-rx',
      type: 'info',
      title: `${pendingRx.length} Pending Prescriptions`,
      message: `There are ${pendingRx.length} patient prescriptions awaiting clinical pharmacist review and dispensing.`,
      targetTab: 'prescriptions'
    });
  }

  // 4. Overdue supplier balances
  const overdueSuppliers = state.suppliers.filter(s => s.outstandingBalance > 1000);
  overdueSuppliers.forEach(s => {
    alerts.push({
      id: `supp-${s.id}`,
      type: 'warning',
      title: `Outstanding Vendor Balance: ${s.name}`,
      message: `Unsettled accounts payable of $${s.outstandingBalance.toFixed(2)} under ${s.paymentTerms} credit terms.`,
      targetTab: 'suppliers'
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            Operational Notifications & Regulatory Alerts ({alerts.length})
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All inventory, expiry, and prescription queues are operating normally.
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${
                  alert.type === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : alert.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {alert.type === 'critical' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    ) : alert.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold">{alert.title}</div>
                    <div className="text-[11px] opacity-90 mt-0.5">{alert.message}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNavigate(alert.targetTab);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-800 shrink-0 border border-slate-200 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  Resolve
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
