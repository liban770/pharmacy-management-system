import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { MedicinesView } from './components/MedicinesView';
import { BatchesView } from './components/BatchesView';
import { InventoryView } from './components/InventoryView';
import { PrescriptionsView } from './components/PrescriptionsView';
import { PurchasingView } from './components/PurchasingView';
import { SuppliersView } from './components/SuppliersView';
import { CustomersView } from './components/CustomersView';
import { ReturnsExpensesView } from './components/ReturnsExpensesView';
import { ReportsView } from './components/ReportsView';
import { AuditLogsView } from './components/AuditLogsView';
import { UsersView } from './components/UsersView';
import { TestRunnerView } from './components/TestRunnerView';
import { CodebaseView } from './components/CodebaseView';
import { ReceiptModal } from './components/ReceiptModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LoginView } from './components/LoginView';
import { pharmacyDb, PharmacyDatabaseState } from './services/pharmacyDb';
import { getBatchExpiryStatus } from './services/fefoEngine';
import { Sale, RoleName } from './types/pharmacy';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('pharmos_auth_token');
  });
  const [dbState, setDbState] = useState<PharmacyDatabaseState>(() => pharmacyDb.getState());
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const refreshState = async () => {
    await pharmacyDb.syncWithBackend();
    setDbState({ ...pharmacyDb.getState() });
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshState();
    }
  }, [isAuthenticated]);

  const handleRoleChange = (role: RoleName) => {
    pharmacyDb.setCurrentUser(role);
    refreshState();
  };

  const handleResetData = () => {
    pharmacyDb.resetToDefaults();
    refreshState();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pharmos_auth_token');
    sessionStorage.removeItem('pharmos_auth_user');
    setIsAuthenticated(false);
  };

  // Compute Alert Count
  const alertCount = React.useMemo(() => {
    let count = 0;
    // Expired batches
    dbState.batches.forEach(b => {
      if (b.currentQuantity > 0) {
        const st = getBatchExpiryStatus(b.expiryDate);
        if (st === 'expired' || st === 'near_expiry_30') count++;
      }
    });
    // Low stock
    dbState.medicines.forEach(m => {
      const stock = pharmacyDb.getMedicineStock(m.id);
      if (stock.totalStock <= m.minStockLevel) count++;
    });
    // Pending Rx
    count += dbState.prescriptions.filter(p => p.status === 'Pending').length;
    return count;
  }, [dbState]);

  // Tab permissions guard map
  const tabPermissions: Record<TabKey, RoleName[]> = {
    dashboard: ['admin', 'pharmacist', 'cashier', 'inventory_manager'],
    pos: ['admin', 'pharmacist', 'cashier'],
    medicines: ['admin', 'pharmacist', 'inventory_manager'],
    batches: ['admin', 'pharmacist', 'inventory_manager'],
    inventory: ['admin', 'pharmacist', 'inventory_manager'],
    prescriptions: ['admin', 'pharmacist'],
    purchasing: ['admin', 'inventory_manager'],
    suppliers: ['admin', 'inventory_manager'],
    customers: ['admin', 'pharmacist', 'cashier'],
    returns_expenses: ['admin', 'pharmacist'],
    reports: ['admin', 'pharmacist'],
    users: ['admin'],
    audit: ['admin'],
    tests: ['admin', 'pharmacist', 'cashier', 'inventory_manager'],
    codebase: ['admin', 'pharmacist', 'cashier', 'inventory_manager']
  };

  const isCurrentTabAllowed = tabPermissions[activeTab].includes(dbState.currentUser.role);

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(user, token) => {
          sessionStorage.setItem('pharmos_auth_token', token);
          sessionStorage.setItem('pharmos_auth_user', JSON.stringify(user));
          pharmacyDb.setCurrentUserObj(user);
          pharmacyDb.syncWithBackend().then(() => {
            refreshState();
          });
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentUser={dbState.currentUser}
        onRoleChange={handleRoleChange}
        onResetData={handleResetData}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onLogout={handleLogout}
        alertCount={alertCount}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={dbState.currentUser.role}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {!isCurrentTabAllowed ? (
              /* RBAC Access Denied Fallback Screen */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-lg mx-auto mt-12 space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Access Prohibited by Role Permissions
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your active role (<strong>{dbState.currentUser.role.replace('_', ' ')}</strong>) is restricted from accessing the <strong>{activeTab.replace('_', ' ')}</strong> section under pharmacy security policies.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Required authorization: {tabPermissions[activeTab].join(', ')}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Return to Dashboard
                  </button>
                  <button
                    onClick={() => handleRoleChange('admin')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Switch to Administrator
                  </button>
                </div>
              </div>
            ) : (
              /* Active View */
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    state={dbState}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'pos' && (
                  <PosView
                    state={dbState}
                    onRefresh={refreshState}
                    onViewReceipt={sale => setReceiptSale(sale)}
                  />
                )}

                {activeTab === 'medicines' && (
                  <MedicinesView
                    state={dbState}
                    onRefresh={refreshState}
                  />
                )}

                {activeTab === 'batches' && (
                  <BatchesView
                    state={dbState}
                    onRefresh={refreshState}
                  />
                )}

                {activeTab === 'inventory' && (
                  <InventoryView
                    state={dbState}
                    onRefresh={refreshState}
                  />
                )}

                {activeTab === 'prescriptions' && (
                  <PrescriptionsView
                    state={dbState}
                    onRefresh={refreshState}
                    onDispenseInPos={() => setActiveTab('pos')}
                  />
                )}

                {activeTab === 'purchasing' && (
                  <PurchasingView
                    state={dbState}
                    onRefresh={refreshState}
                  />
                )}

                {activeTab === 'suppliers' && (
                  <SuppliersView
                    state={dbState}
                    onRefresh={refreshState}
                  />
                )}

                {activeTab === 'customers' && (
                  <CustomersView
                    state={dbState}
                    onRefresh={refreshState}
                  />
                )}

                {activeTab === 'returns_expenses' && (
                  <ReturnsExpensesView
                    state={dbState}
                    onRefresh={refreshState}
                  />
                )}

                {activeTab === 'reports' && (
                  <ReportsView
                    state={dbState}
                  />
                )}

                {activeTab === 'users' && (
                  <UsersView
                    users={dbState.users}
                    currentUser={dbState.currentUser}
                    onRefresh={() => {
                      pharmacyDb.syncWithBackend().then(() => refreshState());
                    }}
                  />
                )}

                {activeTab === 'audit' && (
                  <AuditLogsView
                    state={dbState}
                  />
                )}

                {activeTab === 'tests' && (
                  <TestRunnerView />
                )}

                {activeTab === 'codebase' && (
                  <CodebaseView />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* POS Receipt Modal */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          onClose={() => setReceiptSale(null)}
        />
      )}

      {/* Real-time Regulatory Notifications Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          state={dbState}
          onClose={() => setIsNotificationsOpen(false)}
          onNavigate={tab => {
            setActiveTab(tab);
            setIsNotificationsOpen(false);
          }}
        />
      )}
    </div>
  );
}
