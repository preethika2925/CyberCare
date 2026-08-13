import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { EmergencyBanner } from '../../components/common/EmergencyBanner';
import { Patient, Doctor } from '../../types';
import { fetchDoctorPatientsWithSupabase } from '../../services/supabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Users, Flame, ShieldCheck, Activity, ArrowRight, UserCheck, Eye } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user, activeBreakGlass } = useAuth();
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);

  const fetchDoctorData = async () => {
    if (!user) return;
    try {
      setDoctorInfo(user.doctor || null);
      const patients = await fetchDoctorPatientsWithSupabase(user);
      setMyPatients(patients);
    } catch (err) {
      console.error('Failed to fetch doctor dashboard data', err);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <EmergencyBanner breakGlassList={activeBreakGlass} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
          {/* Doctor Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 sm:p-6 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-xl sm:text-2xl font-bold font-outfit shadow-inner shrink-0">
                <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-blue-300">
                  {doctorInfo?.departmentName || 'Medical Department'} • {doctorInfo?.specialization || 'Clinical Specialist'}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white font-outfit">
                  Welcome back, {user?.name}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                  Room: {doctorInfo?.roomNumber || 'Suite 402 - Heart Center'} • Patient Authorization Guard Active
                </p>
              </div>
            </div>

            <Link
              to="/doctor/break-glass"
              className="w-full sm:w-auto px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-700 hover:from-rose-700 hover:to-purple-800 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-white" />
              <span>Emergency Break-Glass Console</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">My Assigned Patients</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-outfit mt-2">{myPatients.length}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Assigned specifically to Dr. {user?.name}</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Department</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-outfit mt-2">{doctorInfo?.departmentName || 'Cardiology'}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{doctorInfo?.specialization}</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Active Break-Glass Overrides</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-outfit mt-2">{activeBreakGlass.length}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">15-minute temporary emergency sessions</p>
            </div>
          </div>

          {/* Roster Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base font-outfit">My Clinical Patients</h3>
                <p className="text-xs text-slate-500">Patients with active assignments to your profile</p>
              </div>

              <Link
                to="/doctor/patients"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <span>View Full Roster</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPatients.slice(0, 4).map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs">{p.name}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.currentProblem}</p>
                  </div>

                  <Link
                    to="/doctor/patients"
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-[11px] rounded-xl transition-all"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
