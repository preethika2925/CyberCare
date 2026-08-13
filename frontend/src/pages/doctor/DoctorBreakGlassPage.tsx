import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { EmergencyBanner } from '../../components/common/EmergencyBanner';
import { BreakGlassModal } from '../../components/security/BreakGlassModal';
import { Patient } from '../../types';
import { fetchUnassignedPatientsForBreakGlassWithSupabase } from '../../services/supabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { Flame, Clock, ShieldAlert, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export const DoctorBreakGlassPage: React.FC = () => {
  const { user, activeBreakGlass, refreshBreakGlass } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState<string>('');

  const [targetPatient, setTargetPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchPatients = async () => {
    if (!user) return;
    try {
      const data = await fetchUnassignedPatientsForBreakGlassWithSupabase(user);
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch unassigned patients for Break-Glass', err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user, activeBreakGlass]);

  const handleInitiateBreakGlass = (patient: Patient) => {
    setTargetPatient(patient);
    setIsModalOpen(true);
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
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-rose-600 uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Controlled Privilege Escalation Protocol</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">
              Emergency Break-Glass Management
            </h1>
          </div>

          {/* Active Overrides */}
          <div className="bg-white rounded-3xl border border-rose-200 shadow-glass p-4 sm:p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base font-outfit flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Active Break-Glass Overrides ({activeBreakGlass.length})</span>
            </h3>

            {activeBreakGlass.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No active emergency overrides</p>
                <span className="text-[11px] text-slate-400">All access operating under standard RBAC department isolation</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBreakGlass.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-purple-50 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">{item.patientName}</span>
                      <span className="text-xs font-mono font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                        Expires in {Math.floor(item.remainingSeconds / 60)}m {item.remainingSeconds % 60}s
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Reason: &ldquo;{item.reason}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Initiate New Override */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-glass p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-outfit">Request Emergency Access for Hospital Patient</h3>
              <p className="text-xs text-slate-500 mt-0.5">Unassigned hospital patients available for emergency clinical access override ({patients.length})</p>
            </div>
            
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search unassigned hospital patient to request Break-Glass access..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-transparent outline-none font-medium text-slate-800"
              />
            </div>

            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl">
                No unassigned hospital patients available for Break-Glass request.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPatients.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="text-xs text-indigo-600 font-medium">{p.departmentName} Department • Assigned: {p.assignedDoctorName}</div>
                    </div>
                    <button
                      onClick={() => handleInitiateBreakGlass(p)}
                      className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Initiate Break-Glass
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {targetPatient && (
        <BreakGlassModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patientId={targetPatient.id}
          patientName={targetPatient.name}
          patientDepartment={targetPatient.departmentName}
          onSuccess={() => {
            refreshBreakGlass();
            fetchPatients();
          }}
        />
      )}
    </div>
  );
};
