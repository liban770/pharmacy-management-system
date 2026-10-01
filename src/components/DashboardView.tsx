import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Boxes, 
  ShieldAlert, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Pill,
  CreditCard
} from 'lucide-react';
import { PharmacyDatabaseState } from '../services/pharmacyDb';
import { TabKey } from './Sidebar';

interface DashboardViewProps {
  state: PharmacyDatabaseState;
  onNavigate: (tab: TabKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ state, onNavigate }) => {
  // Compute Key Metrics
  const todayStr = new Date().toISOString().substring(0, 10);
  const todaySalesList = state.sales.filter(s => s.createdAt.startsWith(todayStr));
  const todaySales = todaySalesList.reduce((sum, s) => sum + s.grandTotal, 0);

  const todayPurchases = state.purchases
    .filter(p => p.createdAt.startsWith(todayStr))
    .reduce((sum, p) => sum + p.grandTotal, 0);

  const todayExpenses = state.expenses
    .filter(e => e.expenseDate === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const allSalesTotal = state.sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const allReturnsTotal = state.customerReturns.reduce((sum, r) => sum + r.refundAmount, 0);
  const netSales = allSalesTotal - allReturnsTotal;

  // Inventory & Batch counts
  let totalInventoryValue = 0;
  let expiredCount = 0;
  let nearExpiry30Count = 0;
  let nearExpiry60Count = 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  state.batches.forEach(b => {
    if (b.currentQuantity > 0) {
      totalInventoryValue += b.currentQuantity * b.purchasePrice;
      const expiry = new Date(b.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (days <= 0) expiredCount++;
      else if (days <= 30) nearExpiry30Count++;
      else if (days <= 60) nearExpiry60Count++;
    }
  });

  const lowStockCount = state.medicines.filter(m => {
    const medStock = state.batches
      .filter(b => b.medicineId === m.id)
      .reduce((sum, b) => sum + b.currentQuantity, 0);
    return medStock <= m.minStockLevel;
  }).length;

  const pendingRxCount = state.prescriptions.filter(p => p.status === 'Pending').length;
  const supplierPayables = state.suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);
  const customerReceivables = state.customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // Top Selling Medicines calculation
  const medicineSalesMap: Record<number, { name: string; qty: number; revenue: number }> = {};
  state.sales.forEach(sale => {
    sale.items.forEach(it => {
      if (!medicineSalesMap[it.medicineId]) {
        medicineSalesMap[it.medicineId] = { name: it.medicineName, qty: 0, revenue: 0 };
      }
      medicineSalesMap[it.medicineId].qty += it.quantity;
      medicineSalesMap[it.medicineId].revenue += it.subtotal;
    });
  });
  const topSelling = Object.values(medicineSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Category Distribution
  const categoryCounts: Record<string, number> = {};
  state.medicines.forEach(m => {
    categoryCounts[m.categoryName] = (categoryCounts[m.categoryName] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Header / Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pharmacy Executive Operations Dashboard
          </h1>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>Operating Date: {todayStr}</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Inventory Valuation</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">FEFO Engine Active</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Open POS Terminal
          </button>
          <button
            onClick={() => onNavigate('prescriptions')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Prescriptions ({pendingRxCount})
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Today's Sales</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${todaySales.toFixed(2)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-600 font-medium">{todaySalesList.length} transactions</span>
            <span aria-hidden="true">·</span>
            <span>Net: ${netSales.toFixed(2)}</span>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Inventory Valuation</span>
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-md">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalInventoryValue.toFixed(2)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
            <span>{state.medicines.length} Catalog SKUs</span>
            <span aria-hidden="true">·</span>
            <span>{state.batches.length} Active Batches</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Low Stock Items</span>
            <span className={`p-1.5 rounded-md ${lowStockCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {lowStockCount}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
            <span>Under minimum threshold level</span>
          </div>
        </div>

        {/* Expired / Near Expiry Alerts */}
        <div 
          onClick={() => onNavigate('batches')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Critical Batch Expirations</span>
            <span className={`p-1.5 rounded-md ${expiredCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono tabular-nums flex items-baseline gap-2">
            <span>{expiredCount}</span>
            <span className="text-xs font-normal text-amber-600 font-sans">
              +{nearExpiry30Count} expiring &le;30d
            </span>
          </div>
          <div className="mt-1.5 text-xs text-rose-600 font-medium">
            {expiredCount > 0 ? 'FEFO has locked expired stock from POS' : 'All active inventory is valid'}
          </div>
        </div>
      </div>

      {/* Secondary Financial & Operational Status Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500">Today's Purchases</div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            ${todayPurchases.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500">Today's Expenses</div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            ${todayExpenses.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500">Supplier Payables (Due)</div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            ${supplierPayables.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500">Patient Receivables (Credit)</div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            ${customerReceivables.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Analytics & Trend Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Purchase Trends Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Revenue & Purchasing Activity
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Comparison of daily sales volume against inventory replenishments
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span className="text-slate-600">Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-600">Purchases</span>
              </div>
            </div>
          </div>

          {/* SVG Visual Graph */}
          <div className="mt-4 h-56 flex flex-col justify-end">
            <div className="h-44 w-full flex items-end gap-3 pt-6 border-b border-slate-200">
              {['Sep 24', 'Sep 25', 'Sep 26', 'Sep 27', 'Sep 28', 'Sep 29', 'Sep 30'].map((day, idx) => {
                const salesHeights = [45, 65, 30, 80, 55, 90, 75];
                const purchaseHeights = [20, 85, 0, 40, 15, 0, 50];
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div
                        style={{ height: `${salesHeights[idx]}%` }}
                        className="w-1/2 bg-emerald-600 rounded-t-sm group-hover:bg-emerald-500 transition-all"
                        title={`Sales: $${salesHeights[idx] * 4}`}
                      />
                      <div
                        style={{ height: `${purchaseHeights[idx]}%` }}
                        className="w-1/2 bg-blue-400 rounded-t-sm group-hover:bg-blue-300 transition-all"
                        title={`Purchases: $${purchaseHeights[idx] * 12}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Average Ticket Size: $28.40</span>
            <span className="text-emerald-600 font-semibold font-mono">+14.2% week-on-week</span>
          </div>
        </div>

        {/* Top Selling Medicines */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Top Selling Formulations
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Ranked by unit dispensing volume
            </div>
          </div>

          <div className="mt-3 space-y-3 flex-1 overflow-y-auto">
            {topSelling.map((med, idx) => (
              <div key={med.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-5 text-slate-400 font-mono font-medium">{idx + 1}.</span>
                  <div className="truncate">
                    <div className="font-semibold text-slate-900 truncate">{med.name}</div>
                    <div className="text-slate-500 text-[11px] font-mono">${med.revenue.toFixed(2)} generated</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{med.qty}</span>
                  <span className="text-slate-400 text-[11px] ml-1">units</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 hover:text-emerald-800 text-center w-full block cursor-pointer"
          >
            View Complete Formulary Analytics &rarr;
          </button>
        </div>
      </div>

      {/* Immediate Attention & Expiry Tiers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Near Expiry & Expired Batches Watchlist */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                FEFO Expiry Risk Monitor
              </h2>
              <div className="text-xs text-slate-500">
                Medicines requiring dispensing priority or quarantine
              </div>
            </div>
            <button
              onClick={() => onNavigate('batches')}
              className="text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              Batch Ledger
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {state.batches
              .filter(b => b.currentQuantity > 0)
              .map(b => {
                const expiry = new Date(b.expiryDate);
                const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const med = state.medicines.find(m => m.id === b.medicineId);
                return { ...b, days, medName: med ? med.name : 'Unknown' };
              })
              .sort((a, b) => a.days - b.days)
              .slice(0, 4)
              .map(b => {
                const isExp = b.days <= 0;
                const isNear = b.days > 0 && b.days <= 30;
                return (
                  <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {b.medName}
                        <span className="font-mono text-slate-500 font-normal">#{b.batchNumber}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Qty: <strong className="text-slate-800 font-mono">{b.currentQuantity}</strong> units in {b.locationRack || 'Store'}
                      </div>
                    </div>
                    <div className="text-right">
                      {isExp ? (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                          EXPIRED ({Math.abs(b.days)}d ago)
                        </span>
                      ) : isNear ? (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                          {b.days} days left
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">
                          {b.days} days left
                        </span>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">Exp: {b.expiryDate}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Pending Clinical Prescriptions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pending Clinical Prescriptions
              </h2>
              <div className="text-xs text-slate-500">
                Doctor orders awaiting pharmacist dispensing & counseling
              </div>
            </div>
            <button
              onClick={() => onNavigate('prescriptions')}
              className="text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              All Prescriptions
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {state.prescriptions.slice(0, 3).map(rx => (
              <div key={rx.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    {rx.prescriptionNumber}
                    <span className="text-slate-500">· {rx.customerName}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Prescribed by {rx.doctorName} ({rx.items.length} medicines)
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    rx.status === 'Pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    rx.status === 'Partially Dispensed' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                    'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {rx.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{rx.prescriptionDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
