import React from 'react';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { Sale } from '../types/pharmacy';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Official POS Receipt
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thermal Receipt Paper Container */}
        <div className="p-6 bg-slate-50 overflow-y-auto max-h-[75vh]">
          <div id="printable-receipt" className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs font-mono text-xs text-slate-800 space-y-4">
            {/* Pharmacy Brand Lockup */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="font-bold text-sm text-slate-900 tracking-tight font-sans">
                PHARMOS HEALTH DISPENSARY
              </div>
              <div className="text-[11px] text-slate-500 font-sans">
                Community & Clinical Pharmacy Practice
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Lic: RX-2026-REG-9912 | Tax: US-EIN-13-1992210
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                235 E 42nd St, Suite 400 · Tel: +1 (800) 555-0199
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span>{sale.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient/Customer:</span>
                <span className="font-semibold">{sale.customerName}</span>
              </div>
              {sale.prescriptionNumber && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Prescription Ref:</span>
                  <span>{sale.prescriptionNumber}</span>
                </div>
              )}
            </div>

            {/* Itemized Lines */}
            <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
              <div className="text-[10px] font-semibold text-slate-400 uppercase flex justify-between">
                <span>Description / Batch</span>
                <span>Total</span>
              </div>

              {sale.items.map(item => (
                <div key={item.id} className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>{item.medicineName}</span>
                    <span>${item.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      {item.quantity} x ${item.unitPrice.toFixed(2)}
                    </span>
                    <span>
                      {item.batchAllocations.map(b => `#${b.batchNumber}`).join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>${sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount ({sale.discountPercentage}%):</span>
                  <span>-${sale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Sales Tax (5%):</span>
                <span>${sale.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>${sale.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Tender:</span>
                <span className="font-semibold">{sale.paymentMethod}</span>
              </div>
              {sale.paymentMethod === 'Cash' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cash Received:</span>
                    <span>${sale.amountReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Change Due:</span>
                    <span>${sale.changeGiven.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Compliance Footer */}
            <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-dashed border-slate-300 space-y-1">
              <div className="flex items-center justify-center gap-1 text-slate-600 font-semibold font-sans">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                FEFO Quality & Batch Certified
              </div>
              <div>Please keep this receipt for drug compliance records.</div>
              <div>Store prescription medicines away from heat and direct sunlight.</div>
              <div className="font-sans font-bold text-slate-900 pt-1">Thank you for your visit!</div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Close Window
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
