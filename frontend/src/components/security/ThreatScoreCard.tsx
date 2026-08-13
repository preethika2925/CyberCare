import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Flame, CheckCircle2, Cpu } from 'lucide-react';
import { ThreatOverview } from '../../types';

interface ThreatScoreCardProps {
  threat: ThreatOverview;
}

export const ThreatScoreCard: React.FC<ThreatScoreCardProps> = ({ threat }) => {
  const getScoreColor = () => {
    if (threat.riskScore <= 30) return { text: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-200', border: 'border-emerald-200' };
    if (threat.riskScore <= 60) return { text: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-amber-200', border: 'border-amber-200' };
    if (threat.riskScore <= 80) return { text: 'text-rose-600', bg: 'bg-rose-500', ring: 'ring-rose-200', border: 'border-rose-200' };
    return { text: 'text-rose-700', bg: 'bg-rose-600', ring: 'ring-rose-400', border: 'border-rose-500' };
  };

  const style = getScoreColor();

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-glass relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base font-outfit">AI Threat Telemetry</h3>
            <span className="text-[11px] text-slate-500">Isolation Forest Anomaly Scoring Engine</span>
          </div>
        </div>

        <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${
          threat.classification === 'CRITICAL' ? 'bg-rose-600 text-white animate-bounce' :
          threat.classification === 'HIGH' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
          threat.classification === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
          'bg-emerald-100 text-emerald-800 border border-emerald-200'
        }`}>
          {threat.classification} RISK
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-4">
        {/* Score Circle */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 ${style.border} shadow-inner`}>
            <div className="text-center">
              <span className={`text-3xl font-extrabold ${style.text} font-outfit`}>{threat.riskScore}</span>
              <span className="block text-[10px] uppercase font-bold text-slate-400">/ 100 Risk</span>
            </div>
          </div>
        </div>

        {/* Explainable Reasons */}
        <div className="md:col-span-2 space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Explainable Risk Factors Detected:
          </h4>
          <ul className="space-y-1.5">
            {threat.explainableReasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                <span className="text-rose-500 font-bold mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendation Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Automated SOC Guardrail:</span>
        <span className="font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
          {threat.recommendation}
        </span>
      </div>
    </div>
  );
};
