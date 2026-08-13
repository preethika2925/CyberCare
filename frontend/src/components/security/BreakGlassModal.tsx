import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Lock, KeyRound, Clock, CheckCircle2, X } from 'lucide-react';
import { requestBreakGlassWithSupabase, verifyBreakGlassWithSupabase } from '../../services/supabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { OtpInput } from '../auth/OtpInput';

interface BreakGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientDepartment?: string;
  onSuccess: () => void;
}

export const BreakGlassModal: React.FC<BreakGlassModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientDepartment,
  onSuccess
}) => {
  const { refreshBreakGlass } = useAuth();
  const [step, setStep] = useState<'REASON' | 'OTP'>('REASON');
  const [reason, setReason] = useState<string>('Assigned department doctor unavailable and patient requires urgent evaluation');
  const [demoOtpCode, setDemoOtpCode] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { user } = useAuth();

  if (!isOpen) return null;

  const handleInitiateRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (reason.trim().length < 10) {
      setError('Please provide a detailed clinical emergency justification (at least 10 characters)');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (!user) throw new Error('Not authenticated');
      const res = await requestBreakGlassWithSupabase(user.id, patientId, reason);
      setDemoOtpCode(res.demoOtpCode);
      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Emergency Break-Glass request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (!user) throw new Error('Not authenticated');
      await verifyBreakGlassWithSupabase(user.id, patientId, reason, otpCode);
      await refreshBreakGlass();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid emergency 2FA verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-purple-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-rose-200 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl border border-white/20">
              <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-rose-200">
                🚨 Emergency Break-Glass Access
              </span>
              <h3 className="text-xl font-extrabold text-white">Override Restricted Access</h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Patient</span>
              <div className="font-bold text-slate-900 text-base">{patientName}</div>
              <div className="text-xs text-indigo-600 font-medium">{patientDepartment} Department</div>
            </div>
            <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
              Cross-Department
            </div>
          </div>

          {step === 'REASON' ? (
            <form onSubmit={handleInitiateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Clinical Emergency Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Assigned cardiologist unavailable and patient requires immediate cardiac evaluation."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ⚠️ This emergency override will grant <strong>15-minute temporary patient access</strong>. All actions are logged and flagged for Admin SOC review.
                </p>
              </div>

              {error && (
                <div className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-purple-700 hover:from-rose-700 hover:to-purple-800 rounded-xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Verifying Authorization...' : 'Proceed to Emergency 2FA →'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-600">
                Please enter the 6-digit emergency authorization OTP sent to your registered doctor account to grant temporary access.
              </div>

              <OtpInput
                onComplete={handleVerifyOtp}
                onResend={() => handleInitiateRequest()}
                demoOtpCode={demoOtpCode}
                error={error}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
