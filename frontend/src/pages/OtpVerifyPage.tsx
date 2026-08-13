import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/auth/OtpInput';

export const OtpVerifyPage: React.FC = () => {
  const { pendingOtp, verifyOtpStep, resendOtpCode, clearPendingOtp } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!pendingOtp) {
    return <Navigate to="/signin" replace />;
  }

  const handleComplete = async (code: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await verifyOtpStep(code);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else if (user.role === 'RECEPTIONIST') navigate('/receptionist');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid 6-digit OTP code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      await resendOtpCode();
    } catch (err: any) {
      setError('Failed to resend OTP code');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/bg-signin.png')` }}
    >
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] pointer-events-none" />
      {/* Top Left Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => {
            clearPendingOtp();
            navigate('/signin');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200 shadow-sm backdrop-blur-md transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Sign In</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 flex flex-col items-center">
        <Link to="/" className="inline-flex items-center gap-3 group mb-2">
          <img src="/logo.png" alt="CyberCare Logo" className="h-12 sm:h-14 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform" />
          <span className="font-extrabold text-3xl tracking-tight text-white font-outfit drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Cyber<span className="text-rose-400">Care</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white font-outfit tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Verify Your Identity
        </h2>
        <p className="mt-1 text-xs text-slate-200 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          Enter 6-digit 2FA code sent to <strong className="text-white font-bold">{pendingOtp.email}</strong>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-200/80 backdrop-blur-md"
        >
          <div className="space-y-6">
            <OtpInput
              onComplete={handleComplete}
              onResend={handleResend}
              demoOtpCode={pendingOtp.demoOtpCode}
              error={error}
              isSubmitting={isSubmitting}
            />

            <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResend}
                className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => {
                  clearPendingOtp();
                  navigate('/signin');
                }}
                className="text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
              >
                Cancel & Sign In Again
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
