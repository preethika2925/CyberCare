import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { Department, Patient } from '../../types';
import { fetchDepartmentsWithSupabase, fetchHospitalPatientsWithSupabase } from '../../services/supabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Building2, Stethoscope, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);

  const { user } = useAuth();

  const fetchData = async () => {
    try {
      const depts = await fetchDepartmentsWithSupabase();
      setDepartments(depts);
      if (user) {
        const patients = await fetchHospitalPatientsWithSupabase(user);
        setRecentPatients(patients);
      }
    } catch (err) {
      console.error('Failed to fetch receptionist dashboard data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Intake Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-6 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-2xl font-bold font-outfit shadow-inner">
                <UserPlus className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-blue-300">
                  Patient Intake & Registration Center
                </span>
                <h1 className="text-2xl font-extrabold text-white font-outfit">
                  Hospital Reception & Intake Portal
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Register new patient admissions & automatically assign qualified department specialists
                </p>
              </div>
            </div>

            <Link
              to="/receptionist/register-patient"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Patient Admission →</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500">Total Registered Patients</span>
              <div className="text-3xl font-extrabold text-slate-900 font-outfit mt-2">{recentPatients.length}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">✓ Auto-Assigned & Protected</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500">Medical Departments</span>
              <div className="text-3xl font-extrabold text-indigo-600 font-outfit mt-2">{departments.length}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Specialized Clinical Routing</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500">Active Duty Doctors</span>
              <div className="text-3xl font-extrabold text-blue-600 font-outfit mt-2">4</div>
              <span className="text-[11px] text-slate-500 mt-1 block">On-Call for Immediate Assignment</span>
            </div>
          </div>

          {/* Medical Departments Availability Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-glass p-6">
            <h3 className="font-extrabold text-slate-900 text-base font-outfit mb-4">
              Hospital Medical Department Routing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="font-bold text-slate-900 text-xs">{dept.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{dept.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
