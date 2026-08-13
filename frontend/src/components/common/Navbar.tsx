import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, LogOut, User as UserIcon, Activity, Stethoscope, UserCog, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/signin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="w-full px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group py-2">
          <img src="/logo.png" alt="CyberCare Logo" className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-md" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-outfit">
              Cyber<span className="text-gradient-crimson">Care</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Healthcare SOC
            </span>
          </div>
        </Link>



        {/* Auth section */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="hidden sm:inline">Logged in</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signin"
              className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
