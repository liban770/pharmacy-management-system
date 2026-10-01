import React, { useState } from 'react';
import { History, Search, ShieldCheck, Filter } from 'lucide-react';
import { PharmacyDatabaseState } from '../services/pharmacyDb';

interface AuditLogsViewProps {
  state: PharmacyDatabaseState;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ state }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = state.auditLogs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueActions = Array.from(new Set(state.auditLogs.map(l => l.action)));

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Tamper-Evident System Audit Trail
            <span className="text-xs bg-slate-900 text-white font-mono px-2 py-0.5 rounded">
              Immutable Log
            </span>
          </h1>
          <div className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed operational audit records for Good Pharmacy Practice (GPP) regulatory compliance
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search operator, event action, entity ID, or description..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <span className="text-slate-500 whitespace-nowrap">Event Type:</span>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Action Events ({state.auditLogs.length})</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Action Event</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-3">Entity ID</th>
                <th className="py-3 px-3">Audit Details</th>
                <th className="py-3 px-4 font-mono text-slate-400">IP Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                    {log.user}
                  </td>
                  <td className="py-2.5 px-3 font-sans capitalize text-slate-600">
                    {log.role.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">
                    {log.entity}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 font-semibold">
                    {log.entityId}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 max-w-md truncate">
                    {log.description}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
