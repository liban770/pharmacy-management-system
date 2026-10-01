import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  User, 
  Receipt, 
  AlertCircle, 
  Check, 
  ShieldAlert, 
  Layers, 
  Printer, 
  FileText
} from 'lucide-react';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';
import { allocateBatchesFefo } from '../services/fefoEngine';
import { Sale, PaymentMethod } from '../types/pharmacy';

interface PosViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
  onViewReceipt: (sale: Sale) => void;
}

interface CartItem {
  medicineId: number;
  name: string;
  genericName: string;
  dosageForm: string;
  unitPrice: number;
  quantity: number;
  prescriptionRequired: boolean;
}

export const PosView: React.FC<PosViewProps> = ({ state, onRefresh, onViewReceipt }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [customerNameInput, setCustomerNameInput] = useState('Walk-in Customer');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Filter medicines for quick add grid
  const filteredMedicines = useMemo(() => {
    return state.medicines.filter(m => {
      if (m.status !== 'active') return false;
      if (selectedCategory !== 'all' && m.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesGeneric = m.genericName.toLowerCase().includes(q);
        const matchesSku = m.sku.toLowerCase().includes(q);
        const matchesBarcode = m.barcode.toLowerCase().includes(q);
        return matchesName || matchesGeneric || matchesSku || matchesBarcode;
      }
      return true;
    });
  }, [state.medicines, searchQuery, selectedCategory]);

  // Compute FEFO Allocations for Cart
  const cartWithFefo = useMemo(() => {
    return cart.map(item => {
      const batches = state.batches.filter(b => b.medicineId === item.medicineId);
      const fefoResult = allocateBatchesFefo(batches, item.quantity, item.name);
      return {
        ...item,
        fefoResult,
        itemSubtotal: item.quantity * item.unitPrice
      };
    });
  }, [cart, state.batches]);

  // Totals
  const subtotal = cartWithFefo.reduce((sum, item) => sum + item.itemSubtotal, 0);
  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const taxable = subtotal - discountAmount;
  const taxRate = 0.05; // 5%
  const taxAmount = Number((taxable * taxRate).toFixed(2));
  const grandTotal = Number((taxable + taxAmount).toFixed(2));

  const receivedNum = parseFloat(amountReceived) || 0;
  const changeDue = paymentMethod === 'Cash' && receivedNum >= grandTotal 
    ? Number((receivedNum - grandTotal).toFixed(2)) 
    : 0;

  // Add item to cart
  const addToCart = (med: any) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const existing = cart.find(c => c.medicineId === med.id);
    const requestedQty = existing ? existing.quantity + 1 : 1;

    // Check FEFO availability
    const batches = state.batches.filter(b => b.medicineId === med.id);
    const check = allocateBatchesFefo(batches, requestedQty, med.name);

    if (!check.success) {
      setErrorMsg(check.error || 'Cannot add item: stock unavailable.');
      return;
    }

    if (existing) {
      setCart(cart.map(c => c.medicineId === med.id ? { ...c, quantity: requestedQty } : c));
    } else {
      setCart([
        ...cart,
        {
          medicineId: med.id,
          name: med.name,
          genericName: med.genericName,
          dosageForm: med.dosageForm,
          unitPrice: med.sellingPrice,
          quantity: 1,
          prescriptionRequired: med.prescriptionRequired
        }
      ]);
    }
  };

  const updateQuantity = (medicineId: number, newQty: number) => {
    setErrorMsg(null);
    if (newQty <= 0) {
      setCart(cart.filter(c => c.medicineId !== medicineId));
      return;
    }

    const item = cart.find(c => c.medicineId === medicineId);
    if (!item) return;

    const batches = state.batches.filter(b => b.medicineId === medicineId);
    const check = allocateBatchesFefo(batches, newQty, item.name);

    if (!check.success) {
      setErrorMsg(check.error || 'Quantity exceeds available stock.');
      return;
    }

    setCart(cart.map(c => c.medicineId === medicineId ? { ...c, quantity: newQty } : c));
  };

  const removeFromCart = (medicineId: number) => {
    setCart(cart.filter(c => c.medicineId !== medicineId));
  };

  // Barcode quick scan
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const med = state.medicines.find(m => m.barcode === barcodeInput.trim() || m.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (med) {
      addToCart(med);
      setBarcodeInput('');
    } else {
      setErrorMsg(`Barcode "${barcodeInput}" does not match any registered product.`);
    }
  };

  // Handle Checkout
  const handleCheckout = async () => {
    setErrorMsg(null);
    if (cart.length === 0) {
      setErrorMsg('Cart is empty.');
      return;
    }

    // Verify any FEFO failures
    for (const item of cartWithFefo) {
      if (!item.fefoResult.success) {
        setErrorMsg(`Checkout blocked: ${item.fefoResult.error}`);
        return;
      }
    }

    // Cash check
    if (paymentMethod === 'Cash' && receivedNum < grandTotal) {
      setErrorMsg(`Insufficient cash tendered. Total is $${grandTotal.toFixed(2)}, entered $${receivedNum.toFixed(2)}.`);
      return;
    }

    // Prescription check
    const hasRxItem = cart.some(c => c.prescriptionRequired);
    if (hasRxItem && !selectedPrescriptionId) {
      const confirmNoRx = window.confirm(
        'One or more medicines in this cart require a prescription. Proceed without linking an official prescription record?'
      );
      if (!confirmNoRx) return;
    }

    const finalCustomerName = selectedCustomerId 
      ? state.customers.find(c => c.id === selectedCustomerId)?.name || customerNameInput
      : customerNameInput;

    const rxRecord = selectedPrescriptionId 
      ? state.prescriptions.find(p => p.id === selectedPrescriptionId) 
      : undefined;

    const result = await pharmacyDb.processSale({
      customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined,
      customerName: finalCustomerName,
      prescriptionId: selectedPrescriptionId ? Number(selectedPrescriptionId) : undefined,
      prescriptionNumber: rxRecord?.prescriptionNumber,
      items: cart.map(c => ({ medicineId: c.medicineId, quantity: c.quantity })),
      discountPercentage: discountPercent,
      taxRate,
      paymentMethod,
      amountReceived: paymentMethod === 'Cash' ? receivedNum : grandTotal,
      notes
    });

    if (!result.success || !result.sale) {
      setErrorMsg(result.error || 'Transaction failed.');
      return;
    }

    // Success!
    setSuccessMsg(`Transaction completed! Invoice #${result.sale.invoiceNumber} recorded.`);
    setCart([]);
    setAmountReceived('');
    setNotes('');
    onRefresh();
    onViewReceipt(result.sale);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Point of Sale (POS) Terminal
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300">
              FEFO Automatic Allocation
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Cashier checkout, real-time batch allocation, receipt generation & dispensing
          </div>
        </div>

        {/* Barcode Fast Scan Simulator */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode / SKU..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            Scan
          </button>
        </form>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="font-medium">{successMsg}</div>
        </div>
      )}

      {/* Main POS Interface Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Selection Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by brand name, generic active ingredient, SKU..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Category Segmented Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-md font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All Categories
              </button>
              {state.categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredMedicines.map(med => {
              const stockInfo = pharmacyDb.getMedicineStock(med.id);
              const isOutOfStock = stockInfo.validStock === 0;

              return (
                <div
                  key={med.id}
                  className={`bg-white p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isOutOfStock 
                      ? 'border-slate-200 opacity-60 bg-slate-50' 
                      : 'border-slate-200 hover:border-emerald-500 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-slate-900 leading-snug">
                        {med.name}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900 shrink-0">
                        ${med.sellingPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {med.genericName}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>{med.dosageForm}</span>
                      <span aria-hidden="true">·</span>
                      <span>{med.strength}</span>
                      {med.prescriptionRequired && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-semibold">Rx Only</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px]">
                      {isOutOfStock ? (
                        <span className="text-rose-600 font-semibold">Out of Stock</span>
                      ) : (
                        <span className="text-slate-600">
                          Stock: <strong className="font-mono text-emerald-700">{stockInfo.validStock}</strong> {med.unit}
                          {stockInfo.expiredStock > 0 && (
                            <span className="text-rose-600 ml-1">({stockInfo.expiredStock} exp locked)</span>
                          )}
                        </span>
                      )}
                    </div>

                    <button
                      disabled={isOutOfStock}
                      onClick={() => addToCart(med)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Cart & FEFO Allocation Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-700" />
              Active Order
              <span className="text-xs font-normal text-slate-500">
                ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List with FEFO Breakdown */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {cartWithFefo.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Cart is currently empty.
                <div className="text-slate-500 mt-1">
                  Click "+ Add" on medicines or scan barcodes to begin.
                </div>
              </div>
            ) : (
              cartWithFefo.map(item => (
                <div key={item.medicineId} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ${item.unitPrice.toFixed(2)} each
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                        ${item.itemSubtotal.toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.medicineId)}
                        className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Quantity adjustment buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-1 text-xs font-mono font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {item.prescriptionRequired && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Rx Required
                      </span>
                    )}
                  </div>

                  {/* FEFO Batch Allocation Trace */}
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] space-y-1">
                    <div className="text-[10px] font-semibold text-slate-600 flex items-center gap-1 uppercase tracking-wide">
                      <Layers className="w-3 h-3 text-emerald-600" />
                      FEFO Batch Allocation:
                    </div>
                    {item.fefoResult.allocations.map(alloc => (
                      <div key={alloc.batchId} className="flex items-center justify-between text-slate-700 font-mono">
                        <span>Batch {alloc.batchNumber} (Exp: {alloc.expiryDate})</span>
                        <span className="font-semibold text-emerald-700">+{alloc.quantity} units</span>
                      </div>
                    ))}
                    {item.fefoResult.expiredBatchesSkipped.length > 0 && (
                      <div className="text-[10px] text-rose-700 font-medium">
                        * {item.fefoResult.expiredBatchesSkipped.length} expired batch(es) safely locked out
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Prescription Link Bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Customer / Patient
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    const id = e.target.value ? Number(e.target.value) : '';
                    setSelectedCustomerId(id);
                    if (id) {
                      const c = state.customers.find(cust => cust.id === id);
                      if (c) setCustomerNameInput(c.name);
                    } else {
                      setCustomerNameInput('Walk-in Customer');
                    }
                  }}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                >
                  <option value="">Walk-in Customer</option>
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Link Prescription (Rx)
                </label>
                <select
                  value={selectedPrescriptionId}
                  onChange={e => setSelectedPrescriptionId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-md focus:outline-none"
                >
                  <option value="">None (OTC / Manual)</option>
                  {state.prescriptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.prescriptionNumber} - {p.customerName} ({p.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Payment Tender
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['Cash', 'Card', 'Mobile Money', 'Credit'] as PaymentMethod[]).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tender Input if Cash */}
            {paymentMethod === 'Cash' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  placeholder={`Tender (e.g. $${grandTotal.toFixed(2)})`}
                  className="flex-1 text-xs p-1.5 bg-white border border-slate-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setAmountReceived(grandTotal.toString())}
                  className="px-2 py-1 text-[11px] bg-slate-200 text-slate-700 rounded hover:bg-slate-300 font-semibold cursor-pointer"
                >
                  Exact
                </button>
              </div>
            )}
          </div>

          {/* Pricing Totals & Checkout Button */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums">${subtotal.toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                Discount:
                <select
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="text-[11px] bg-slate-100 border border-slate-200 rounded px-1 py-0.5"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                </select>
              </span>
              <span className="font-mono tabular-nums text-rose-600">
                -${discountAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tax (5%):</span>
              <span className="font-mono tabular-nums">${taxAmount.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono tabular-nums text-emerald-700">
                ${grandTotal.toFixed(2)}
              </span>
            </div>

            {paymentMethod === 'Cash' && receivedNum > 0 && (
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-50 p-1.5 rounded">
                <span>Change Due:</span>
                <span className="font-mono text-emerald-700">${changeDue.toFixed(2)}</span>
              </div>
            )}

            <button
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Complete Sale & Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
