import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Try to use sidebar context safely if available
  let isMobileOpen = false;
  let toggleMobileSidebar = () => {};
  try {
    const sidebar = useSidebar();
    isMobileOpen = sidebar.isMobileOpen;
    toggleMobileSidebar = sidebar.toggleMobileSidebar;
  } catch (e) {
    // SidebarContext not mounted (e.g. on public standalone pages if any)
  }

  const handleLogout = async () => {
    await logoutUser();
    navigate('/signin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button for Authenticated Dashboard users */}
          {isAuthenticated && user && (
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Brand Logo */}
          <Link to="/" className="flex items-center group py-1.5 ml-2 sm:ml-4 lg:ml-6">
            <img
              src="/logo.png"
              alt="CyberCare Logo"
              className="h-12 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform drop-shadow-md"
            />
          </Link>
        </div>

        {/* Auth section */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user.name.charAt(0)}
              </div>
              <span className="font-bold text-slate-800">{user.name}</span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="lg:hidden flex items-center gap-1 text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/signin"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 sm:px-3.5 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signin"
              className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 px-3.5 sm:px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
