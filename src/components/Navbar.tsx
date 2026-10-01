import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  UserCheck, 
  RotateCcw, 
  ShieldCheck, 
  ChevronDown,
  LogOut
} from 'lucide-react';
import { User, RoleName } from '../types/pharmacy';
import { pharmacyDb } from '../services/pharmacyDb';

interface NavbarProps {
  currentUser: User;
  onRoleChange?: (role: RoleName) => void;
  onResetData?: () => void;
  onOpenNotifications: () => void;
  onLogout?: () => void;
  alertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenNotifications,
  onLogout,
  alertCount
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-xs">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            PharmOS Enterprise
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              MySQL Active
            </span>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Connected to XAMPP MySQL Database (pharmcy)
          </div>
        </div>
      </div>

      {/* Zone 2: System Status & Alerts */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="System Alerts & Expiry Warnings"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Zone 3: Authenticated User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center">
              {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                {currentUser.name}
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              </div>
              <div className="text-[11px] text-slate-500 capitalize">
                Role: {currentUser.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* User Profile Card Dropdown */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-xs text-slate-500">{currentUser.email}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {currentUser.roleTitle || currentUser.role.replace('_', ' ')}
                  </div>
                </div>

                <div className="px-4 py-2 text-[11px] text-slate-500">
                  <div>Status: <span className="text-emerald-700 font-medium capitalize">{currentUser.status}</span></div>
                  <div>Account: <span className="text-slate-700 font-medium">MySQL Authenticated</span></div>
                </div>

                {onLogout && (
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
