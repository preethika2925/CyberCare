import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  ShieldAlert,
  Flame,
  UserCheck,
  Lock,
  Activity,
  FileSpreadsheet,
  ArrowUpRight,
  Shield,
  Stethoscope,
  Building2,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadges';
import { EmergencyBanner } from '../../components/common/EmergencyBanner';
import { ThreatScoreCard } from '../../components/security/ThreatScoreCard';
import { fetchAdminOverviewWithSupabase } from '../../services/supabaseDataService';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AuditLog, ThreatOverview } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { activeBreakGlass } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [threat, setThreat] = useState<ThreatOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminOverviewWithSupabase();
      setMetrics(data.metrics);
      setRecentLogs(data.recentAuditLogs);
      setThreat(data.threatAnalysis);
    } catch (err) {
      try {
        const res = await api.get('/admin/overview');
        setMetrics(res.data.metrics);
        setRecentLogs(res.data.recentAuditLogs || []);
        setThreat(res.data.threatAnalysis);
      } catch (e) {
        console.error('Failed to load admin overview', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const pieData = [
    { name: 'Low Risk', value: 75, color: '#10b981' },
    { name: 'Medium Risk', value: 18, color: '#f59e0b' },
    { name: 'High Risk', value: 5, color: '#f43f5e' },
    { name: 'Critical', value: 2, color: '#e11d48' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <EmergencyBanner breakGlassList={activeBreakGlass} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
                <Shield className="w-4 h-4" />
                <span>CyberCare Supabase SOC Command Center</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">
                Admin Security & Operations Dashboard
              </h1>
            </div>
            <button
              onClick={fetchOverview}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Patients"
              value={metrics?.totalPatients ?? '-'}
              subtitle="Registered hospital records"
              icon={<Users className="w-5 h-5 text-blue-600" />}
            />
            <MetricCard
              title="Active Medical Staff"
              value={(metrics?.totalDoctors || 0) + (metrics?.totalReceptionists || 0)}
              subtitle={`${metrics?.totalDoctors || 0} Doctors • ${metrics?.totalReceptionists || 0} Registrars`}
              icon={<Stethoscope className="w-5 h-5 text-indigo-600" />}
            />
            <MetricCard
              title="Suspicious Events"
              value={metrics?.suspiciousEvents ?? '-'}
              subtitle="Security alerts logged"
              icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
              highlight={metrics?.suspiciousEvents > 0}
            />
            <MetricCard
              title="Emergency Break-Glass"
              value={metrics?.activeBreakGlassCount ?? '-'}
              subtitle="Active override sessions"
              icon={<Flame className="w-5 h-5 text-rose-600" />}
              alert={metrics?.activeBreakGlassCount > 0}
            />
          </div>

          {/* Threat Monitor & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {threat && <ThreatScoreCard threat={threat} />}
            </div>

            {/* Risk Distribution Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-glass flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base font-outfit">Telemetry Risk Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time threat classification breakdown</p>
              </div>

              <div className="h-44 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600">{item.name}:</span>
                    <span className="text-slate-900 font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-glass">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base font-outfit">Live Audit Telemetry Feed</h3>
                <p className="text-xs text-slate-500">Real-time system events, logins & security access checks</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Supabase Realtime Logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">User / Identity</th>
                    <th className="pb-3">Action Performed</th>
                    <th className="pb-3">Security Status</th>
                    <th className="pb-3">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="py-3">
                        <div className="font-bold text-slate-900">{log.user?.name || 'System'}</div>
                        <div className="text-[10px] text-slate-400">{log.user?.email || log.ipAddress}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-800">{log.action}</div>
                        {log.reason && <div className="text-[11px] text-slate-500 max-w-xs truncate">{log.reason}</div>}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={log.status === 'EMERGENCY' ? 'Emergency Access' : log.status === 'DENIED' ? 'Restricted' : 'Verified'} />
                      </td>
                      <td className="py-3 font-bold font-mono">
                        <span className={log.riskScore > 50 ? 'text-rose-600' : 'text-slate-700'}>
                          {log.riskScore}
                        </span>
                      </td>
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

const MetricCard: React.FC<{
  title: string;
  value: React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
  highlight?: boolean;
  alert?: boolean;
}> = ({ title, value, subtitle, icon, highlight, alert }) => {
  return (
    <div className={`p-5 rounded-3xl bg-white border shadow-sm transition-all ${
      alert ? 'border-rose-300 bg-rose-50/30' : highlight ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">{title}</span>
        <div className="p-2 bg-slate-100 rounded-xl">{icon}</div>
      </div>
      <div className="text-3xl font-extrabold text-slate-900 font-outfit mt-2">{value}</div>
      <p className="text-[11px] text-slate-500 mt-1 font-medium">{subtitle}</p>
    </div>
  );
};
