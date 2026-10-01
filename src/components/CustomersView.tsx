import React, { useState } from 'react';
import { 
  UserSquare2, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  Calendar,
  X,
  Check
} from 'lucide-react';
import { Customer } from '../types/pharmacy';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';

interface CustomersViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ state, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '1985-05-15',
    gender: 'Male',
    medicalNotes: '',
    allergies: 'None'
  });

  const filteredCustomers = state.customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.allergies && c.allergies.toLowerCase().includes(q))
    );
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await pharmacyDb.saveCustomer(formData);
    if (res.success) {
      setIsModalOpen(false);
      onRefresh();
    } else {
      alert(res.error || 'Failed to save customer profile.');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Patient & Customer Medical Profiles
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Prescription histories, dispensing archives, clinical allergy alerts & accounts receivable
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormData({
                name: '',
                phone: '+1 (555) ',
                email: '',
                address: '',
                dateOfBirth: '1990-01-01',
                gender: 'Male',
                medicalNotes: '',
                allergies: 'None'
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Register Patient Profile
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient name, mobile phone number, or known drug allergy..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.map(cust => {
          const patientSales = state.sales.filter(s => s.customerId === cust.id);
          const patientRx = state.prescriptions.filter(p => p.customerId === cust.id);
          const hasAllergies = cust.allergies && cust.allergies !== 'None';

          return (
            <div
              key={cust.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      {cust.name}
                      <span className="text-slate-400 font-normal text-xs">
                        ({cust.gender}, {cust.dateOfBirth ? `DOB: ${cust.dateOfBirth}` : ''})
                      </span>
                    </h2>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                      <span>{cust.phone}</span>
                      {cust.email && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{cust.email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {cust.outstandingBalance > 0 && (
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Balance: ${cust.outstandingBalance.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Allergy warning highlight */}
                {hasAllergies && (
                  <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Allergy Alert: <strong>{cust.allergies}</strong></span>
                  </div>
                )}

                {cust.medicalNotes && (
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400">Clinical History:</span> {cust.medicalNotes}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>Prescriptions: <strong className="text-slate-900 font-mono">{patientRx.length}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Dispensed Orders: <strong className="text-slate-900 font-mono">{patientSales.length}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Lifetime Spend: <strong className="text-slate-900 font-mono">${cust.totalSpent.toFixed(2)}</strong></span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] truncate max-w-xs">
                  {cust.address || 'Address on file'}
                </span>
                <button
                  onClick={() => setSelectedCustomer(cust)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Clinical History & Orders
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient Profile & History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">Patient Dossier: {selectedCustomer.name}</div>
                <div className="text-xs text-slate-400">Phone: {selectedCustomer.phone} · DOB: {selectedCustomer.dateOfBirth}</div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {selectedCustomer.allergies !== 'None' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Known Allergies: {selectedCustomer.allergies}
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-900 text-xs mb-2">Prescription Register:</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {state.prescriptions.filter(p => p.customerId === selectedCustomer.id).map(rx => (
                    <div key={rx.id} className="p-2.5 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{rx.prescriptionNumber}</div>
                        <div className="text-[11px] text-slate-500">Dr. {rx.doctorName} · {rx.prescriptionDate}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        rx.status === 'Dispensed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {rx.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-xs mb-2">Recent POS Sales / Dispensed Receipts:</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {state.sales.filter(s => s.customerId === selectedCustomer.id).map(sale => (
                    <div key={sale.id} className="p-2.5 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500">{sale.createdAt} · {sale.paymentMethod}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900">${sale.grandTotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm">Register Patient Profile</div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drug Allergies</label>
                <input
                  type="text"
                  value={formData.allergies || ''}
                  onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Sulfa drugs, None"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medical Notes</label>
                <textarea
                  rows={2}
                  value={formData.medicalNotes || ''}
                  onChange={e => setFormData({ ...formData, medicalNotes: e.target.value })}
                  placeholder="Chronic conditions, hypertension, diabetes..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
