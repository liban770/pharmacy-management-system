import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Filter, 
  Layers, 
  AlertTriangle, 
  History,
  FileSpreadsheet
} from 'lucide-react';
import { StockMovement, StockMovementType } from '../types/pharmacy';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';

interface InventoryViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ state, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'catalog_stock' | 'movements_ledger'>('catalog_stock');
  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState<'all' | StockMovementType>('all');

  // Compute stock inventory summary
  const medicineStockSummary = useMemo(() => {
    return state.medicines.map(m => {
      const stock = pharmacyDb.getMedicineStock(m.id);
      const stockVal = stock.batches.reduce((sum, b) => sum + (b.currentQuantity * b.purchasePrice), 0);
      const isLow = stock.totalStock <= m.minStockLevel;

      return {
        ...m,
        ...stock,
        stockVal,
        isLow
      };
    }).filter(m => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q);
    });
  }, [state.medicines, state.batches, search]);

  // Movements filtered
  const filteredMovements = useMemo(() => {
    return state.stockMovements.filter(sm => {
      if (movementFilter !== 'all' && sm.type !== movementFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          sm.medicineName.toLowerCase().includes(q) ||
          (sm.batchNumber && sm.batchNumber.toLowerCase().includes(q)) ||
          sm.reason.toLowerCase().includes(q) ||
          sm.performedBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [state.stockMovements, movementFilter, search]);

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case 'purchase':
        return <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">Purchase</span>;
      case 'sale':
        return <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">Sale</span>;
      case 'return':
        return <span className="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded border border-purple-200">Return</span>;
      case 'adjustment':
        return <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-300">Adjustment</span>;
      case 'damage':
        return <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded border border-rose-200">Damage</span>;
      case 'expiration':
        return <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-300">Expiration</span>;
      case 'transfer':
        return <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200">Transfer</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Inventory & Stock Movement Ledger
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Audit-grade double-entry stock movement tracking with automated balance reconciliation
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('catalog_stock')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'catalog_stock'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Formulary Stock Balance
          </button>
          <button
            onClick={() => setActiveTab('movements_ledger')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'movements_ledger'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Stock Movement Log ({state.stockMovements.length})
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'catalog_stock' ? "Search stock items by name, SKU..." : "Search movement reason, formulation, user..."}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {activeTab === 'movements_ledger' && (
          <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
            <span className="text-slate-500 whitespace-nowrap">Filter Type:</span>
            <select
              value={movementFilter}
              onChange={e => setMovementFilter(e.target.value as any)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="all">All Movements</option>
              <option value="purchase">Purchases (+)</option>
              <option value="sale">Sales (-)</option>
              <option value="return">Returns (+)</option>
              <option value="adjustment">Manual Adjustments (&plusmn;)</option>
              <option value="damage">Damage Disposals (-)</option>
              <option value="expiration">Expiration Lockouts (-)</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Pane */}
      {activeTab === 'catalog_stock' ? (
        /* View 1: Formulary Stock Breakdown Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Medicine Item</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-right">Physical Total</th>
                  <th className="py-3 px-3 text-right">Valid (Sellable)</th>
                  <th className="py-3 px-3 text-right">Expired (Locked)</th>
                  <th className="py-3 px-3 text-right">Min Threshold</th>
                  <th className="py-3 px-3 text-right">Stock Valuation</th>
                  <th className="py-3 px-3">Inventory Health</th>
                  <th className="py-3 px-4 text-right">Active Batches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicineStockSummary.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500">{m.genericName}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {m.sku}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {m.totalStock} {m.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {m.validStock}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {m.expiredStock > 0 ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {m.expiredStock}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {m.minStockLevel}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ${m.stockVal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      {m.isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {m.batches.length} lots
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View 2: Immutable Stock Movements Ledger */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3">Medicine Item</th>
                  <th className="py-3 px-3">Batch Lot</th>
                  <th className="py-3 px-3 text-right">Delta Qty</th>
                  <th className="py-3 px-3 text-right">Before &rarr; After</th>
                  <th className="py-3 px-3">Reference / Order</th>
                  <th className="py-3 px-3">Justification / Reason</th>
                  <th className="py-3 px-4">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                      No stock movements recorded under selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map(sm => {
                    const isPositive = sm.quantity > 0;

                    return (
                      <tr key={sm.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {sm.createdAt}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {getMovementBadge(sm.type)}
                        </td>
                        <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                          {sm.medicineName}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {sm.batchNumber ? `#${sm.batchNumber}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums">
                          <span className={isPositive ? 'text-emerald-700' : sm.quantity < 0 ? 'text-rose-700' : 'text-slate-500'}>
                            {isPositive ? `+${sm.quantity}` : sm.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-600">
                          {sm.balanceBefore} &rarr; {sm.balanceAfter}
                        </td>
                        <td className="py-3 px-3 text-slate-700 text-[11px]">
                          {sm.referenceType || '—'}
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-600 text-[11px] max-w-xs truncate">
                          {sm.reason}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-800 text-[11px]">
                          {sm.performedBy}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
