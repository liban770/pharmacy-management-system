import React, { useState } from 'react';
import { Building2, Lock, User as UserIcon, ShieldCheck, Database, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types/pharmacy';

interface LoginViewProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin 123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the PHP API backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin 123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 mb-4 border border-emerald-400/30">
            <Building2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            PharmOS Enterprise
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Production Pharmacy Management & Operations Platform
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connected to XAMPP MySQL (Database: pharmcy)</span>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sign In to Portal</h2>
              <p className="text-xs text-slate-500">Enter your administrative credentials</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Failed</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin 123"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Quick Fill Helper */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleQuickFill}
                className="w-full p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70 transition-colors flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-xs text-emerald-900 font-medium">Default Credentials:</span>
                  <span className="text-xs text-emerald-800 font-mono font-semibold">admin</span>
                  <span className="text-xs text-emerald-600">/</span>
                  <span className="text-xs text-emerald-800 font-mono font-semibold">admin 123</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 underline">Auto-fill</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Role-Based Access Control</span>
            <span className="text-emerald-700 font-medium">FEFO Inventory System</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-xs text-slate-400">
          PharmOS Enterprise &copy; {new Date().getFullYear()} &bull; Real-time Database Mode
        </div>
      </div>
    </div>
  );
};
