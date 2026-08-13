import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { Department, Doctor } from '../../types';
import { fetchDepartmentsWithSupabase, fetchDoctorsByDepartmentWithSupabase, registerPatientWithSupabase } from '../../services/supabaseDataService';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, CheckCircle2, Stethoscope, AlertCircle, ArrowRight, ShieldCheck, Search, Building2 } from 'lucide-react';

export const RegisterPatientPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>('Demo Patient');
  const [address, setAddress] = useState<string>('742 Evergreen Terrace, Sector 4');
  const [aadharNumber, setAadharNumber] = useState<string>('584930219942');
  const [phone, setPhone] = useState<string>('+1 555-0199');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [previousMedicines, setPreviousMedicines] = useState<string>('Atorvastatin 20mg, Aspirin 75mg daily');
  const [currentProblem, setCurrentProblem] = useState<string>('Acute chest pain radiating to left arm & shortness of breath');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorSearch, setDoctorSearch] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    patientName: string;
    departmentName: string;
    doctorName?: string;
  } | null>(null);

  // Load Departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const depts = await fetchDepartmentsWithSupabase();
        setDepartments(depts);
        if (depts && depts.length > 0) {
          const cardio = depts.find((d: Department) => d.name === 'Cardiology');
          const initialId = cardio ? cardio.id : depts[0].id;
          setDepartmentId(initialId);
        }
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch Doctors whenever departmentId changes
  useEffect(() => {
    if (!departmentId) return;
    const loadDoctorsForDept = async () => {
      setIsDoctorsLoading(true);
      try {
        const docList = await fetchDoctorsByDepartmentWithSupabase(departmentId);
        setDoctors(docList);
        if (docList && docList.length > 0) {
          setSelectedDoctorId(docList[0].id);
        } else {
          setSelectedDoctorId('');
        }
      } catch (err) {
        console.error('Failed to fetch doctors for department', err);
      } finally {
        setIsDoctorsLoading(false);
      }
    };
    loadDoctorsForDept();
  }, [departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const targetDeptId = departmentId || (departments.length > 0 ? departments[0].id : '');
    if (!targetDeptId) {
      setError('Please select a medical department');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await registerPatientWithSupabase({
        name,
        address,
        aadharNumber,
        phone,
        bloodGroup,
        previousMedicines,
        currentProblem,
        departmentId: targetDeptId,
        doctorId: selectedDoctorId || undefined,
        receptionistUserId: user?.id
      });

      setSuccessResult({
        patientName: res.patient.name,
        departmentName: res.patient.departmentName || 'Medical Department',
        doctorName: res.assignedDoctor?.name || 'Department Specialist'
      });

    } catch (err: any) {
      setError(err.message || 'Failed to register patient admission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDeptObj = departments.find(d => d.id === departmentId);
  const filteredDoctors = doctors.filter(d => 
    (d.name || '').toLowerCase().includes(doctorSearch.toLowerCase()) ||
    (d.specialization || '').toLowerCase().includes(doctorSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
              <UserPlus className="w-4 h-4" />
              <span>Receptionist Registration Wizard (Dynamic Supabase DB)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">
              Register New Patient Admission
            </h1>
          </div>

          {/* Success Banner */}
          {successResult ? (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl border border-white/30">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-200">
                    Registration Completed & Audited
                  </span>
                  <h3 className="text-xl font-extrabold text-white">Patient Successfully Registered</h3>
                </div>
              </div>

              <div className="p-4 bg-white/10 rounded-2xl border border-white/20 text-sm space-y-1">
                <div>Patient: <strong className="text-white font-bold">{successResult.patientName}</strong></div>
                <div>Medical Department: <strong className="text-emerald-200">{successResult.departmentName}</strong></div>
                <div>Assigned Specialist: <strong className="text-amber-300">{successResult.doctorName}</strong></div>
                <p className="text-xs text-emerald-100 pt-2">
                  ✓ Patient record created in Supabase PostgreSQL. Patient now automatically appears in the authorized doctor&apos;s dashboard under strict RLS controls.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setSuccessResult(null)}
                  className="px-5 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Register Another Patient
                </button>
                <button
                  onClick={() => navigate('/receptionist/patients')}
                  className="px-5 py-2.5 bg-emerald-900/40 text-white font-bold text-xs rounded-xl border border-white/20 hover:bg-emerald-900/60 cursor-pointer"
                >
                  View Patient Directory
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-glass p-6 space-y-6">
              {/* Patient Personal Information */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base font-outfit border-b border-slate-100 pb-2">
                  1. Patient Demographics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Demo Patient"
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Aadhar Number (12 Digits) *</label>
                    <input
                      type="text"
                      required
                      value={aadharNumber}
                      onChange={(e) => setAadharNumber(e.target.value)}
                      placeholder="5849 3021 9942"
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555-0199"
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group *</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl font-bold"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="742 Evergreen Terrace, Sector 4"
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Clinical Intake & Dynamic Department / Doctor Assignment */}
              <div className="space-y-4 pt-2">
                <h3 className="font-extrabold text-slate-900 text-base font-outfit border-b border-slate-100 pb-2">
                  2. Clinical Intake & Specialist Assignment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Medical Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Medical Department *</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full text-xs p-3 border border-indigo-300 bg-indigo-50/50 rounded-xl font-bold text-indigo-900"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code || 'DEPT'})
                        </option>
                      ))}
                    </select>
                    {selectedDeptObj && (
                      <p className="text-[11px] text-indigo-600 font-medium mt-1">
                        {selectedDeptObj.description}
                      </p>
                    )}
                  </div>

                  {/* Dynamic Doctor Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assign Specialist Doctor ({selectedDeptObj?.name || 'Selected Dept'}) *
                    </label>
                    {isDoctorsLoading ? (
                      <div className="p-3 text-xs text-slate-400 font-bold bg-slate-50 border border-slate-200 rounded-xl">
                        Loading doctors for {selectedDeptObj?.name}...
                      </div>
                    ) : doctors.length === 0 ? (
                      <div className="p-3 text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-xl">
                        No active doctors registered in {selectedDeptObj?.name}. Admin can add doctors.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Searchable Doctor Dropdown */}
                        <select
                          value={selectedDoctorId}
                          onChange={(e) => setSelectedDoctorId(e.target.value)}
                          className="w-full text-xs p-3 border border-emerald-300 bg-emerald-50/50 rounded-xl font-bold text-emerald-900"
                        >
                          {filteredDoctors.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} — {doc.specialization} ({doc.roomNumber || 'Consultation Suite'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Problem / Primary Symptoms *</label>
                  <textarea
                    rows={2}
                    required
                    value={currentProblem}
                    onChange={(e) => setCurrentProblem(e.target.value)}
                    placeholder="Describe the primary symptom or clinical issue..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Previous Medicines / Medical History</label>
                  <textarea
                    rows={2}
                    value={previousMedicines}
                    onChange={(e) => setPreviousMedicines(e.target.value)}
                    placeholder="List existing prescriptions or known allergies..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering & Assigning...' : 'Register & Assign Specialist →'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};
