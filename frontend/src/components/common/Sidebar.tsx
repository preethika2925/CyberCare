import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ShieldCheck,
  Activity,
  FileSpreadsheet,
  AlertTriangle,
  Stethoscope,
  Flame,
  ShieldAlert,
  ClipboardList,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = async () => {
    await logoutUser();
    navigate('/signin');
  };

  const renderNavLinks = () => {
    switch (user.role) {
      case 'ADMIN':
        return (
          <>
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SOC Security Command Center
            </div>
            <SidebarItem to="/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Command Center" />
            <SidebarItem to="/admin/users" icon={<Users className="w-4 h-4" />} label="User Management" />
            <SidebarItem to="/admin/patients" icon={<ClipboardList className="w-4 h-4" />} label="Patient Database" />
            <SidebarItem to="/admin/security" icon={<Activity className="w-4 h-4" />} label="AI Threat Monitor" />
            <SidebarItem to="/admin/audit" icon={<FileSpreadsheet className="w-4 h-4" />} label="Audit Trail" />
          </>
        );

      case 'DOCTOR':
        return (
          <>
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Clinical Workspace
            </div>
            <SidebarItem to="/doctor" icon={<Stethoscope className="w-4 h-4" />} label="Doctor Overview" />
            <SidebarItem to="/doctor/patients" icon={<Users className="w-4 h-4" />} label="Hospital Patients" />
            <SidebarItem to="/doctor/break-glass" icon={<Flame className="w-4 h-4 text-rose-500" />} label="Emergency Break-Glass" highlight />
          </>
        );

      case 'RECEPTIONIST':
        return (
          <>
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Intake & Registration
            </div>
            <SidebarItem to="/receptionist" icon={<LayoutDashboard className="w-4 h-4" />} label="Intake Dashboard" />
            <SidebarItem to="/receptionist/register-patient" icon={<UserPlus className="w-4 h-4 text-blue-600" />} label="Register New Patient" highlight />
            <SidebarItem to="/receptionist/patients" icon={<Users className="w-4 h-4" />} label="Patient Directory" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-5rem)] sticky top-20 p-4 flex flex-col justify-between shrink-0 shadow-sm overflow-y-auto">
      <div className="space-y-6">
        <nav className="space-y-1">
          {renderNavLinks()}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="pt-4 mt-4 border-t border-slate-200 space-y-2">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 leading-tight truncate">{user.name}</div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <span>{user.employeeId}</span>
              <span>•</span>
              <span className="font-semibold text-indigo-600 uppercase">{user.role}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, highlight }) => {
  return (
    <NavLink
      to={to}
      end={to === '/admin' || to === '/doctor' || to === '/receptionist'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-semibold'
            : highlight
            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 font-semibold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};
