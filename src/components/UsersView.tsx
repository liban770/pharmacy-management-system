import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Phone, 
  Mail, 
  Trash2, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { User as UserType, RoleName } from '../types/pharmacy';
import { api } from '../services/apiClient';

interface UsersViewProps {
  users: UserType[];
  currentUser: UserType;
  onRefresh: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleName>('cashier');
  const [phone, setPhone] = useState('');

  const roleDescriptions: Record<RoleName, { title: string; color: string; desc: string; allowed: string[]; restricted: string[] }> = {
    admin: {
      title: 'Administrator',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      desc: 'Complete administrative control across all dispensary, clinical, and financial modules.',
      allowed: ['All Modules', 'User Management', 'Audit Trail', 'Financial Reports'],
      restricted: []
    },
    pharmacist: {
      title: 'Licensed Pharmacist',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'Authorized to review and dispense medical prescriptions, oversee batches, and perform POS sales.',
      allowed: ['Prescriptions', 'Clinical Dispensing', 'POS Checkout', 'Medicines & Batches', 'Returns'],
      restricted: ['Purchasing & PO', 'Suppliers Management', 'Staff / RBAC Control', 'Audit Logs']
    },
    cashier: {
      title: 'Pharmacy Cashier',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      desc: 'Dedicated point-of-sale operator for processing customer payments and printing receipts.',
      allowed: ['POS Terminal', 'Patient / Customer Lookup', 'Cash / Card / Mobile Money Checkout'],
      restricted: ['Medicine Catalog Edits', 'Stock Adjustments', 'Purchasing', 'Financial Reports', 'Staff Control', 'Audit Logs']
    },
    inventory_manager: {
      title: 'Inventory & Supply Manager',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Responsible for goods receiving, batch expiration audits, supplier POs, and stock adjustments.',
      allowed: ['Purchasing & PO', 'Suppliers Management', 'Goods Receiving', 'Batch Expiry Audits', 'Stock Adjustments'],
      restricted: ['POS Terminal Checkout', 'Prescription Dispensing', 'Staff Control', 'Audit Logs']
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.saveUser({
        name,
        email,
        password,
        role,
        phone
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to create user account.');
      }

      setSuccessMsg(`Staff account for ${name} (${roleDescriptions[role].title}) was created successfully in MySQL!`);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setShowAddModal(false);
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error creating user in MySQL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    if (user.id === 1 || user.role === 'admin') {
      alert('The primary administrator account cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete staff account "${user.name}"?`)) {
      return;
    }

    try {
      const res = await api.deleteUser(user.id);
      if (!res.success) throw new Error(res.error || 'Failed to delete user.');
      setSuccessMsg(`Staff account "${user.name}" has been removed from MySQL.`);
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error deleting user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Staff Accounts & Role-Based Access Control (RBAC)</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              MySQL Authenticated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administrators can create staff accounts and enforce strict operational boundaries in MySQL.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Create New Staff Member
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((u) => {
          const roleInfo = roleDescriptions[u.role] || roleDescriptions.cashier;
          const isPrimaryAdmin = u.id === 1;

          return (
            <div 
              key={u.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {u.name}
                        {isPrimaryAdmin && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded border border-purple-200">
                            Superadmin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {u.email}
                      </div>
                    </div>
                  </div>

                  {!isPrimaryAdmin && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Staff Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Role Badge */}
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleInfo.color}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {roleInfo.title}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {roleInfo.desc}
                  </p>
                </div>

                {/* Permissions Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Allowed Operations
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {roleInfo.allowed.map((a, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {roleInfo.restricted.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-500" />
                        Restricted / Locked Modules
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {roleInfo.restricted.map((r, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{u.phone || 'No phone'}</span>
                </div>
                <div>
                  Status: <span className="text-emerald-700 font-medium capitalize">{u.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Create Staff Account</h2>
                <p className="text-xs text-slate-500">New user will be added directly into MySQL users table</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Alex Vance / John Doe"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username or Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. cashier1 / alex@pharmos.health"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Login Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Assign System Role (Enforces RBAC Permissions) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['cashier', 'pharmacist', 'inventory_manager', 'admin'] as RoleName[]).map((r) => {
                    const rInfo = roleDescriptions[r];
                    const isSelected = role === r;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600' 
                            : 'border-slate-200 bg-slate-50 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                          <span>{rInfo.title}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                          {rInfo.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving to MySQL...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
