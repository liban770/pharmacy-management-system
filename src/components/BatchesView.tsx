import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Lock, 
  ArrowUpDown, 
  Plus, 
  SlidersHorizontal 
} from 'lucide-react';
import { MedicineBatch, BatchExpiryStatus } from '../types/pharmacy';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';
import { calculateDaysToExpiry, getBatchExpiryStatus } from '../services/fefoEngine';

interface BatchesViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
}

export const BatchesView: React.FC<BatchesViewProps> = ({ state, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BatchExpiryStatus>('all');
  const [adjustBatch, setAdjustBatch] = useState<MedicineBatch | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Quarantine disposal of expired stock');
  const [adjustType, setAdjustType] = useState<'adjustment' | 'damage' | 'expiration'>('expiration');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute batches with dynamic expiry stats
  const enrichedBatches = useMemo(() => {
    return state.batches.map(b => {
      const med = state.medicines.find(m => m.id === b.medicineId);
      const supp = state.suppliers.find(s => s.id === b.supplierId);
      const days = calculateDaysToExpiry(b.expiryDate);
      const status = getBatchExpiryStatus(b.expiryDate);
      return {
        ...b,
        medicineName: med ? med.name : 'Unknown Formulation',
        genericName: med ? med.genericName : '',
        supplierName: supp ? supp.name : 'Unknown Vendor',
        daysToExpiry: days,
        status
      };
    });
  }, [state.batches, state.medicines, state.suppliers]);

  // Counts for tabs
  const counts = useMemo(() => {
    const c = { all: 0, expired: 0, near_expiry_30: 0, near_expiry_60: 0, near_expiry_90: 0, normal: 0 };
    enrichedBatches.forEach(b => {
      if (b.currentQuantity > 0) {
        c.all++;
        c[b.status]++;
      }
    });
    return c;
  }, [enrichedBatches]);

  const filteredBatches = useMemo(() => {
    return enrichedBatches.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.batchNumber.toLowerCase().includes(q) ||
          b.medicineName?.toLowerCase().includes(q) ||
          b.genericName?.toLowerCase().includes(q) ||
          b.supplierName?.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => a.daysToExpiry - b.daysToExpiry); // Sort strictly FEFO (nearest expiry first)
  }, [enrichedBatches, statusFilter, search]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustBatch) return;
    setErrorMsg(null);

    const result = await pharmacyDb.adjustStock({
      batchId: adjustBatch.id,
      newQuantity: adjustQty,
      reason: adjustReason,
      type: adjustType
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Adjustment failed.');
      return;
    }

    setAdjustBatch(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Pharmaceutical Batch & Expiry Tracker
            <span className="text-xs bg-slate-900 text-white font-mono px-2 py-0.5 rounded">
              FEFO Priority Queue
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Strict regulatory expiry risk classification · Automated POS safety lockout on expired lots
          </div>
        </div>
      </div>

      {/* Expiry Risk Tiers Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Active Batches ({counts.all})
        </button>

        <button
          onClick={() => setStatusFilter('expired')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'expired'
              ? 'bg-rose-700 text-white shadow-xs font-semibold'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Expired Lots ({counts.expired})
        </button>

        <button
          onClick={() => setStatusFilter('near_expiry_30')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'near_expiry_30'
              ? 'bg-amber-600 text-white shadow-xs font-semibold'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Expiring &le; 30 Days ({counts.near_expiry_30})
        </button>

        <button
          onClick={() => setStatusFilter('near_expiry_60')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            statusFilter === 'near_expiry_60'
              ? 'bg-amber-700 text-white shadow-xs font-semibold'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Expiring 31-60 Days ({counts.near_expiry_60})
        </button>

        <button
          onClick={() => setStatusFilter('normal')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            statusFilter === 'normal'
              ? 'bg-emerald-700 text-white shadow-xs font-semibold'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Safe & Normal Stock ({counts.normal})
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lot/batch number, medicine trade name, or supplier..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Batch Lot Number</th>
                <th className="py-3 px-3">Medicine Formulation</th>
                <th className="py-3 px-3">Supplier Origin</th>
                <th className="py-3 px-3 font-mono">Mfg Date</th>
                <th className="py-3 px-3 font-mono">Expiry Date</th>
                <th className="py-3 px-3">Days Remaining</th>
                <th className="py-3 px-3 text-right">Available Qty</th>
                <th className="py-3 px-3">Storage Rack</th>
                <th className="py-3 px-3">FEFO Safety State</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map(b => {
                  const isExp = b.daysToExpiry <= 0;
                  const is30 = b.daysToExpiry > 0 && b.daysToExpiry <= 30;
                  const is60 = b.daysToExpiry > 30 && b.daysToExpiry <= 60;

                  return (
                    <tr 
                      key={b.id} 
                      className={`transition-colors ${
                        isExp ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{b.medicineName}</div>
                        <div className="text-[11px] text-slate-500">{b.genericName}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {b.supplierName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {b.mfgDate}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800 text-[11px]">
                        {b.expiryDate}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        {isExp ? (
                          <span className="text-rose-700 font-bold">
                            Expired ({Math.abs(b.daysToExpiry)}d ago)
                          </span>
                        ) : is30 ? (
                          <span className="text-amber-700 font-bold">
                            {b.daysToExpiry} days left
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            {b.daysToExpiry} days
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {b.currentQuantity} / {b.initialQuantity}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {b.locationRack || 'Store'}
                      </td>
                      <td className="py-3 px-3">
                        {isExp ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                            <Lock className="w-3 h-3 text-rose-700" />
                            LOCKED (Cannot Sell)
                          </span>
                        ) : is30 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            FEFO Priority (1st to Dispense)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active / Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setAdjustBatch(b);
                            setAdjustQty(b.currentQuantity);
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Adjust Lot
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Batch Modal */}
      {adjustBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm">
                Stock Adjustment: Lot #{adjustBatch.batchNumber}
              </div>
              <button onClick={() => setAdjustBatch(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded border border-rose-200 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">{adjustBatch.medicineName}</div>
                <div className="text-slate-500 font-mono">
                  Current Physical Count: <strong>{adjustBatch.currentQuantity}</strong> units
                </div>
                <div className="text-slate-500">
                  Expiry Date: <span className="font-mono">{adjustBatch.expiryDate}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Verified Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustQty}
                  onChange={e => setAdjustQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Movement Classification *
                </label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="expiration">Expiration / Quarantine Write-Off</option>
                  <option value="damage">Damaged Packaging / Broken Ampoule</option>
                  <option value="adjustment">Cycle Count Physical Audit Reconciliation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Audit Reason / Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Explain why the physical inventory is being modified..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustBatch(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
