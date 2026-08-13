import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadges';
import { AuditLog } from '../../types';
import { fetchAuditLogsWithSupabase } from '../../services/supabaseDataService';
import { FileSpreadsheet, Filter, Search, ShieldCheck } from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const fetchAuditLogs = async () => {
    try {
      const data = await fetchAuditLogsWithSupabase({
        status: statusFilter || undefined
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [roleFilter, statusFilter]);

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.user?.name && l.user.name.toLowerCase().includes(search.toLowerCase())) ||
    (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-widest">
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>SOC Compliance Ledger</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">
              System Audit Trail & Access Events
            </h1>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="sm:col-span-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit action, staff name, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-transparent outline-none font-medium text-slate-800"
              />
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full text-xs bg-transparent outline-none font-bold text-slate-700"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="RECEPTIONIST">RECEPTIONIST</option>
              </select>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs bg-transparent outline-none font-bold text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="DENIED">DENIED</option>
                <option value="WARNING">WARNING</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-glass overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base font-outfit">Audit Event Records</h3>
              <span className="text-xs font-bold text-slate-500">{filteredLogs.length} Events Logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User & Role</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Risk Score</th>
                    <th className="p-4">Audit Reason / Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{log.user?.name || 'System / Anonymous'}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">{log.user?.role}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{log.action}</td>
                      <td className="p-4">
                        <StatusBadge status={log.status === 'EMERGENCY' ? 'Emergency Access' : log.status === 'DENIED' ? 'Restricted' : 'Verified'} />
                      </td>
                      <td className="p-4 font-mono font-bold">
                        <span className={log.riskScore > 50 ? 'text-rose-600' : 'text-slate-700'}>
                          {log.riskScore}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium max-w-sm">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
