import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Layers,
  Boxes,
  FileText,
  Truck,
  Users,
  UserSquare2,
  Undo2,
  BarChart3,
  History,
  CheckCircle2
} from 'lucide-react';
import { RoleName } from '../types/pharmacy';

export type TabKey =
  | 'dashboard'
  | 'pos'
  | 'medicines'
  | 'batches'
  | 'inventory'
  | 'prescriptions'
  | 'purchasing'
  | 'suppliers'
  | 'customers'
  | 'returns_expenses'
  | 'reports'
  | 'users'
  | 'audit'
  | 'tests'
  | 'codebase';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  userRole: RoleName;
}

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: RoleName[];
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole
}) => {
  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['admin', 'pharmacist', 'cashier', 'inventory_manager'] },
    { key: 'pos', label: 'POS Terminal', icon: ShoppingCart, allowedRoles: ['admin', 'pharmacist', 'cashier'], badge: 'FEFO' },
    { key: 'medicines', label: 'Medicines Catalog', icon: Pill, allowedRoles: ['admin', 'pharmacist', 'inventory_manager'] },
    { key: 'batches', label: 'Batches & Expiry', icon: Layers, allowedRoles: ['admin', 'pharmacist', 'inventory_manager'] },
    { key: 'inventory', label: 'Inventory & Stock', icon: Boxes, allowedRoles: ['admin', 'pharmacist', 'inventory_manager'] },
    { key: 'prescriptions', label: 'Prescriptions', icon: FileText, allowedRoles: ['admin', 'pharmacist'] },
    { key: 'purchasing', label: 'Purchasing & PO', icon: Truck, allowedRoles: ['admin', 'inventory_manager'] },
    { key: 'suppliers', label: 'Suppliers', icon: Users, allowedRoles: ['admin', 'inventory_manager'] },
    { key: 'customers', label: 'Patients / Customers', icon: UserSquare2, allowedRoles: ['admin', 'pharmacist', 'cashier'] },
    { key: 'returns_expenses', label: 'Returns & Expenses', icon: Undo2, allowedRoles: ['admin', 'pharmacist'] },
    { key: 'reports', label: 'Reports & Financials', icon: BarChart3, allowedRoles: ['admin', 'pharmacist'] },
    { key: 'users', label: 'Staff Accounts & RBAC', icon: UserSquare2, allowedRoles: ['admin'], badge: 'Admin' },
    { key: 'audit', label: 'Audit Trail', icon: History, allowedRoles: ['admin'] },
    { key: 'tests', label: 'Business Rule Tests', icon: CheckCircle2, allowedRoles: ['admin', 'pharmacist', 'cashier', 'inventory_manager'], badge: '12 Rules' }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Operations Console
        </div>
        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Active: <strong className="text-white capitalize">{userRole.replace('_', ' ')}</strong>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => {
          const isAllowed = item.allowedRoles.includes(userRole);
          const isActive = activeTab === item.key;
          const Icon = item.icon;

          if (!isAllowed) {
            return (
              <div
                key={item.key}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 text-xs cursor-not-allowed opacity-50"
                title={`Requires role: ${item.allowedRoles.join(', ')}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-600" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">Locked</span>
              </div>
            );
          }

          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500">
        <div className="font-medium text-slate-400">PharmOS Enterprise</div>
        <div className="text-slate-500 mt-0.5">Operations System</div>
      </div>
    </aside>
  );
};
