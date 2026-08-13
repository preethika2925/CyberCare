import React, { useState, useEffect } from 'react';
import { User, Role, UserStatus, Department, Doctor } from '../../types';
import {
  fetchAllUsersWithSupabase,
  fetchDepartmentsWithSupabase,
  fetchAdminDepartmentStatsWithSupabase,
  createDepartmentWithSupabase,
  updateDepartmentWithSupabase,
  updateDepartmentStatusWithSupabase,
  createUserWithSupabase,
  updateDoctorWithSupabase,
  updateUserProfileWithSupabase,
  updateUserStatusWithSupabase,
  deleteUserWithSupabase,
  fetchDoctorsWithSupabase
} from '../../services/supabaseDataService';
import { Navbar } from '../../components/common/Navbar';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadges';
import { Users, UserPlus, Building2, Plus, Shield, Trash2, Lock, CheckCircle, Ban, X, Search, Stethoscope, Edit3, Pencil, Check } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DOCTORS' | 'DEPARTMENTS' | 'RECEPTIONISTS' | 'ADMINS'>('DOCTORS');
  const [users, setUsers] = useState<User[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptStats, setDeptStats] = useState<Department[]>([]);
  const [search, setSearch] = useState<string>('');

  // Add Modals
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState<boolean>(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [staffModalRole, setStaffModalRole] = useState<Role>('RECEPTIONIST');

  // Edit Modals
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Doctor Form State
  const [docName, setDocName] = useState<string>('');
  const [docEmail, setDocEmail] = useState<string>('');
  const [docEmpId, setDocEmpId] = useState<string>('');
  const [docPassword, setDocPassword] = useState<string>('doctor123');
  const [docDeptId, setDocDeptId] = useState<string>('');
  const [docSpec, setDocSpec] = useState<string>('Interventional Cardiology');
  const [docPhone, setDocPhone] = useState<string>('+1 555-0199');
  const [docLicense, setDocLicense] = useState<string>('LIC-2001');
  const [docStatus, setDocStatus] = useState<string>('ACTIVE');
  const [docError, setDocError] = useState<string | null>(null);
  const [isDocSubmitting, setIsDocSubmitting] = useState<boolean>(false);

  // Department Form State
  const [deptName, setDeptName] = useState<string>('');
  const [deptCode, setDeptCode] = useState<string>('');
  const [deptDesc, setDeptDesc] = useState<string>('');
  const [deptStatus, setDeptStatus] = useState<string>('ACTIVE');
  const [deptError, setDeptError] = useState<string | null>(null);
  const [isDeptSubmitting, setIsDeptSubmitting] = useState<boolean>(false);

  // Generic Staff User Edit State
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userEmpId, setUserEmpId] = useState<string>('');
  const [userStatus, setUserStatus] = useState<UserStatus>('ACTIVE');
  const [userNewPassword, setUserNewPassword] = useState<string>('');

  // Shared password reset for doctor edits
  const [docNewPassword, setDocNewPassword] = useState<string>('');

  const loadData = async () => {
    try {
      const [uData, dList, depts, dStats] = await Promise.all([
        fetchAllUsersWithSupabase(),
        fetchDoctorsWithSupabase(),
        fetchDepartmentsWithSupabase(),
        fetchAdminDepartmentStatsWithSupabase()
      ]);
      setUsers(uData);
      setDoctorsList(dList);
      setDepartments(depts);
      setDeptStats(dStats);
      if (depts.length > 0 && !docDeptId) {
        setDocDeptId(depts[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch admin staff data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Doctor
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocError(null);
    setIsDocSubmitting(true);
    try {
      await createUserWithSupabase({
        name: docName,
        email: docEmail,
        employeeId: docEmpId,
        password: docPassword,
        role: 'DOCTOR',
        departmentId: docDeptId,
        specialization: docSpec,
        phone: docPhone,
        licenseNumber: docLicense
      });
      setIsDoctorModalOpen(false);
      resetDoctorForm();
      loadData();
    } catch (err: any) {
      setDocError(err.message || 'Failed to create doctor account');
    } finally {
      setIsDocSubmitting(false);
    }
  };

  // Open Edit Doctor Modal
  const openEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc);
    setDocName(doc.name || '');
    setDocEmail(doc.email || '');
    setDocEmpId(doc.employeeId || '');
    setDocDeptId(doc.departmentId || (departments.length > 0 ? departments[0].id : ''));
    setDocSpec(doc.specialization || '');
    setDocPhone(doc.phone || '+1 555-0199');
    setDocLicense(doc.licenseNumber || 'LIC-1001');
    setDocStatus(doc.status || 'ACTIVE');
    setDocNewPassword('');
  };

  // Handle Update Doctor
  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setDocError(null);
    setIsDocSubmitting(true);
    try {
      await updateDoctorWithSupabase({
        userId: editingDoctor.userId,
        doctorId: editingDoctor.id,
        name: docName,
        email: docEmail,
        employeeId: docEmpId,
        departmentId: docDeptId,
        specialization: docSpec,
        phone: docPhone,
        licenseNumber: docLicense,
        status: docStatus,
        newPassword: docNewPassword || undefined
      });
      setEditingDoctor(null);
      resetDoctorForm();
      loadData();
    } catch (err: any) {
      setDocError(err.message || 'Failed to update doctor profile');
    } finally {
      setIsDocSubmitting(false);
    }
  };

  // Handle Add Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError(null);
    setIsDeptSubmitting(true);
    try {
      await createDepartmentWithSupabase({
        name: deptName,
        code: deptCode || deptName.substring(0, 4).toUpperCase(),
        description: deptDesc,
        status: deptStatus
      });
      setIsDeptModalOpen(false);
      resetDeptForm();
      loadData();
    } catch (err: any) {
      setDeptError(err.message || 'Failed to create department');
    } finally {
      setIsDeptSubmitting(false);
    }
  };

  // Open Edit Department Modal
  const openEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code || '');
    setDeptDesc(dept.description || '');
    setDeptStatus(dept.status || 'ACTIVE');
  };

  // Handle Update Department
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;
    setDeptError(null);
    setIsDeptSubmitting(true);
    try {
      await updateDepartmentWithSupabase({
        id: editingDepartment.id,
        name: deptName,
        code: deptCode,
        description: deptDesc,
        status: deptStatus
      });
      setEditingDepartment(null);
      resetDeptForm();
      loadData();
    } catch (err: any) {
      setDeptError(err.message || 'Failed to update department');
    } finally {
      setIsDeptSubmitting(false);
    }
  };

  // Open Edit Staff User Modal
  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserEmpId(u.employeeId);
    setUserStatus(u.status);
    setUserNewPassword('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateUserProfileWithSupabase({
        userId: editingUser.id,
        name: userName,
        email: userEmail,
        employeeId: userEmpId,
        status: userStatus,
        newPassword: userNewPassword || undefined
      });
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user profile');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await updateUserStatusWithSupabase(userId, nextStatus);
      loadData();
    } catch (err) {
      console.error('Failed to update user status', err);
    }
  };

  const handleToggleDepartmentStatus = async (deptId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateDepartmentStatusWithSupabase(deptId, nextStatus);
      loadData();
    } catch (err) {
      console.error('Failed to update department status', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff account?')) return;
    try {
      await deleteUserWithSupabase(userId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const resetDoctorForm = () => {
    setDocName('');
    setDocEmail('');
    setDocEmpId('');
    setDocSpec('Interventional Cardiology');
    setDocPhone('+1 555-0199');
    setDocLicense('LIC-2001');
    setDocStatus('ACTIVE');
    setDocError(null);
  };

  const resetDeptForm = () => {
    setDeptName('');
    setDeptCode('');
    setDeptDesc('');
    setDeptStatus('ACTIVE');
    setDeptError(null);
  };

  const filteredDoctors = doctorsList.filter(d =>
    (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.departmentName || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredDepartments = deptStats.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const receptionists = users.filter(u => u.role === 'RECEPTIONIST' && (
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ));

  const admins = users.filter(u => u.role === 'ADMIN' && (
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
                <Users className="w-4 h-4" />
                <span>Hospital Staff & Department Management</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">
                Multi-Department Clinical Directory
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'DEPARTMENTS' && (
                <button
                  onClick={() => { resetDeptForm(); setIsDeptModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>+ Add Department</span>
                </button>
              )}
              {activeTab === 'DOCTORS' && (
                <button
                  onClick={() => { resetDoctorForm(); setIsDoctorModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Doctor</span>
                </button>
              )}
              {activeTab === 'RECEPTIONISTS' && (
                <button
                  onClick={() => { setStaffModalRole('RECEPTIONIST'); setUserName(''); setUserEmail(''); setUserEmpId(''); setDocPassword('reception123'); setIsStaffModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Receptionist</span>
                </button>
              )}
              {activeTab === 'ADMINS' && (
                <button
                  onClick={() => { setStaffModalRole('ADMIN'); setUserName(''); setUserEmail(''); setUserEmpId(''); setDocPassword('admin123'); setIsStaffModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>+ Add Admin</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'DOCTORS', label: `Doctors (${doctorsList.length})`, icon: Stethoscope },
              { id: 'DEPARTMENTS', label: `Departments (${deptStats.length})`, icon: Building2 },
              { id: 'RECEPTIONISTS', label: `Receptionists (${users.filter(u => u.role === 'RECEPTIONIST').length})`, icon: Users },
              { id: 'ADMINS', label: `Admins (${users.filter(u => u.role === 'ADMIN').length})`, icon: Shield }
            ].map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} by name, code, specialization, or email...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none font-medium text-slate-800"
            />
          </div>

          {/* TAB 1: DOCTORS */}
          {activeTab === 'DOCTORS' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-glass overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base font-outfit">Hospital Doctor Directory</h3>
                <span className="text-xs font-bold text-slate-500">{filteredDoctors.length} Registered Doctors</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                      <th className="p-4">Doctor Name</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Specialization</th>
                      <th className="p-4">Employee ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{doc.name}</div>
                          <div className="text-[11px] text-slate-400">{doc.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-[11px]">
                            {doc.departmentName || 'Clinical Dept'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 font-bold">{doc.specialization}</td>
                        <td className="p-4 font-mono font-bold text-slate-600">{doc.employeeId || 'EMP-DOC'}</td>
                        <td className="p-4">
                          <StatusBadge status={(doc.status as UserStatus) || 'ACTIVE'} />
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* EDIT BUTTON */}
                            <button
                              onClick={() => openEditDoctor(doc)}
                              className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                              title="Edit Doctor Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleToggleUserStatus(doc.userId, (doc.status as UserStatus) || 'ACTIVE')}
                              className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
                              title="Toggle Status"
                            >
                              {doc.status === 'ACTIVE' ? <Ban className="w-4 h-4 text-rose-500" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(doc.userId)}
                              className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENTS */}
          {activeTab === 'DEPARTMENTS' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-glass overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base font-outfit">Dynamic Hospital Departments</h3>
                <span className="text-xs font-bold text-slate-500">{filteredDepartments.length} Active Departments</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {filteredDepartments.map((dept) => (
                  <div key={dept.id} className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-purple-300 transition-all flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full font-mono text-[10px] font-bold">
                          {dept.code || 'DEPT'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dept.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {dept.status || 'ACTIVE'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base font-outfit mt-2">{dept.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{dept.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-700">{dept.doctorCount || 0} Docs</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-bold text-emerald-700">{dept.patientCount || 0} Pats</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditDepartment(dept)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleDepartmentStatus(dept.id, dept.status || 'ACTIVE')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          {dept.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RECEPTIONISTS */}
          {activeTab === 'RECEPTIONISTS' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-glass overflow-hidden p-6">
              <h3 className="font-extrabold text-slate-900 text-base font-outfit mb-4">Patient Intake Receptionists</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receptionists.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{rec.name}</div>
                      <div className="text-xs text-slate-500">{rec.email} • {rec.employeeId}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={rec.status} />
                      <button
                        onClick={() => openEditUser(rec)}
                        className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="Edit Staff User"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(rec.id, rec.status)}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
                        title="Toggle Status"
                      >
                        {rec.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5 text-rose-500" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(rec.id)}
                        className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADMINS */}
          {activeTab === 'ADMINS' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-glass overflow-hidden p-6">
              <h3 className="font-extrabold text-slate-900 text-base font-outfit mb-4">SOC Command Administrators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {admins.map((adm) => (
                  <div key={adm.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{adm.name}</div>
                      <div className="text-xs text-slate-500">{adm.email} • {adm.employeeId}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={adm.status} />
                      <button
                        onClick={() => openEditUser(adm)}
                        className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="Edit Admin User"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(adm.id, adm.status)}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
                        title="Toggle Status"
                      >
                        {adm.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5 text-rose-500" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(adm.id)}
                        className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ADD / EDIT DOCTOR */}
      {(isDoctorModalOpen || editingDoctor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => { setIsDoctorModalOpen(false); setEditingDoctor(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 font-outfit flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
              <span>{editingDoctor ? `Edit Doctor Details (${editingDoctor.name})` : 'Add New Hospital Doctor'}</span>
            </h3>

            {docError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">{docError}</div>}

            <form onSubmit={editingDoctor ? handleUpdateDoctor : handleCreateDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                <input type="text" required value={docName} onChange={e => setDocName(e.target.value)} placeholder="Dr. Arjun Kumar" className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input type="email" required value={docEmail} onChange={e => setDocEmail(e.target.value)} placeholder="dr.arjun@cybercare.com" className="w-full text-xs p-2.5 border border-slate-300 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                  <input type="text" required value={docEmpId} onChange={e => setDocEmpId(e.target.value)} placeholder="EMP-210" className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Department *</label>
                  <select value={docDeptId} onChange={e => setDocDeptId(e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold text-indigo-700">
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialization *</label>
                  <input type="text" required value={docSpec} onChange={e => setDocSpec(e.target.value)} placeholder="Interventional Cardiology" className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold" />
                </div>
              </div>

              {!editingDoctor && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                  <input type="text" value={docPassword} onChange={e => setDocPassword(e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono" />
                </div>
              )}

              {editingDoctor && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                    <select value={docStatus} onChange={e => setDocStatus(e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DISABLED">DISABLED</option>
                      <option value="LOCKED">LOCKED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                    <input type="text" value={docNewPassword} onChange={e => setDocNewPassword(e.target.value)} placeholder="Enter new password..." className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono" />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setIsDoctorModalOpen(false); setEditingDoctor(null); }} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={isDocSubmitting} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer">
                  {isDocSubmitting ? (editingDoctor ? 'Saving...' : 'Creating...') : (editingDoctor ? 'Save Changes' : 'Create Doctor Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT DEPARTMENT */}
      {(isDeptModalOpen || editingDepartment) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <button onClick={() => { setIsDeptModalOpen(false); setEditingDepartment(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 font-outfit flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span>{editingDepartment ? `Edit Department (${editingDepartment.name})` : 'Add New Hospital Department'}</span>
            </h3>

            {deptError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">{deptError}</div>}

            <form onSubmit={editingDepartment ? handleUpdateDepartment : handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                <input type="text" required value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="Neurosurgery" className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Code</label>
                <input type="text" value={deptCode} onChange={e => setDeptCode(e.target.value)} placeholder="NEURO" className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Description</label>
                <textarea rows={2} value={deptDesc} onChange={e => setDeptDesc(e.target.value)} placeholder="Surgical treatment of central and peripheral nervous system disorders" className="w-full text-xs p-2.5 border border-slate-300 rounded-xl" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Status</label>
                <select value={deptStatus} onChange={e => setDeptStatus(e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setIsDeptModalOpen(false); setEditingDepartment(null); }} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={isDeptSubmitting} className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md cursor-pointer">
                  {isDeptSubmitting ? (editingDepartment ? 'Saving...' : 'Creating...') : (editingDepartment ? 'Save Changes' : 'Create Department')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT STAFF USER (Receptionist / Admin) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 font-outfit flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Edit Staff Credentials ({editingUser.name})</span>
            </h3>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input type="text" required value={userName} onChange={e => setUserName(e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input type="email" required value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                <input type="text" required value={userEmpId} onChange={e => setUserEmpId(e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                <select value={userStatus} onChange={e => setUserStatus(e.target.value as UserStatus)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISABLED">DISABLED</option>
                  <option value="LOCKED">LOCKED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                <input type="text" value={userNewPassword} onChange={e => setUserNewPassword(e.target.value)} placeholder="Enter new password..." className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 4: ADD RECEPTIONIST / ADMIN */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <button onClick={() => setIsStaffModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 font-outfit flex items-center gap-2">
              {staffModalRole === 'RECEPTIONIST' ? (
                <><Users className="w-5 h-5 text-emerald-600" /> <span>Add New Receptionist</span></>
              ) : (
                <><Shield className="w-5 h-5 text-rose-600" /> <span>Add New Administrator</span></>
              )}
            </h3>

            {docError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">{docError}</div>}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setDocError(null);
              setIsDocSubmitting(true);
              try {
                await createUserWithSupabase({
                  name: userName,
                  email: userEmail,
                  employeeId: userEmpId,
                  password: docPassword,
                  role: staffModalRole
                });
                setIsStaffModalOpen(false);
                loadData();
              } catch (err: any) {
                setDocError(err.message || `Failed to create ${staffModalRole.toLowerCase()} account`);
              } finally {
                setIsDocSubmitting(false);
              }
            }} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input type="text" required value={userName} onChange={e => setUserName(e.target.value)} placeholder={staffModalRole === 'RECEPTIONIST' ? 'Jane Smith' : 'Security Officer'} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input type="email" required value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder={staffModalRole === 'RECEPTIONIST' ? 'jane@cybercare.com' : 'secadmin@cybercare.com'} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                <input type="text" required value={userEmpId} onChange={e => setUserEmpId(e.target.value)} placeholder={staffModalRole === 'RECEPTIONIST' ? 'EMP-302' : 'EMP-101'} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                <input type="text" value={docPassword} onChange={e => setDocPassword(e.target.value)} className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={isDocSubmitting} className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer ${staffModalRole === 'RECEPTIONIST' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  {isDocSubmitting ? 'Creating...' : `Create ${staffModalRole === 'RECEPTIONIST' ? 'Receptionist' : 'Admin'} Account`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
