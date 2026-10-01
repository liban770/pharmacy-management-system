import React, { useState } from 'react';
import { 
  Undo2, 
  Receipt, 
  Plus, 
  Search, 
  AlertTriangle, 
  DollarSign, 
  Check, 
  X,
  CreditCard,
  Building
} from 'lucide-react';
import { CustomerReturn, Expense, ExpenseCategory } from '../types/pharmacy';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';

interface ReturnsExpensesViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
}

export const ReturnsExpensesView: React.FC<ReturnsExpensesViewProps> = ({ state, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'returns' | 'expenses'>('returns');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Return Form State
  const [returnSaleId, setReturnSaleId] = useState<number>(state.sales[0]?.id || 0);
  const [returnMedId, setReturnMedId] = useState<number>(state.sales[0]?.items[0]?.medicineId || 0);
  const [returnBatchId, setReturnBatchId] = useState<number>(state.sales[0]?.items[0]?.batchAllocations[0]?.batchId || 0);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [disposition, setDisposition] = useState<'Restock' | 'Damage/Waste'>('Restock');
  const [returnReason, setReturnReason] = useState('Unopened sealed box returned by patient within 24 hours');

  // Expense Form State
  const [expenseData, setExpenseData] = useState({
    category: 'Electricity' as ExpenseCategory,
    amount: 150.00,
    expenseDate: new Date().toISOString().substring(0, 10),
    description: 'Cold-chain vaccine refrigerator electricity utility',
    paymentMethod: 'Bank Transfer' as any,
    referenceReceipt: 'BILL-UTIL-901'
  });

  const categories: ExpenseCategory[] = [
    'Electricity', 
    'Rent', 
    'Transportation', 
    'Salaries', 
    'Maintenance', 
    'Supplies', 
    'Software & Licences',
    'Other'
  ];

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = pharmacyDb.processCustomerReturn({
      saleId: returnSaleId,
      medicineId: returnMedId,
      batchId: returnBatchId,
      quantity: returnQty,
      disposition,
      reason: returnReason
    });

    if (!result.success || !result.returnRecord) {
      setErrorMsg(result.error || 'Failed to process customer return.');
      return;
    }

    setSuccessMsg(`Return #${result.returnRecord.returnNumber} processed successfully. Refund: $${result.returnRecord.refundAmount.toFixed(2)} (${disposition})`);
    setIsReturnModalOpen(false);
    onRefresh();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = await pharmacyDb.addExpense({
      ...expenseData,
      recordedBy: pharmacyDb.getCurrentUser().name
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to record expense.');
      return;
    }

    setSuccessMsg(`Expense of $${expenseData.amount.toFixed(2)} under ${expenseData.category} recorded.`);
    setIsExpenseModalOpen(false);
    onRefresh();
  };

  const selectedSale = state.sales.find(s => s.id === returnSaleId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer Returns & Operational Expenses
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Restock versus waste quarantine return workflows & pharmacy operating overhead ledger
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Returns ({state.customerReturns.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operational Expenses ({state.expenses.length})
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {activeTab === 'returns' ? (
        /* Customer Returns Module */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Prescription drug returns require clinical inspection before restock or disposal.
            </div>
            <button
              onClick={() => {
                if (state.sales.length > 0) {
                  setReturnSaleId(state.sales[0].id);
                  setReturnMedId(state.sales[0].items[0]?.medicineId || 0);
                  setReturnBatchId(state.sales[0].items[0]?.batchAllocations[0]?.batchId || 0);
                }
                setIsReturnModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Process Customer Return
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Return Number</th>
                    <th className="py-3 px-3">Original Invoice</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Returned Medicine</th>
                    <th className="py-3 px-3">Lot #</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-3 text-right">Refund Amount</th>
                    <th className="py-3 px-3">Disposition</th>
                    <th className="py-3 px-3">Justification</th>
                    <th className="py-3 px-4">Processed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.customerReturns.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No customer returns recorded yet.
                      </td>
                    </tr>
                  ) : (
                    state.customerReturns.map(ret => (
                      <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {ret.returnNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {ret.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {ret.customerName}
                        </td>
                        <td className="py-3 px-3 text-slate-800">
                          {ret.medicineName}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          #{ret.batchNumber}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {ret.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          ${ret.refundAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ret.disposition === 'Restock' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {ret.disposition}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                          {ret.reason}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {ret.processedBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Expenses Module */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Log utilities, cold-chain maintenance, store rents, and clinical supplies.
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Record Operational Expense
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3">Receipt Ref</th>
                    <th className="py-3 px-4">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No expenses logged.
                      </td>
                    </tr>
                  ) : (
                    state.expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {exp.expenseDate}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {exp.category}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {exp.description}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          ${exp.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {exp.paymentMethod}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                          {exp.referenceReceipt || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {exp.recordedBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Return Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm">Process Customer Return & Restock</div>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleProcessReturn} className="p-6 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded border border-rose-200 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Original Sale Invoice *</label>
                <select
                  value={returnSaleId}
                  onChange={e => {
                    const sid = Number(e.target.value);
                    setReturnSaleId(sid);
                    const s = state.sales.find(item => item.id === sid);
                    if (s && s.items.length > 0) {
                      setReturnMedId(s.items[0].medicineId);
                      setReturnBatchId(s.items[0].batchAllocations[0]?.batchId || 0);
                    }
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  {state.sales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.invoiceNumber} - {s.customerName} (${s.grandTotal.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSale && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Returned Medicine Line Item *</label>
                  <select
                    value={returnMedId}
                    onChange={e => {
                      const mid = Number(e.target.value);
                      setReturnMedId(mid);
                      const it = selectedSale.items.find(i => i.medicineId === mid);
                      if (it && it.batchAllocations.length > 0) {
                        setReturnBatchId(it.batchAllocations[0].batchId);
                      }
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    {selectedSale.items.map(it => (
                      <option key={it.medicineId} value={it.medicineId}>
                        {it.medicineName} ({it.quantity} purchased @ ${it.unitPrice.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Return Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={returnQty}
                    onChange={e => setReturnQty(parseInt(e.target.value) || 1)}
                    className="w-full p-2 font-mono font-bold border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Disposition *</label>
                  <select
                    value={disposition}
                    onChange={e => setDisposition(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none font-semibold"
                  >
                    <option value="Restock">Restock into Inventory</option>
                    <option value="Damage/Waste">Damage / Dispose (Quarantine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Return *</label>
                <textarea
                  rows={2}
                  required
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="Doctor dosage change, patient allergy, packaging defect..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Return & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm">Log Operational Overhead Expense</div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
                  <select
                    value={expenseData.category}
                    onChange={e => setExpenseData({ ...expenseData, category: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseData.amount}
                    onChange={e => setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 font-mono font-bold border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Vendor *</label>
                <input
                  type="text"
                  required
                  value={expenseData.description}
                  onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
                  placeholder="e.g. Monthly cold-chain backup electricity bill"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseData.expenseDate}
                    onChange={e => setExpenseData({ ...expenseData, expenseDate: e.target.value })}
                    className="w-full p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={expenseData.paymentMethod}
                    onChange={e => setExpenseData({ ...expenseData, paymentMethod: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
