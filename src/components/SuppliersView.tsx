import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  DollarSign, 
  Edit3, 
  X, 
  Check, 
  Building2 
} from 'lucide-react';
import { Supplier } from '../types/pharmacy';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';

interface SuppliersViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ state, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    contactPerson: '',
    taxNumber: '',
    paymentTerms: 'Net 30'
  });

  const filteredSuppliers = state.suppliers.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.company.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q)
    );
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      company: '',
      phone: '+1 (800) 555-0100',
      email: 'orders@supplier.com',
      address: 'Industrial Distribution Park',
      contactPerson: 'Account Manager',
      taxNumber: 'US-EIN-99-00192',
      paymentTerms: 'Net 30'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await pharmacyDb.saveSupplier({
      id: editingSupplier ? editingSupplier.id : undefined,
      ...formData
    });
    if (res.success) {
      setIsModalOpen(false);
      onRefresh();
    } else {
      alert(res.error || 'Failed to save supplier profile.');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pharmaceutical Supplier & Vendor Accounts
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Vendor accounts payable, credit terms, and purchasing transaction statements
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + New Supplier
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor name, corporate entity, contact representative..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Suppliers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.map(s => {
          const supplierPurchases = state.purchases.filter(p => p.supplierId === s.id);

          return (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-bold text-sm text-slate-900 leading-tight">
                      {s.name}
                    </h2>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {s.company} · {s.taxNumber}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {s.paymentTerms}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {s.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {s.email}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Contact: <strong>{s.contactPerson}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                      Outstanding Payable
                    </div>
                    <div className={`font-mono text-base font-bold ${s.outstandingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      ${s.outstandingBalance.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Lifetime: ${s.totalPurchases.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">
                  {supplierPurchases.length} Purchase Invoices
                </span>
                <button
                  onClick={() => setSelectedSupplier(s)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  View Statement & History
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Statement & Purchase History Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">Vendor Statement: {selectedSupplier.name}</div>
                <div className="text-xs text-slate-400">{selectedSupplier.company} · {selectedSupplier.taxNumber}</div>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Primary Contact</span>
                  <span className="font-semibold text-slate-900">{selectedSupplier.contactPerson}</span>
                  <div className="text-[11px] text-slate-500">{selectedSupplier.phone} · {selectedSupplier.email}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Outstanding Due</span>
                  <span className="font-mono text-base font-bold text-amber-700">${selectedSupplier.outstandingBalance.toFixed(2)}</span>
                  <div className="text-[11px] text-slate-500">Terms: {selectedSupplier.paymentTerms}</div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-xs mb-2">Purchase History & Deliveries:</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {state.purchases.filter(p => p.supplierId === selectedSupplier.id).map(po => (
                    <div key={po.id} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{po.purchaseNumber}</div>
                        <div className="text-[11px] text-slate-500">Date: {po.orderDate} · {po.items.length} lots received</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">${po.grandTotal.toFixed(2)}</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          po.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {po.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm">Register Vendor / Supplier</div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier Brand Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pfizer Distribution Hub"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Legal Entity *</label>
                <input
                  type="text"
                  required
                  value={formData.company || ''}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Pfizer Healthcare Logistics Inc."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax / Reg Number</label>
                  <input
                    type="text"
                    value={formData.taxNumber || ''}
                    onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                    className="w-full p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms || 'Net 30'}
                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Immediate">Immediate / COD</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
