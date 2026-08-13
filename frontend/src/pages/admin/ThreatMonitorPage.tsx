import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { ThreatScoreCard } from '../../components/security/ThreatScoreCard';
import { SecurityEvent, ThreatOverview } from '../../types';
import { fetchThreatMonitorWithSupabase, fetchSecurityEventsWithSupabase } from '../../services/supabaseDataService';
import { Activity, ShieldAlert, Cpu, Lock, Flame } from 'lucide-react';

export const ThreatMonitorPage: React.FC = () => {
  const [threatOverview, setThreatOverview] = useState<ThreatOverview | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  const fetchThreatData = async () => {
    try {
      const [threat, events] = await Promise.all([
        fetchThreatMonitorWithSupabase(),
        fetchSecurityEventsWithSupabase()
      ]);
      setThreatOverview(threat);
      setSecurityEvents(events);
    } catch (err) {
      console.error('Failed to fetch threat monitor data', err);
    }
  };

  useEffect(() => {
    fetchThreatData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>AI Anomaly Detection Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">
              AI Threat Monitor & Telemetry Scorecard
            </h1>
          </div>

          {threatOverview && <ThreatScoreCard threat={threatOverview} />}

          {/* Security Events List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-glass p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-base font-outfit">Anomalous Telemetry Logs</h3>
              <span className="text-xs font-bold text-slate-500">{securityEvents.length} Anomaly Events</span>
            </div>

            <div className="space-y-3">
              {securityEvents.map((evt) => (
                <div key={evt.id} className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-xl mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{evt.eventType}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                          {evt.classification}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{evt.details}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        {new Date(evt.timestamp).toLocaleString()} • User: {evt.user?.email || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block uppercase">Risk Score</span>
                    <span className="text-lg font-extrabold text-rose-600 font-mono">{evt.riskScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
