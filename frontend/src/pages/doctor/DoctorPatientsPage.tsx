import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { EmergencyBanner } from '../../components/common/EmergencyBanner';
import { Patient } from '../../types';
import { fetchDoctorPatientsWithSupabase, fetchPatientDetailsWithSupabase } from '../../services/supabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { Users, Lock, ShieldCheck, Search, AlertCircle, Flame, Eye, X, Calendar, Phone, MapPin, Activity, FileText, CheckCircle2 } from 'lucide-react';

export const DoctorPatientsPage: React.FC = () => {
  const { user, activeBreakGlass } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [fullPatientDetail, setFullPatientDetail] = useState<Patient | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchPatients = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await fetchDoctorPatientsWithSupabase(user);
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch doctor patients', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user, activeBreakGlass]);

  const handleOpenPatient = async (patient: Patient) => {
    if (!user) return;
    setDetailError(null);
    setIsDetailLoading(true);

    try {
      const details = await fetchPatientDetailsWithSupabase(user, patient.id);
      setFullPatientDetail(details);
    } catch (err: any) {
      setDetailError(err.message || 'Authorization check failed');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.currentProblem.toLowerCase().includes(search.toLowerCase()) ||
    p.departmentName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <EmergencyBanner breakGlassList={activeBreakGlass} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-widest">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Clinical Patient Roster</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">
                My Patients
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                Patients currently assigned to {user?.name} (Supabase RLS Protected)
              </p>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-xs font-bold self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{patients.length} Assigned Patients</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your assigned patients by name or symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent outline-none font-medium text-slate-800"
            />
          </div>

          {/* Patient Grid Cards */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-bold">
              Loading authorized patients...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 font-outfit">No Assigned Patients Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search ? `No assigned patients match "${search}"` : 'You do not have any active patient assignments assigned to your profile.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleOpenPatient(p)}
                  className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-900 text-base font-outfit group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </span>
                      {p.isBreakGlass ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          🚨 Emergency Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Assigned to You
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 my-2">
                      <div className="text-xs text-indigo-600 font-bold">{p.departmentName} Department</div>
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">{p.currentProblem}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-500">Doctor: <strong className="text-slate-800">{p.assignedDoctorName}</strong></span>
                    <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-[11px] rounded-xl transition-all flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Patient</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Patient Detail Modal */}
      {fullPatientDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white relative">
              <button
                onClick={() => setFullPatientDetail(null)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-400/30">
                      ✓ Assigned to You
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-bold border border-blue-400/30">
                      🔐 Protected Patient Record
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white font-outfit mt-1">
                    {fullPatientDetail.name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Demographics Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Patient Overview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Group</span>
                    <span className="font-extrabold text-rose-600 text-sm mt-0.5 block">{fullPatientDetail.bloodGroup}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Masked Aadhar</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">{fullPatientDetail.aadharNumber}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{fullPatientDetail.phone}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 col-span-2 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Residential Address</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{fullPatientDetail.address}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Dept</span>
                    <span className="font-bold text-indigo-600 text-xs mt-0.5 block">{fullPatientDetail.departmentName}</span>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Medical Information</h4>
                
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                  <span className="text-xs font-bold text-indigo-900 block mb-1">Current Problem / Primary Symptoms:</span>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">{fullPatientDetail.currentProblem}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Previous Medications & Medical History:</span>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{fullPatientDetail.previousMedicines || 'None reported'}</p>
                </div>
              </div>

              {/* Assignment & Access Info */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-900 block">Assigned Specialist: {fullPatientDetail.assignedDoctorName}</span>
                  <span className="text-[11px] text-emerald-700 font-medium">Access Status: ✓ Authorized (Patient-Doctor Assignment Verified)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold">RLS Passed</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setFullPatientDetail(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Close Patient File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
