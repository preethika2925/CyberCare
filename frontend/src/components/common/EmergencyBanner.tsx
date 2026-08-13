import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { ActiveBreakGlass } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface EmergencyBannerProps {
  breakGlassList: ActiveBreakGlass[];
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ breakGlassList }) => {
  const { refreshBreakGlass } = useAuth();
  const [timers, setTimers] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    const initialTimers: { [id: string]: number } = {};
    breakGlassList.forEach(item => {
      initialTimers[item.id] = item.remainingSeconds;
    });
    setTimers(initialTimers);

    const interval = setInterval(() => {
      setTimers(prev => {
        const next: { [id: string]: number } = {};
        let updated = false;
        Object.keys(prev).forEach(id => {
          const rem = prev[id] - 1;
          if (rem <= 0) updated = true;
          next[id] = Math.max(0, rem);
        });
        if (updated) refreshBreakGlass();
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breakGlassList]);

  if (breakGlassList.length === 0) return null;

  const handleRevoke = async (id: string) => {
    try {
      await api.post(`/break-glass/revoke/${id}`);
      refreshBreakGlass();
    } catch (err) {
      console.error('Failed to revoke break glass', err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-purple-800 text-white p-4 shadow-xl border-b-2 border-rose-400 relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-900/60 rounded-xl border border-rose-400/40 shadow-inner animate-pulse">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full tracking-wider uppercase border border-white/30">
                🚨 EMERGENCY ACCESS ACTIVE
              </span>
              <span className="text-xs text-rose-200 font-medium">Temporary Privilege Override</span>
            </div>
            <h4 className="font-bold text-base mt-0.5 text-white">
              Patient: <span className="underline decoration-rose-300 underline-offset-4">{breakGlassList[0].patientName}</span> ({breakGlassList[0].patientDepartment})
            </h4>
            <p className="text-xs text-rose-100 mt-0.5">
              Reason: &ldquo;{breakGlassList[0].reason}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-rose-950/40 px-4 py-2.5 rounded-xl border border-rose-400/30">
          <div className="flex items-center gap-2 text-rose-100">
            <Clock className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="text-xs">
              <div className="text-rose-300 font-medium">Expires In</div>
              <div className="font-mono font-bold text-base text-amber-300">
                {formatTime(timers[breakGlassList[0].id] || 0)}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleRevoke(breakGlassList[0].id)}
            className="flex items-center gap-1 text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg border border-white/20 transition-all cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            Revoke Access
          </button>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
