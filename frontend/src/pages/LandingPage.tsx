import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Flame,
  FileSpreadsheet,
  Users,
  Activity,
  ArrowRight,
  Shield,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Check,
  Sparkles,
  KeyRound,
  FileText,
  Radio
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';

const ROTATING_PHRASES = [
  'Secure Every Access.',
  'Protect Clinical Data.',
  'Enforce Department RBAC.',
  'Authorize Break-Glass.'
];

export const LandingPage: React.FC = () => {
  const [phraseIdx, setPhraseIdx] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-rose-500 selection:text-white">
      <Navbar />

      {/* Hero Section with Moving Background Grid */}
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 lg:py-20 bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-rose-50/30">
        
        {/* Animated Moving Background Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_80%,transparent_100%)] opacity-55 pointer-events-none animate-moving-grid" />

        {/* Ambient Cohesive Gradients (Full Canvas Spread) */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-bl from-rose-500/20 via-purple-500/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-t from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>



        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col justify-center my-auto">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Top Pill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-100/90 border border-slate-200/90 text-[10px] sm:text-xs font-bold text-slate-700 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 animate-pulse shrink-0" />
              <span className="tracking-wide text-center">AI-POWERED HEALTHCARE SOC & EMERGENCY ACCESS PLATFORM</span>
            </motion.div>

            {/* Dynamic Rotating Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-outfit text-slate-900 leading-tight min-h-[100px] sm:min-h-[140px] flex flex-col items-center justify-center"
            >
              <span>Protect Every Patient.</span>
              <div className="h-14 sm:h-20 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={phraseIdx}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="text-gradient block text-center px-2"
                  >
                    {ROTATING_PHRASES[phraseIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.h1>

            {/* Paragraph Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto px-2"
            >
              CyberCare is an intelligent healthcare security platform engineered for zero-trust authorization, department-isolated medical records, instant 2FA authentication, and emergency break-glass overrides.
            </motion.p>

            {/* Unboxed Inline Highlights Bar */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-[11px] sm:text-xs font-semibold text-slate-500 pt-1 px-2"
            >
              <span className="flex items-center gap-1.5 text-blue-600">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 font-bold shrink-0" /> Dynamic Doctor & Dept Filtering
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-indigo-600">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 font-bold shrink-0" /> Scikit-Learn Anomaly Forest
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 font-bold shrink-0" /> HIPAA & Row-Level Security
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 font-bold shrink-0" /> Controlled Break-Glass 2FA
              </span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                to="/signin"
                className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5"
              >
                <span>Launch Healthcare Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Explore Security Architecture</span>
              </a>
            </motion.div>
          </div>

          {/* Animated Stats & Keywords */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 max-w-5xl mx-auto w-full"
          >
            {/* Animated counter stats row (Unboxed) */}
            <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 mb-10">
              {[
                { value: '2,438+', label: 'Protected Patient Records', color: 'text-blue-600' },
                { value: '99.97%', label: 'System Uptime', color: 'text-emerald-600' },
                { value: '<200ms', label: 'Auth Response Time', color: 'text-purple-600' },
                { value: '24/7', label: 'SOC Monitoring Active', color: 'text-rose-600' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="text-center"
                >
                  <div className={`text-3xl sm:text-4xl md:text-5xl font-extrabold font-outfit tracking-tight ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Continuous Flowing Keyword Marquee (Unboxed) */}
            <div className="relative overflow-hidden py-3">
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-indigo-50/70 via-indigo-50/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-indigo-50/70 via-indigo-50/50 to-transparent z-10 pointer-events-none" />
              <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                className="flex gap-8 whitespace-nowrap"
              >
                {[
                  'AES-256 ENCRYPTION', 'ROLE-BASED ACCESS CONTROL', 'EMERGENCY BREAK-GLASS', '2FA AUTHENTICATION',
                  'HIPAA COMPLIANT', 'IMMUTABLE AUDIT LOGGING', 'SCIKIT-LEARN ML TELEMETRY', 'ZERO TRUST ARCHITECTURE',
                  'REAL-TIME SOC MONITORING', 'PATIENT DATA MASKING', 'SUPABASE ROW-LEVEL SECURITY', 'MULTI-DEPARTMENT ARCHITECTURE',
                  'AES-256 ENCRYPTION', 'ROLE-BASED ACCESS CONTROL', 'EMERGENCY BREAK-GLASS', '2FA AUTHENTICATION',
                  'HIPAA COMPLIANT', 'IMMUTABLE AUDIT LOGGING', 'SCIKIT-LEARN ML TELEMETRY', 'ZERO TRUST ARCHITECTURE',
                  'REAL-TIME SOC MONITORING', 'PATIENT DATA MASKING', 'SUPABASE ROW-LEVEL SECURITY', 'MULTI-DEPARTMENT ARCHITECTURE',
                ].map((keyword, i) => (
                  <span
                    key={`${keyword}-${i}`}
                    className="inline-block text-xs sm:text-sm font-extrabold text-slate-400/90 tracking-widest uppercase font-outfit"
                  >
                    {keyword}
                    <span className="mx-4 text-indigo-400/60 font-normal">✦</span>
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section Grid */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 font-outfit">
              Comprehensive Healthcare Cybersecurity System
            </h2>
            <p className="text-slate-600 text-sm">
              Built for modern hospital networks requiring uncompromising compliance, strict authorization, and instant emergency responsiveness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-blue-600" />}
              title="Role-Based Access Control (RBAC)"
              description="Strict backend authorization enforcing department-level patient access across Admins, Doctors, and Receptionists."
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6 text-indigo-600" />}
              title="2FA / OTP Authentication"
              description="Mandatory 6-digit zero-trust two-factor authentication gating every user role session."
            />
            <FeatureCard
              icon={<Cpu className="w-6 h-6 text-purple-600" />}
              title="AI Anomaly Detection"
              description="Scikit-learn Isolation Forest model scoring security telemetry, generating explainable risk factors, and auto-locking suspicious accounts."
            />
            <FeatureCard
              icon={<Flame className="w-6 h-6 text-rose-600" />}
              title="Emergency Break-Glass"
              description="Controlled time-limited emergency access override for urgent patient care with mandatory secondary verification."
            />
            <FeatureCard
              icon={<FileSpreadsheet className="w-6 h-6 text-amber-600" />}
              title="Immutable Audit Trail"
              description="Comprehensive event logging tracking every authentication attempt, record view, and privilege escalation."
            />
            <FeatureCard
              icon={<Stethoscope className="w-6 h-6 text-emerald-600" />}
              title="Department Isolation"
              description="Cardiology, Orthopedics, Pediatrics, and General Medicine data isolation preventing unauthorized patient data leaks."
            />
          </div>
        </div>
      </section>

      {/* Comprehensive Professional Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 mt-auto pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Column 1: Brand & Overview (Spans 2 cols on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="inline-flex items-center gap-3 group">
                <img src="/logo.png" alt="CyberCare Logo" className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
                <span className="font-extrabold text-2xl tracking-tight text-white font-outfit">
                  Cyber<span className="text-rose-400">Care</span>
                </span>
              </Link>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                CyberCare is an enterprise-grade healthcare security platform engineering zero-trust authorization, department-isolated medical records, 2FA verification, and controlled emergency break-glass overrides.
              </p>

              {/* Status Badge */}
              <div className="pt-2 flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>SOC Systems Operational</span>
                </span>
                <span className="text-xs text-slate-500 font-mono">v2.4.0</span>
              </div>
            </div>

            {/* Column 2: Clinical Workflows */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-outfit">Clinical Modules</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-white transition-colors">Command Center</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Multi-Dept Directory</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Patient Intake Desk</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Doctor Assignment RLS</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Break-Glass Emergency</a></li>
              </ul>
            </div>

            {/* Column 3: Security & AI */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-outfit">Security & AI</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-white transition-colors">RBAC Authorization</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Mandatory 2FA / OTP</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Scikit-Learn ML Forest</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Immutable Audit Logs</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Supabase Row-Level Security</a></li>
              </ul>
            </div>

            {/* Column 4: Quick Portals */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-outfit">Role Portals</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/signin" className="hover:text-rose-400 transition-colors font-medium">Admin Portal Login</Link></li>
                <li><Link to="/signin" className="hover:text-indigo-400 transition-colors font-medium">Doctor Workspace</Link></li>
                <li><Link to="/signin" className="hover:text-emerald-400 transition-colors font-medium">Receptionist Desk</Link></li>
                <li><Link to="/signin" className="hover:text-amber-400 transition-colors font-medium">Emergency Override</Link></li>
                <li><Link to="/signin" className="hover:text-blue-400 transition-colors font-medium">Sign In to SOC</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Divider & Copyright */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-slate-500">
              © 2026 CyberCare Inc. AI-Powered Hospital Security & Emergency Access Platform. All rights reserved.
            </p>

            <div className="flex items-center gap-6 text-slate-500">
              <a href="#features" className="hover:text-slate-300 transition-colors">HIPAA Compliance</a>
              <span>·</span>
              <a href="#features" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <span>·</span>
              <a href="#features" className="hover:text-slate-300 transition-colors">Security Audit</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description
}) => {
  return (
    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all space-y-3">
      <div className="p-3 bg-white rounded-xl inline-block border border-slate-200 shadow-sm">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 font-outfit">{title}</h3>
      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
};
