import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Lock, AlertCircle, CheckCircle, Flame, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: 'Protected' | 'Verified' | 'Authorized' | 'Restricted' | 'Suspicious' | 'High Risk' | 'CRITICAL' | 'Emergency Access' | 'Expired' | 'Blocked' | 'ACTIVE' | 'DISABLED' | 'LOCKED';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'ACTIVE':
    case 'Protected':
    case 'Verified':
    case 'Authorized':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
          {status}
        </span>
      );
    case 'Suspicious':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 shadow-sm">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          Suspicious
        </span>
      );
    case 'High Risk':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 shadow-sm animate-pulse-slow">
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
          High Risk
        </span>
      );
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600 text-white border border-rose-700 shadow-glow-crimson animate-bounce">
          {showIcon && <Flame className="w-3.5 h-3.5 text-white" />}
          CRITICAL
        </span>
      );
    case 'Emergency Access':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 text-white border border-rose-400 shadow-glow-crimson animate-pulse">
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-white" />}
          🚨 Emergency Access
        </span>
      );
    case 'DISABLED':
    case 'LOCKED':
    case 'Restricted':
    case 'Blocked':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          {showIcon && <Lock className="w-3.5 h-3.5 text-slate-500" />}
          {status}
        </span>
      );
    case 'Expired':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          {status}
        </span>
      );
  }
};
