import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Archive, 
  Eye, 
  Pill, 
  Filter, 
  ArrowUpDown, 
  Check, 
  AlertCircle, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Medicine, DosageForm } from '../types/pharmacy';
import { PharmacyDatabaseState, pharmacyDb } from '../services/pharmacyDb';

interface MedicinesViewProps {
  state: PharmacyDatabaseState;
  onRefresh: () => void;
}

export const MedicinesView: React.FC<MedicinesViewProps> = ({ state, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [dosageFilter, setDosageFilter] = useState<string | 'all'>('all');
  const [prescriptionFilter, setPrescriptionFilter] = useState<'all' | 'rx' | 'otc'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Partial<Medicine> | null>(null);
  const [viewingMed, setViewingMed] = useState<Medicine | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: '',
    genericName: '',
    brandName: '',
    sku: '',
    barcode: '',
    categoryId: 1,
    manufacturer: '',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Box of 100',
    purchasePrice: 0,
    sellingPrice: 0,
    minStockLevel: 20,
    prescriptionRequired: false,
    description: ''
  });

  const dosageForms: DosageForm[] = [
    'Tablet', 
    'Capsule', 
    'Syrup', 
    'Injection', 
    'Cream', 
    'Ointment', 
    'Drops', 
    'Inhaler', 
    'Suspension'
  ];

  // Filtering
  const filteredMedicines = useMemo(() => {
    return state.medicines.filter(m => {
      if (categoryFilter !== 'all' && m.categoryId !== categoryFilter) return false;
      if (dosageFilter !== 'all' && m.dosageForm !== dosageFilter) return false;
      if (prescriptionFilter === 'rx' && !m.prescriptionRequired) return false;
      if (prescriptionFilter === 'otc' && m.prescriptionRequired) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.barcode.includes(q) ||
          m.manufacturer.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [state.medicines, categoryFilter, dosageFilter, prescriptionFilter, search]);

  const totalPages = Math.ceil(filteredMedicines.length / pageSize) || 1;
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMedicines.slice(start, start + pageSize);
  }, [filteredMedicines, currentPage]);

  const openCreateModal = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setEditingMed(null);
    setFormData({
      name: '',
      genericName: '',
      brandName: '',
      sku: `MED-${Math.floor(100 + Math.random() * 900)}`,
      barcode: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
      categoryId: state.categories[0]?.id || 1,
      manufacturer: 'Global Pharma Corp',
      dosageForm: 'Tablet',
      strength: '500mg',
      unit: 'Box',
      purchasePrice: 10,
      sellingPrice: 18,
      minStockLevel: 20,
      prescriptionRequired: false,
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medicine) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setEditingMed(med);
    setFormData({ ...med });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = await pharmacyDb.saveMedicine({
      id: editingMed ? editingMed.id : undefined,
      ...formData
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to save medicine catalog record.');
      return;
    }

    setSuccessMsg(`Medicine "${formData.name}" successfully saved!`);
    setIsModalOpen(false);
    onRefresh();
  };

  const handleArchive = (med: Medicine) => {
    if (window.confirm(`Are you sure you want to archive "${med.name}"? Archiving preserves historical sales data.`)) {
      med.status = med.status === 'active' ? 'archived' : 'active';
      pharmacyDb.addAuditLog(
        'MEDICINE_ARCHIVE',
        'Medicine',
        med.id.toString(),
        `Toggled archive status of ${med.name} to ${med.status}`
      );
      pharmacyDb.save();
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Formulary & Medicine Management
          </h1>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>{state.medicines.length} Catalogued Medicines</span>
            <span aria-hidden="true">·</span>
            <span>Normalized Master Catalog</span>
            <span aria-hidden="true">·</span>
            <span>Rx & OTC Categorization</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + New Formulation
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

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, active ingredient, SKU, barcode..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
            >
              <option value="all">All Therapeutic Classes</option>
              {state.categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={prescriptionFilter}
              onChange={e => setPrescriptionFilter(e.target.value as any)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
            >
              <option value="all">All Legal Statuses (Rx & OTC)</option>
              <option value="rx">Prescription Required (Rx)</option>
              <option value="otc">Over-The-Counter (OTC)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Medicine & Generic Name</th>
                <th className="py-3 px-3">SKU / Barcode</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Dosage & Strength</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3">Rx Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMedicines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching medicines found in catalog.
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map(med => {
                  const stock = pharmacyDb.getMedicineStock(med.id);
                  const isLow = stock.totalStock <= med.minStockLevel;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{med.name}</div>
                        <div className="text-[11px] text-slate-500">{med.genericName}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>{med.sku}</div>
                        <div className="text-slate-400 text-[10px]">{med.barcode}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium">{med.categoryName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{med.dosageForm} ({med.strength})</div>
                        <div className="text-[10px] text-slate-400">{med.unit}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        ${med.purchasePrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        ${med.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {stock.validStock}
                        </span>
                        {stock.expiredStock > 0 && (
                          <div className="text-[10px] text-rose-600">
                            +{stock.expiredStock} exp
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {med.prescriptionRequired ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Rx Only
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            OTC
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingMed(med)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(med)}
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit Medicine"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchive(med)}
                            className={`p-1 rounded hover:bg-slate-100 cursor-pointer ${
                              med.status === 'archived' ? 'text-amber-600' : 'text-slate-400 hover:text-rose-600'
                            }`}
                            title="Toggle Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredMedicines.length)} of {filteredMedicines.length} formulations
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 disabled:opacity-50 text-slate-700 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 disabled:opacity-50 text-slate-700 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-400" />
                {editingMed ? `Edit: ${editingMed.name}` : 'Create New Medicine Formulation'}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Formulation / Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Amoxicillin 500mg"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Generic Active Ingredient *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.genericName || ''}
                    onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Amoxicillin Trihydrate"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. MED-AMX-500"
                    className="w-full text-xs p-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode (EAN/UPC) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barcode || ''}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 89010300101"
                    className="w-full text-xs p-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Therapeutic Category *
                  </label>
                  <select
                    value={formData.categoryId || 1}
                    onChange={e => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    {state.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dosage Form *
                  </label>
                  <select
                    value={formData.dosageForm || 'Tablet'}
                    onChange={e => setFormData({ ...formData, dosageForm: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none"
                  >
                    {dosageForms.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={formData.strength || ''}
                    onChange={e => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg, 10mg/5ml"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Packaging Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit || ''}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. Box of 100, Bottle of 60ml"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Purchase Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice || 0}
                    onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Selling Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice || 0}
                    onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Threshold Alert Qty
                  </label>
                  <input
                    type="number"
                    value={formData.minStockLevel || 10}
                    onChange={e => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 10 })}
                    className="w-full text-xs p-2 font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="rxReq"
                    checked={!!formData.prescriptionRequired}
                    onChange={e => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="rxReq" className="text-xs font-semibold text-slate-800">
                    Prescription Required (Rx Only)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturer / Brand House
                </label>
                <input
                  type="text"
                  value={formData.manufacturer || ''}
                  onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g. Pfizer Healthcare Logistics Inc."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical & Storage Directions
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Storage guidelines, contraindications, clinical notes..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Formulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-semibold text-sm">{viewingMed.name}</div>
              <button onClick={() => setViewingMed(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block">Generic Name</span>
                  <span className="font-semibold text-slate-800">{viewingMed.genericName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Category</span>
                  <span className="font-semibold text-slate-800">{viewingMed.categoryName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">SKU / Barcode</span>
                  <span className="font-mono text-slate-800">{viewingMed.sku} · {viewingMed.barcode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Manufacturer</span>
                  <span className="text-slate-800">{viewingMed.manufacturer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dosage & Strength</span>
                  <span className="text-slate-800">{viewingMed.dosageForm} - {viewingMed.strength}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pricing Matrix</span>
                  <span className="font-mono text-slate-800">Cost: ${viewingMed.purchasePrice.toFixed(2)} | Sell: ${viewingMed.sellingPrice.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Clinical Description</span>
                <p className="text-slate-700 mt-1">{viewingMed.description || 'No specific clinical notes provided.'}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setViewingMed(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
