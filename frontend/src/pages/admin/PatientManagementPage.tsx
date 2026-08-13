import React, { useState, useEffect } from 'react';
import { Patient, Department } from '../../types';
import { fetchHospitalPatientsWithSupabase } from '../../services/supabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadges';
import { ClipboardList, Search, Eye, Filter, UserCheck } from 'lucide-react';

export const PatientManagementPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const { user } = useAuth();

  const fetchPatients = async () => {
    if (!user) return;
    try {
      const data = await fetchHospitalPatientsWithSupabase(user);
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch hospital patients', err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.currentProblem.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || p.departmentName === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full min-w-0">
          <div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-widest">
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Central Hospital Database</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">
              Patient Registry & Assignment Control
            </h1>
          </div>

          {/* Search & Filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient by name or symptom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-transparent outline-none font-medium text-slate-800"
              />
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full text-xs bg-transparent outline-none font-bold text-slate-700"
              >
                <option value="ALL">All Departments</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
              </select>
            </div>
          </div>

          {/* Patient Directory Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-glass overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base font-outfit">Hospital Patient Index</h3>
              <span className="text-xs font-bold text-slate-500">{filteredPatients.length} Patient Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Assigned Doctor</th>
                    <th className="p-4">Current Problem / Symptom</th>
                    <th className="p-4">Aadhar Number</th>
                    <th className="p-4">Blood Group</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{p.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {p.departmentName}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{p.assignedDoctorName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium max-w-xs">{p.currentProblem}</td>
                      <td className="p-4 font-mono text-slate-500">{p.aadharNumber}</td>
                      <td className="p-4">
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          {p.bloodGroup}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
