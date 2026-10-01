import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  X, 
  Check, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { PurchaseOrder, Supplier, Medicine } from '../types/pharmacy';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';

interface PurchasingViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ state, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State for Receiving PO
  const [supplierId, setSupplierId] = useState<number>(state.suppliers[0]?.id || 1);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('Direct warehouse replenishment order');
  const [poItems, setPoItems] = useState([
    {
      medicineId: state.medicines[0]?.id || 1,
      batchNumber: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
      mfgDate: new Date().toISOString().substring(0, 10),
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
      quantity: 50,
      purchasePrice: 12.50,
      sellingPrice: 22.00
    }
  ]);

  const filteredPurchases = state.purchases.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.purchaseNumber.toLowerCase().includes(q) ||
      p.supplierName.toLowerCase().includes(q) ||
      p.items.some(i => i.medicineName.toLowerCase().includes(q) || i.batchNumber.toLowerCase().includes(q))
    );
  });

  const handleAddItemRow = () => {
    setPoItems([
      ...poItems,
      {
        medicineId: state.medicines[0]?.id || 1,
        batchNumber: `LOT-2026-${Math.floor(100 + Math.random() * 900)}`,
        mfgDate: new Date().toISOString().substring(0, 10),
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().substring(0, 10),
        quantity: 20,
        purchasePrice: 10,
        sellingPrice: 18
      }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (poItems.length === 1) return;
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...poItems];
    (updated[index] as any)[field] = val;

    // auto populate price if medicineId changed
    if (field === 'medicineId') {
      const med = state.medicines.find(m => m.id === Number(val));
      if (med) {
        updated[index].purchasePrice = med.purchasePrice;
        updated[index].sellingPrice = med.sellingPrice;
      }
    }

    setPoItems(updated);
  };

  const calculatedSubtotal = poItems.reduce((sum, it) => sum + (it.quantity * it.purchasePrice), 0);
  const calculatedTax = Number((calculatedSubtotal * 0.05).toFixed(2));
  const calculatedGrandTotal = Number((calculatedSubtotal + calculatedTax).toFixed(2));

  const handleReceiveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = await pharmacyDb.receivePurchaseOrder({
      supplierId,
      paymentMethod,
      paidAmount: paidAmount > 0 ? paidAmount : calculatedGrandTotal,
      notes,
      items: poItems
    });

    if (!result.success || !result.purchase) {
      setErrorMsg(result.error || 'Failed to receive shipment.');
      return;
    }

    setSuccessMsg(`Shipment received under Order #${result.purchase.purchaseNumber}. Batches and stock updated!`);
    setIsModalOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Procurement, Purchasing & Goods Receiving
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Strict regulatory receiving: Automatic batch provisioning, stock ledger increments, and vendor accounts payable
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPaidAmount(0);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Receive Purchase Shipment
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

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search PO #, supplier name, lot number..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-3">Supplier Vendor</th>
                <th className="py-3 px-3">Order Date</th>
                <th className="py-3 px-3">Received By</th>
                <th className="py-3 px-3 text-right">Items / Lots</th>
                <th className="py-3 px-3 text-right">Order Total</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3">Payment Terms</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No purchase orders recorded.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.purchaseNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {p.supplierName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {p.orderDate}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.receivedBy || 'Staff'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {p.items.length} lots ({p.items.reduce((s, i) => s + i.quantity, 0)} units)
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      ${p.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                      ${p.paidAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        p.paymentStatus === 'Partial' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPO(p)}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium cursor-pointer"
                      >
                        Inspect Lots
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect PO Lots Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">Goods Receipt: {selectedPO.purchaseNumber}</div>
                <div className="text-xs text-slate-400">Vendor: {selectedPO.supplierName}</div>
              </div>
              <button onClick={() => setSelectedPO(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs max-h-[70vh] overflow-y-auto">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {selectedPO.items.map(it => (
                  <div key={it.id} className="p-3 bg-white space-y-1">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>{it.medicineName}</span>
                      <span className="font-mono">${it.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                      <span>Lot #{it.batchNumber} (Exp: {it.expiryDate})</span>
                      <span>{it.quantity} units @ ${it.purchasePrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right font-mono font-bold text-slate-900 text-sm">
                Total Received Value: ${selectedPO.grandTotal.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Purchase Shipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Receive Goods & Generate Physical Batches
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleReceiveShipment} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Vendor *</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    {state.suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Terms (Net 30)">Credit Terms (Net 30)</option>
                    <option value="Immediate Cheque">Immediate Cheque</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                    placeholder={`Full: $${calculatedGrandTotal.toFixed(2)}`}
                    className="w-full p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    Formulations & Batch Lots Being Received:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-emerald-700 font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Formulation Row
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-6 gap-2 items-end">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Medicine Formulation</label>
                        <select
                          value={item.medicineId}
                          onChange={e => handleItemChange(idx, 'medicineId', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                        >
                          {state.medicines.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Batch / Lot #</label>
                        <input
                          type="text"
                          required
                          value={item.batchNumber}
                          onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                          className="w-full p-1.5 bg-white font-mono border border-slate-300 rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Expiry Date</label>
                        <input
                          type="date"
                          required
                          value={item.expiryDate}
                          onChange={e => handleItemChange(idx, 'expiryDate', e.target.value)}
                          className="w-full p-1.5 bg-white font-mono border border-slate-300 rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full p-1.5 bg-white font-mono font-bold border border-slate-300 rounded text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="flex-1">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cost ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.purchasePrice}
                            onChange={e => handleItemChange(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 bg-white font-mono border border-slate-300 rounded text-xs"
                          />
                        </div>
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded mb-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Calculations */}
              <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between text-xs">
                <span>Subtotal: ${calculatedSubtotal.toFixed(2)} · Tax (5%): ${calculatedTax.toFixed(2)}</span>
                <span className="font-bold text-sm text-slate-900 font-mono">
                  Grand Total: ${calculatedGrandTotal.toFixed(2)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Goods Receipt & Increment Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
