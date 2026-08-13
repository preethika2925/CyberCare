import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, UserCheck, ArrowRight, ArrowLeft, AlertCircle, KeyRound, Stethoscope, UserCog, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const SignInPage: React.FC = () => {
  const { loginPasswordStep } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState<string>('admin@cybercare.com');
  const [password, setPassword] = useState<string>('admin123');
  const [role, setRole] = useState<Role>('ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginPasswordStep(identifier, password, role);
      navigate('/verify-otp');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials or role mismatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string, demoRole: Role) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    setRole(demoRole);
    setError(null);
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/bg-signin.png')` }}
    >
      {/* Background Overlay for optimal contrast */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] pointer-events-none" />

      {/* Top Left Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 hover:text-slate-900 font-bold text-xs border border-slate-200/80 shadow-md backdrop-blur-md transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 flex flex-col items-center mt-10 sm:mt-0">
        <Link to="/" className="inline-flex items-center group mb-2">
          <img src="/logo.png" alt="CyberCare Logo" className="h-12 sm:h-16 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform" />
        </Link>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white font-outfit tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Sign In to Healthcare SOC
        </h2>
        <p className="mt-1 text-xs text-slate-200 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          Role-Based Authentication & Two-Factor Verification
        </p>
      </div>

      <div className="mt-5 sm:mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white py-6 sm:py-8 px-4 sm:px-6 shadow-2xl rounded-3xl border border-slate-200/80 backdrop-blur-md relative"
        >
          {/* Quick Demo Selector */}
          <div className="mb-5 sm:mb-6 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2 text-center">
              Quick Demo Accounts:
            </span>
            <div className="grid grid-cols-3 gap-1 text-[11px] sm:text-xs font-semibold">
              <button
                type="button"
                onClick={() => fillDemo('admin@cybercare.com', 'admin123', 'ADMIN')}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer truncate ${
                  role === 'ADMIN' ? 'bg-blue-600 text-white font-bold shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('dr.cardio@cybercare.com', 'doctor123', 'DOCTOR')}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer truncate ${
                  role === 'DOCTOR' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => fillDemo('receptionist@cybercare.com', 'reception123', 'RECEPTIONIST')}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer truncate ${
                  role === 'RECEPTIONIST' ? 'bg-purple-600 text-white font-bold shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Receptionist
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Radio Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Your Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['ADMIN', 'DOCTOR', 'RECEPTIONIST'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      role === r
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Email / Employee ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email / Employee ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@cybercare.com or EMP-100"
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Verify Password & Generate 2FA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
