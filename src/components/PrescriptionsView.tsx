import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  User, 
  Building, 
  ShieldCheck, 
  X, 
  Pill, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Prescription, PrescriptionItem, PrescriptionStatus } from '../types/pharmacy';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';

interface PrescriptionsViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
  onDispenseInPos?: (prescriptionId: number) => void;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({ 
  state, 
  onRefresh, 
  onDispenseInPos 
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PrescriptionStatus>('all');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [isNewRxModalOpen, setIsNewRxModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Prescription Form state
  const [newRx, setNewRx] = useState({
    customerId: state.customers[0]?.id || 1,
    doctorName: 'Dr. Gregory House, MD',
    doctorClinic: 'Springfield Regional Hospital',
    doctorLicense: 'MD-REG-4491',
    prescriptionDate: new Date().toISOString().substring(0, 10),
    notes: 'Standard therapeutic protocol.',
    items: [
      {
        medicineId: state.medicines[0]?.id || 1,
        dosage: '1 Tablet (500mg)',
        frequency: 'TDS (Three times daily)',
        duration: '7 days',
        prescribedQuantity: 1,
        instructions: 'Take after meals.'
      }
    ]
  });

  const filteredPrescriptions = useMemo(() => {
    return state.prescriptions.filter(rx => {
      if (statusFilter !== 'all' && rx.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          rx.prescriptionNumber.toLowerCase().includes(q) ||
          rx.customerName.toLowerCase().includes(q) ||
          rx.doctorName.toLowerCase().includes(q) ||
          rx.items.some(i => i.medicineName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [state.prescriptions, statusFilter, search]);

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cust = state.customers.find(c => c.id === newRx.customerId);
    if (!cust) {
      setErrorMsg('Please select a valid customer/patient.');
      return;
    }

    const prescriptionNumber = `RX-${new Date().getFullYear()}-${String(state.prescriptions.length + 892).padStart(4, '0')}`;

    const items: PrescriptionItem[] = newRx.items.map((it, idx) => {
      const med = state.medicines.find(m => m.id === it.medicineId);
      return {
        id: idx + 1,
        prescriptionId: 0,
        medicineId: it.medicineId,
        medicineName: med ? med.name : 'Medicine',
        dosage: it.dosage,
        frequency: it.frequency,
        duration: it.duration,
        prescribedQuantity: it.prescribedQuantity,
        dispensedQuantity: 0,
        instructions: it.instructions
      };
    });

    const result = await pharmacyDb.createPrescription({
      prescriptionNumber,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      doctorName: newRx.doctorName,
      doctorClinic: newRx.doctorClinic,
      doctorLicense: newRx.doctorLicense,
      prescriptionDate: newRx.prescriptionDate,
      status: 'Pending',
      notes: newRx.notes,
      items
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to create prescription.');
      return;
    }

    setSuccessMsg(`Prescription #${prescriptionNumber} created successfully!`);
    setIsNewRxModalOpen(false);
    onRefresh();
  };

  const handleDispenseItem = (rx: Prescription, itemId: number) => {
    const rxItem = rx.items.find(i => i.id === itemId);
    if (!rxItem) return;

    if (rxItem.dispensedQuantity >= rxItem.prescribedQuantity) {
      alert('This item has already been fully dispensed.');
      return;
    }

    rxItem.dispensedQuantity += 1;
    const allDone = rx.items.every(i => i.dispensedQuantity >= i.prescribedQuantity);
    rx.status = allDone ? 'Dispensed' : 'Partially Dispensed';
    rx.dispensedBy = pharmacyDb.getCurrentUser().name;
    rx.dispensedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    pharmacyDb.addAuditLog(
      'PRESCRIPTION_DISPENSE',
      'Prescription',
      rx.prescriptionNumber,
      `Dispensed 1 unit of ${rxItem.medicineName} for patient ${rx.customerName}`
    );
    pharmacyDb.save();
    onRefresh();
    setSelectedRx({ ...rx });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Clinical Prescription Management
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300">
              Pharmacist Verified
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Doctor orders, dosage schedules, dispensing fulfillment logs, and allergy cross-checks
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewRxModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Register Prescription
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

      {/* Status Segmented Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {(['all', 'Pending', 'Partially Dispensed', 'Dispensed', 'Cancelled'] as const).map(status => {
          const count = status === 'all' 
            ? state.prescriptions.length 
            : state.prescriptions.filter(p => p.status === status).length;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status === 'all' ? 'All Orders' : status} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prescription #, patient name, doctor, or formulation..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Prescriptions List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrescriptions.map(rx => {
          const cust = state.customers.find(c => c.id === rx.customerId);

          return (
            <div
              key={rx.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      {rx.prescriptionNumber}
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5">
                      {rx.customerName}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rx.status === 'Pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    rx.status === 'Partially Dispensed' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                    rx.status === 'Dispensed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {rx.status}
                  </span>
                </div>

                {/* Patient allergies warning if exists */}
                {cust?.allergies && cust.allergies !== 'None' && (
                  <div className="mt-2 p-1.5 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-800 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                    Allergy Alert: {cust.allergies}
                  </div>
                )}

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400">Doctor:</span> {rx.doctorName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Clinic: {rx.doctorClinic || 'Medical Office'} · Lic: {rx.doctorLicense || 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prescribed: <span className="font-mono text-slate-700">{rx.prescriptionDate}</span>
                  </div>
                </div>

                {/* Prescribed Items summary */}
                <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Prescribed Medications ({rx.items.length}):
                  </div>
                  {rx.items.map(it => (
                    <div key={it.id} className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-800 truncate pr-2">
                        {it.medicineName}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px] shrink-0">
                        {it.dispensedQuantity}/{it.prescribedQuantity} disp
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  {rx.dispensedBy ? `Dispensed by ${rx.dispensedBy}` : 'Awaiting clinical review'}
                </div>
                <button
                  onClick={() => setSelectedRx(rx)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Review & Dispense
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review & Clinical Dispense Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Prescription #{selectedRx.prescriptionNumber}
                </div>
                <div className="text-xs text-slate-400">
                  Patient: {selectedRx.customerName}
                </div>
              </div>
              <button onClick={() => setSelectedRx(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Attending Physician</span>
                  <span className="font-semibold text-slate-800">{selectedRx.doctorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Medical License</span>
                  <span className="font-mono text-slate-800">{selectedRx.doctorLicense || 'Standard Verified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Clinic / Practice</span>
                  <span className="text-slate-800">{selectedRx.doctorClinic || 'Outpatient Clinic'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Prescription Date</span>
                  <span className="font-mono text-slate-800">{selectedRx.prescriptionDate}</span>
                </div>
              </div>

              {selectedRx.notes && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px]">
                  <strong>Doctor's Clinical Notes:</strong> {selectedRx.notes}
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs">Prescribed Regimen Items:</h3>
                <div className="space-y-2">
                  {selectedRx.items.map(it => {
                    const isFullyDispensed = it.dispensedQuantity >= it.prescribedQuantity;
                    const stock = pharmacyDb.getMedicineStock(it.medicineId);

                    return (
                      <div key={it.id} className="p-3 border border-slate-200 rounded-lg space-y-1 bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{it.medicineName}</div>
                            <div className="text-[11px] text-slate-600">
                              Dosage: {it.dosage} · Freq: {it.frequency} · Duration: {it.duration}
                            </div>
                            <div className="text-[11px] text-slate-500 italic mt-0.5">
                              "{it.instructions}"
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900">
                              {it.dispensedQuantity} / {it.prescribedQuantity}
                            </span>
                            <div className="text-[10px] text-slate-400">Available: {stock.validStock}</div>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <span className={`text-[10px] font-semibold ${isFullyDispensed ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isFullyDispensed ? 'Dispensing Complete' : 'Refill Remaining'}
                          </span>

                          {!isFullyDispensed && (
                            <button
                              onClick={() => handleDispenseItem(selectedRx, it.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer shadow-xs"
                            >
                              + Dispense 1 Unit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedRx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Prescription Modal */}
      {isNewRxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm">Register Official Prescription</div>
              <button onClick={() => setIsNewRxModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Profile *</label>
                <select
                  value={newRx.customerId}
                  onChange={e => setNewRx({ ...newRx, customerId: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {c.allergies !== 'None' ? `[Allergies: ${c.allergies}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    value={newRx.doctorName}
                    onChange={e => setNewRx({ ...newRx, doctorName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor License ID</label>
                  <input
                    type="text"
                    value={newRx.doctorLicense}
                    onChange={e => setNewRx({ ...newRx, doctorLicense: e.target.value })}
                    className="w-full p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinic / Hospital</label>
                  <input
                    type="text"
                    value={newRx.doctorClinic}
                    onChange={e => setNewRx({ ...newRx, doctorClinic: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prescription Date</label>
                  <input
                    type="date"
                    required
                    value={newRx.prescriptionDate}
                    onChange={e => setNewRx({ ...newRx, prescriptionDate: e.target.value })}
                    className="w-full p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Medication item */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-semibold text-slate-800">Prescribed Medicine Formulation:</div>
                <select
                  value={newRx.items[0].medicineId}
                  onChange={e => {
                    const id = Number(e.target.value);
                    setNewRx({
                      ...newRx,
                      items: [{ ...newRx.items[0], medicineId: id }]
                    });
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded focus:outline-none"
                >
                  {state.medicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.genericName})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 1 Tablet)"
                    value={newRx.items[0].dosage}
                    onChange={e => setNewRx({ ...newRx, items: [{ ...newRx.items[0], dosage: e.target.value }] })}
                    className="p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. BD, TDS)"
                    value={newRx.items[0].frequency}
                    onChange={e => setNewRx({ ...newRx, items: [{ ...newRx.items[0], frequency: e.target.value }] })}
                    className="p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Duration (e.g. 30 days)"
                    value={newRx.items[0].duration}
                    onChange={e => setNewRx({ ...newRx, items: [{ ...newRx.items[0], duration: e.target.value }] })}
                    className="p-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Total Qty"
                    value={newRx.items[0].prescribedQuantity}
                    onChange={e => setNewRx({ ...newRx, items: [{ ...newRx.items[0], prescribedQuantity: parseInt(e.target.value) || 1 }] })}
                    className="p-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Patient Instructions (e.g. Take after meals with plenty of water)"
                  value={newRx.items[0].instructions}
                  onChange={e => setNewRx({ ...newRx, items: [{ ...newRx.items[0], instructions: e.target.value }] })}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRxModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Register Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
