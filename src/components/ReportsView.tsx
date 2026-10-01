import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Filter, 
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';

interface ReportsViewProps {
  state: PharmacyDatabaseState;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state }) => {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'financial' | 'purchases'>('financial');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  // Compute Financial Ledger
  const financialSummary = useMemo(() => {
    let salesList = state.sales;
    if (dateFilter === 'today') {
      const today = new Date().toISOString().substring(0, 10);
      salesList = salesList.filter(s => s.createdAt.startsWith(today));
    }

    const totalRevenue = salesList.reduce((sum, s) => sum + s.grandTotal, 0);

    // Calculate COGS using deducted batches purchase prices
    let cogs = 0;
    salesList.forEach(sale => {
      sale.items.forEach(item => {
        item.batchAllocations.forEach(alloc => {
          const batch = state.batches.find(b => b.id === alloc.batchId);
          const cost = batch ? batch.purchasePrice : 0;
          cogs += alloc.quantity * cost;
        });
      });
    });

    const grossProfit = totalRevenue - cogs;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    const customerReturns = state.customerReturns.reduce((sum, r) => sum + r.refundAmount, 0);
    const netProfit = grossProfit - totalExpenses - customerReturns;

    const supplierPayables = state.suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);
    const customerReceivables = state.customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

    return {
      totalRevenue,
      cogs,
      grossProfit,
      grossMarginPercent,
      totalExpenses,
      customerReturns,
      netProfit,
      supplierPayables,
      customerReceivables
    };
  }, [state.sales, state.expenses, state.customerReturns, state.batches, state.suppliers, state.customers, dateFilter]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    state.sales.forEach(s => {
      if (!map[s.paymentMethod]) {
        map[s.paymentMethod] = { count: 0, total: 0 };
      }
      map[s.paymentMethod].count++;
      map[s.paymentMethod].total += s.grandTotal;
    });
    return map;
  }, [state.sales]);

  // Export to CSV helper
  const exportToCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (reportType === 'sales') {
      csvContent += "Invoice Number,Date,Customer,Subtotal,Discount,Tax,Grand Total,Payment Method,Cashier\n";
      state.sales.forEach(s => {
        csvContent += `"${s.invoiceNumber}","${s.createdAt}","${s.customerName}",${s.subtotal},${s.discountAmount},${s.taxAmount},${s.grandTotal},"${s.paymentMethod}","${s.cashierName}"\n`;
      });
    } else if (reportType === 'inventory') {
      csvContent += "SKU,Medicine Name,Generic Name,Category,Sellable Stock,Min Threshold,Cost Price,Sell Price,Valuation\n";
      state.medicines.forEach(m => {
        const stock = pharmacyDb.getMedicineStock(m.id);
        const val = stock.validStock * m.purchasePrice;
        csvContent += `"${m.sku}","${m.name}","${m.genericName}","${m.categoryName}",${stock.validStock},${m.minStockLevel},${m.purchasePrice},${m.sellingPrice},${val}\n`;
      });
    } else {
      csvContent += "Financial Metric,Value (USD)\n";
      csvContent += `Total Revenue,${financialSummary.totalRevenue}\n`;
      csvContent += `Cost of Goods Sold (COGS),${financialSummary.cogs}\n`;
      csvContent += `Gross Profit,${financialSummary.grossProfit}\n`;
      csvContent += `Gross Margin %,${financialSummary.grossMarginPercent.toFixed(2)}%\n`;
      csvContent += `Total Expenses,${financialSummary.totalExpenses}\n`;
      csvContent += `Customer Returns/Refunds,${financialSummary.customerReturns}\n`;
      csvContent += `Net Operating Profit,${financialSummary.netProfit}\n`;
      csvContent += `Supplier Accounts Payable,${financialSummary.supplierPayables}\n`;
      csvContent += `Patient Accounts Receivable,${financialSummary.customerReceivables}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pharmos_${reportType}_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Financial & Pharmacy Operations Reporting Center
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Profitability ledgers, cost-of-goods, payment tender splits, and CSV export
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export to CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Formal Report
          </button>
        </div>
      </div>

      {/* Report Segmented Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setReportType('financial')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              reportType === 'financial' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Financial P&L Ledger
          </button>
          <button
            onClick={() => setReportType('sales')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              reportType === 'sales' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales Transactions Breakdown
          </button>
          <button
            onClick={() => setReportType('inventory')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              reportType === 'inventory' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory Valuation & Aging
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Period:</span>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Available Records</option>
            <option value="today">Today's Transactions</option>
          </select>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Gross Revenue</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${financialSummary.totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dispensed sales volume</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Cost of Goods Sold (COGS)</div>
          <div className="mt-1 text-2xl font-bold text-slate-700 font-mono tabular-nums">
            ${financialSummary.cogs.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Batch acquisition cost</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Gross Margin</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            ${financialSummary.grossProfit.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 font-mono">
            {financialSummary.grossMarginPercent.toFixed(1)}% Gross Margin
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Net Operating Profit</div>
          <div className={`mt-1 text-2xl font-bold font-mono tabular-nums ${financialSummary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ${financialSummary.netProfit.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">After expenses & returns</div>
        </div>
      </div>

      {/* Main Tab View */}
      {reportType === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detailed Financial Statement Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Pharmacy Statement of Operations (P&L)
            </h2>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5 font-semibold text-slate-900">
                <span>Gross Revenue from Medicines</span>
                <span className="font-mono">${financialSummary.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Less: Cost of Goods Sold (FEFO Batch Basis)</span>
                <span className="font-mono text-rose-600">-${financialSummary.cogs.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-emerald-800 bg-emerald-50/50 px-2 rounded">
                <span>Gross Profit</span>
                <span className="font-mono">${financialSummary.grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Less: Operating Overhead Expenses</span>
                <span className="font-mono text-rose-600">-${financialSummary.totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-600">
                <span>Less: Patient Returns / Refunds</span>
                <span className="font-mono text-rose-600">-${financialSummary.customerReturns.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2.5 font-bold text-sm text-slate-900 border-t-2 border-slate-300">
                <span>Net Operating Income</span>
                <span className="font-mono text-emerald-700">${financialSummary.netProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                Payment Tender Distribution
              </h2>
              <div className="mt-3 space-y-3">
                {Object.entries(paymentBreakdown).map(([method, data]) => {
                  const pct = financialSummary.totalRevenue > 0 
                    ? ((data.total / financialSummary.totalRevenue) * 100).toFixed(1) 
                    : '0';

                  return (
                    <div key={method} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-800">{method}</span>
                        <span className="font-mono font-bold text-slate-900">
                          ${data.total.toFixed(2)} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="bg-emerald-600 h-full rounded-full"
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {data.count} transactions completed
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Vendor Payables Due</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${financialSummary.supplierPayables.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Patient Receivables</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${financialSummary.customerReceivables.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800">
            Sales Transactions Journal ({state.sales.length} records)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Tax</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3">Tender</th>
                  <th className="py-2.5 px-4">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {state.sales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{s.invoiceNumber}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.createdAt}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800">{s.customerName}</td>
                    <td className="py-2.5 px-3 text-right">${s.subtotal.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600">-${s.discountAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">${s.taxAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">${s.grandTotal.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-sans">{s.paymentMethod}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">{s.cashierName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800">
            Inventory Valuation & Stock Aging
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <th className="py-2.5 px-4">Medicine Item</th>
                  <th className="py-2.5 px-3">Therapeutic Category</th>
                  <th className="py-2.5 px-3 text-right">Physical Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Acquisition Cost</th>
                  <th className="py-2.5 px-3 text-right">Retail Sell Price</th>
                  <th className="py-2.5 px-3 text-right">Current Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {state.medicines.map(m => {
                  const stock = pharmacyDb.getMedicineStock(m.id);
                  const assetVal = stock.totalStock * m.purchasePrice;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{m.name}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">{m.categoryName}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">{stock.totalStock} {m.unit}</td>
                      <td className="py-2.5 px-3 text-right">${m.purchasePrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">${m.sellingPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">${assetVal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
