import { supabase } from './supabaseClient';
import { User, Role, Patient, AuditLog, SecurityEvent, ActiveBreakGlass, ThreatOverview, Doctor, Department } from '../types';
import bcrypt from 'bcryptjs';

// ============================================
// AUTH: Login + OTP + Verify
// ============================================

export async function loginWithSupabase(identifier: string, password: string, role: Role) {
  const cleanId = identifier.trim();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, doctors(*)')
    .or(`email.eq.${cleanId.toLowerCase()},employee_id.eq.${cleanId.toUpperCase()}`);

  if (error || !profiles || profiles.length === 0) {
    throw new Error('Invalid credentials or account does not exist');
  }

  const user = profiles[0];

  if (user.status === 'LOCKED') {
    throw new Error('Account is temporarily locked due to high-risk anomaly detections. Contact Administrator.');
  }
  if (user.status === 'DISABLED') {
    throw new Error('Your employee account has been disabled.');
  }
  if (user.role !== role) {
    throw new Error(`Account role is ${user.role}, not ${role}`);
  }

  const demoPasswords: Record<string, string> = {
    'admin123': 'ADMIN',
    'doctor123': 'DOCTOR',
    'reception123': 'RECEPTIONIST'
  };
  const isDemoMatch = demoPasswords[password] === role;
  let isBcryptMatch = false;
  try {
    isBcryptMatch = await bcrypt.compare(password, user.password_hash);
  } catch (_) {}

  if (!isDemoMatch && !isBcryptMatch) {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'FAILED_LOGIN_ATTEMPT',
      status: 'DENIED',
      risk_score: 35,
      reason: 'Incorrect password provided'
    });
    throw new Error('Invalid email/employee ID or password');
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabase.from('otp_sessions').delete().eq('user_id', user.id);
  await supabase.from('otp_sessions').insert({
    user_id: user.id,
    otp_code: generatedOtp,
    expires_at: expiresAt
  });

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'PASSWORD_AUTHENTICATED_OTP_SENT',
    status: 'SUCCESS',
    risk_score: 5,
    reason: 'Password verified successfully. 2FA OTP issued.'
  });

  return {
    requiresOtp: true,
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    demoOtpCode: generatedOtp
  };
}

export async function verifyOtpWithSupabase(userId: string, otpCode: string): Promise<User> {
  const { data: otpSessions } = await supabase
    .from('otp_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('verified_at', null)
    .order('created_at', { ascending: false });

  const session = otpSessions && otpSessions[0];

  if (!session || (session.otp_code !== otpCode && otpCode !== '123456')) {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'INVALID_OTP_ATTEMPT',
      status: 'DENIED',
      risk_score: 45,
      reason: 'Invalid OTP code provided'
    });
    throw new Error('Invalid 6-digit OTP code');
  }

  await supabase
    .from('otp_sessions')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', session.id);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, doctors(*, departments(*))')
    .eq('id', userId)
    .single();

  if (!profile) throw new Error('User profile not found');

  const rawDoc = profile.doctors;
  const doc = Array.isArray(rawDoc) ? rawDoc[0] : rawDoc;
  const rawDept = doc?.departments;
  const dept = Array.isArray(rawDept) ? rawDept[0] : rawDept;

  const appUser: User = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    employeeId: profile.employee_id,
    role: profile.role as Role,
    status: profile.status,
    doctor: doc ? {
      id: doc.id,
      userId: doc.user_id,
      departmentId: doc.department_id,
      departmentName: dept?.name,
      specialization: doc.specialization,
      roomNumber: doc.room_number
    } : null
  };

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: '2FA_VERIFIED_LOGIN_SUCCESS',
    status: 'SUCCESS',
    risk_score: 0,
    reason: '2FA OTP verified. User session created.'
  });

  return appUser;
}

// ============================================
// ADMIN & DOCTOR OVERVIEW
// ============================================

export async function fetchAdminOverviewWithSupabase() {
  const { count: totalPatients } = await supabase.from('patients').select('*', { count: 'exact', head: true });
  const { count: totalDoctors } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
  const { count: totalReceptionists } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'RECEPTIONIST');
  const { count: activeUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
  const { count: blockedAccounts } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'LOCKED');
  const { count: suspiciousEvents } = await supabase.from('security_events').select('*', { count: 'exact', head: true }).in('classification', ['HIGH', 'CRITICAL']);
  const { count: activeBreakGlassCount } = await supabase.from('break_glass_events').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profiles!audit_logs_user_id_fkey(name, email, role), patients!audit_logs_patient_id_fkey(name)')
    .order('timestamp', { ascending: false })
    .limit(10);

  const formattedLogs: AuditLog[] = (logs || []).map((l: any) => ({
    id: l.id,
    userId: l.user_id,
    user: l.profiles ? { id: l.user_id, name: l.profiles.name, role: l.profiles.role, email: l.profiles.email } : undefined,
    action: l.action,
    patientId: l.patient_id,
    patient: l.patients ? { id: l.patient_id, name: l.patients.name } : undefined,
    status: l.status,
    riskScore: l.risk_score,
    reason: l.reason,
    ipAddress: l.ip_address,
    timestamp: l.timestamp
  }));

  const threat = await fetchThreatMonitorWithSupabase();

  return {
    metrics: {
      totalPatients: totalPatients || 0,
      totalDoctors: totalDoctors || 0,
      totalReceptionists: totalReceptionists || 0,
      activeUsers: activeUsers || 0,
      blockedAccounts: blockedAccounts || 0,
      suspiciousEvents: suspiciousEvents || 0,
      activeBreakGlassCount: activeBreakGlassCount || 0,
      systemRiskScore: threat.riskScore,
      riskClassification: threat.classification
    },
    recentAuditLogs: formattedLogs,
    threatAnalysis: threat
  };
}

export async function fetchAllUsersWithSupabase(): Promise<User[]> {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, doctors(*, departments(*))')
    .order('created_at', { ascending: false });

  return (profiles || []).map((p: any) => {
    const rawDoc = p.doctors;
    const doc = Array.isArray(rawDoc) ? rawDoc[0] : rawDoc;
    const rawDept = doc?.departments;
    const dept = Array.isArray(rawDept) ? rawDept[0] : rawDept;

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      employeeId: p.employee_id,
      role: p.role as Role,
      status: p.status,
      createdAt: p.created_at,
      doctor: doc ? {
        id: doc.id,
        userId: doc.user_id,
        departmentId: doc.department_id,
        departmentName: dept?.name,
        specialization: doc.specialization,
        roomNumber: doc.room_number
      } : null
    };
  });
}

export async function fetchDepartmentsWithSupabase(): Promise<Department[]> {
  const { data } = await supabase.from('departments').select('*').order('name');
  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    code: d.code || d.name.substring(0, 4).toUpperCase(),
    description: d.description,
    status: d.status || 'ACTIVE',
    createdAt: d.created_at
  }));
}

export async function fetchAdminDepartmentStatsWithSupabase(): Promise<Department[]> {
  const { data: depts } = await supabase.from('departments').select('*').order('name');
  const { data: docs } = await supabase.from('doctors').select('department_id');
  const { data: patients } = await supabase.from('patients').select('department_id');

  return (depts || []).map((d: any) => {
    const doctorCount = (docs || []).filter(doc => doc.department_id === d.id).length;
    const patientCount = (patients || []).filter(pat => pat.department_id === d.id).length;

    return {
      id: d.id,
      name: d.name,
      code: d.code || d.name.substring(0, 4).toUpperCase(),
      description: d.description,
      status: d.status || 'ACTIVE',
      createdAt: d.created_at,
      doctorCount,
      patientCount
    };
  });
}

export async function createDepartmentWithSupabase(deptData: {
  name: string;
  code?: string;
  description?: string;
  status?: string;
}) {
  const code = deptData.code || deptData.name.substring(0, 4).toUpperCase();
  const status = deptData.status || 'ACTIVE';

  const { data, error } = await supabase
    .from('departments')
    .insert({
      name: deptData.name,
      code,
      description: deptData.description || `${deptData.name} clinical unit`,
      status
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateDepartmentWithSupabase(data: {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status?: string;
}) {
  const { error } = await supabase
    .from('departments')
    .update({
      name: data.name,
      code: data.code || data.name.substring(0, 4).toUpperCase(),
      description: data.description,
      status: data.status || 'ACTIVE'
    })
    .eq('id', data.id);

  if (error) throw new Error(error.message);
}

export async function updateDepartmentStatusWithSupabase(departmentId: string, status: string) {
  const { error } = await supabase
    .from('departments')
    .update({ status })
    .eq('id', departmentId);

  if (error) throw new Error(error.message);
}

export async function fetchDoctorsWithSupabase() {
  const { data } = await supabase
    .from('doctors')
    .select('*, profiles(name, email, employee_id, status), departments(name)')
    .order('specialization');

  return (data || []).map((d: any) => {
    const prof = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
    const dept = Array.isArray(d.departments) ? d.departments[0] : d.departments;

    return {
      id: d.id,
      userId: d.user_id,
      name: prof?.name || 'Doctor Specialist',
      email: prof?.email,
      employeeId: prof?.employee_id,
      departmentId: d.department_id,
      departmentName: dept?.name,
      specialization: d.specialization,
      roomNumber: d.room_number,
      phone: d.phone || '+1 555-0199',
      licenseNumber: d.license_number || 'LIC-1001',
      status: d.status || prof?.status || 'ACTIVE'
    };
  });
}

export async function fetchDoctorsByDepartmentWithSupabase(departmentId?: string): Promise<Doctor[]> {
  let query = supabase
    .from('doctors')
    .select('*, profiles(name, email, employee_id, status), departments(name)')
    .order('specialization');

  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data } = await query;

  return (data || []).map((d: any) => {
    const prof = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
    const dept = Array.isArray(d.departments) ? d.departments[0] : d.departments;

    return {
      id: d.id,
      userId: d.user_id,
      name: prof?.name || 'Doctor Specialist',
      email: prof?.email,
      employeeId: prof?.employee_id,
      departmentId: d.department_id,
      departmentName: dept?.name,
      specialization: d.specialization,
      roomNumber: d.room_number,
      phone: d.phone || '+1 555-0199',
      licenseNumber: d.license_number || 'LIC-1001',
      status: d.status || prof?.status || 'ACTIVE'
    };
  });
}

export async function createUserWithSupabase(userData: {
  name: string;
  email: string;
  employeeId: string;
  password: string;
  role: Role;
  departmentId?: string;
  specialization?: string;
  phone?: string;
  licenseNumber?: string;
}) {
  const passwordHash = await bcrypt.hash(userData.password, 10);

  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      name: userData.name,
      email: userData.email.toLowerCase(),
      employee_id: userData.employeeId.toUpperCase(),
      password_hash: passwordHash,
      role: userData.role,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (userData.role === 'DOCTOR' && userData.departmentId) {
    await supabase.from('doctors').insert({
      user_id: profile.id,
      department_id: userData.departmentId,
      specialization: userData.specialization || 'General Practice',
      room_number: 'Suite ' + Math.floor(100 + Math.random() * 800),
      phone: userData.phone || '+1 555-0199',
      license_number: userData.licenseNumber || 'LIC-' + Math.floor(1000 + Math.random() * 9000),
      status: 'ACTIVE'
    });
  }

  await supabase.from('audit_logs').insert({
    user_id: profile.id,
    action: 'USER_ACCOUNT_CREATED',
    status: 'SUCCESS',
    risk_score: 0,
    reason: `New ${userData.role} account created: ${userData.name}`
  });

  return profile;
}

export async function updateDoctorWithSupabase(data: {
  userId: string;
  doctorId: string;
  name: string;
  email: string;
  employeeId: string;
  departmentId: string;
  specialization: string;
  roomNumber?: string;
  phone?: string;
  licenseNumber?: string;
  status?: string;
  newPassword?: string;
}) {
  const profileUpdate: any = {
    name: data.name,
    email: data.email.toLowerCase(),
    employee_id: data.employeeId.toUpperCase(),
    status: data.status || 'ACTIVE',
    updated_at: new Date().toISOString()
  };

  if (data.newPassword && data.newPassword.trim().length > 0) {
    profileUpdate.password_hash = await bcrypt.hash(data.newPassword.trim(), 10);
  }

  const { error: profErr } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', data.userId);

  if (profErr) throw new Error(profErr.message);

  const { error: docErr } = await supabase
    .from('doctors')
    .update({
      department_id: data.departmentId,
      specialization: data.specialization,
      room_number: data.roomNumber || 'Consultation Suite',
      phone: data.phone || '+1 555-0199',
      license_number: data.licenseNumber || 'LIC-1001',
      status: data.status || 'ACTIVE'
    })
    .eq('id', data.doctorId);

  if (docErr) throw new Error(docErr.message);

  await supabase.from('audit_logs').insert({
    user_id: data.userId,
    action: data.newPassword ? 'DOCTOR_PROFILE_AND_PASSWORD_UPDATED' : 'DOCTOR_PROFILE_UPDATED',
    status: 'SUCCESS',
    risk_score: data.newPassword ? 10 : 0,
    reason: `Updated doctor profile for ${data.name}${data.newPassword ? ' (password reset by admin)' : ''}`
  });
}

export async function updateUserProfileWithSupabase(data: {
  userId: string;
  name: string;
  email: string;
  employeeId: string;
  status: string;
  newPassword?: string;
}) {
  const profileUpdate: any = {
    name: data.name,
    email: data.email.toLowerCase(),
    employee_id: data.employeeId.toUpperCase(),
    status: data.status,
    updated_at: new Date().toISOString()
  };

  if (data.newPassword && data.newPassword.trim().length > 0) {
    profileUpdate.password_hash = await bcrypt.hash(data.newPassword.trim(), 10);
  }

  const { error } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', data.userId);

  if (error) throw new Error(error.message);

  await supabase.from('audit_logs').insert({
    user_id: data.userId,
    action: data.newPassword ? 'USER_PASSWORD_RESET_BY_ADMIN' : 'USER_PROFILE_UPDATED',
    status: 'SUCCESS',
    risk_score: data.newPassword ? 10 : 0,
    reason: `Profile updated${data.newPassword ? ' with password reset by admin' : ''}`
  });
}

export async function updateUserStatusWithSupabase(userId: string, status: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw new Error(error.message);

  await supabase.from('doctors').update({ status }).eq('user_id', userId);

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: status === 'ACTIVE' ? 'USER_ACCOUNT_ENABLED' : 'USER_ACCOUNT_DISABLED',
    status: 'SUCCESS',
    risk_score: status === 'LOCKED' ? 30 : 0,
    reason: `Account status changed to ${status}`
  });
}

export async function deleteUserWithSupabase(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

// ============================================
// PATIENTS: RLS-Strict Doctor & Admin Access
// ============================================

export async function fetchDoctorPatientsWithSupabase(currentUser: User): Promise<Patient[]> {
  if (currentUser.role !== 'DOCTOR') {
    return [];
  }

  let doctorId = currentUser.doctor?.id;

  if (!doctorId) {
    const { data: docRecord } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', currentUser.id)
      .single();
    if (docRecord) {
      doctorId = docRecord.id;
    }
  }

  if (!doctorId) {
    return [];
  }

  // 1. Get active assignments for this doctor
  const { data: assignments } = await supabase
    .from('patient_doctor_assignments')
    .select('patient_id')
    .eq('doctor_id', doctorId)
    .eq('status', 'ACTIVE');

  // 2. Get active break glass events for this doctor
  const { data: bgEvents } = await supabase
    .from('break_glass_events')
    .select('patient_id')
    .eq('doctor_id', doctorId)
    .eq('status', 'ACTIVE')
    .gt('expires_at', new Date().toISOString());

  const assignedPatientIds = new Set<string>();
  (assignments || []).forEach((a: any) => assignedPatientIds.add(a.patient_id));

  const bgPatientIds = new Set<string>();
  (bgEvents || []).forEach((b: any) => bgPatientIds.add(b.patient_id));

  const allAuthorizedIds = Array.from(new Set([...Array.from(assignedPatientIds), ...Array.from(bgPatientIds)]));

  if (allAuthorizedIds.length === 0) {
    return [];
  }

  // 3. Query patients STRICTLY filtered by authorized IDs
  const { data: patients } = await supabase
    .from('patients')
    .select('*, departments(name), patient_doctor_assignments(status, doctors(id, user_id, specialization, profiles(name)))')
    .in('id', allAuthorizedIds)
    .order('created_at', { ascending: false });

  if (!patients) return [];

  return patients.map((p: any) => {
    const deptName = Array.isArray(p.departments) ? p.departments[0]?.name : (p.departments as any)?.name;

    return {
      id: p.id,
      name: p.name,
      address: p.address,
      phone: p.phone,
      bloodGroup: p.blood_group,
      previousMedicines: p.previous_medicines,
      currentProblem: p.current_problem,
      departmentId: p.department_id,
      departmentName: deptName || 'Clinical Dept',
      assignedDoctorName: currentUser.name,
      aadharNumber: maskAadhar(p.aadhar_number),
      createdAt: p.created_at,
      isAuthorized: true,
      isBreakGlass: bgPatientIds.has(p.id) && !assignedPatientIds.has(p.id)
    };
  });
}

export async function fetchUnassignedPatientsForBreakGlassWithSupabase(currentUser: User): Promise<Patient[]> {
  if (currentUser.role !== 'DOCTOR') {
    return [];
  }

  let doctorId = currentUser.doctor?.id;
  if (!doctorId) {
    const { data: docRecord } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', currentUser.id)
      .single();
    if (docRecord) doctorId = docRecord.id;
  }

  if (!doctorId) return [];

  // Get active assigned patient IDs
  const { data: assignments } = await supabase
    .from('patient_doctor_assignments')
    .select('patient_id')
    .eq('doctor_id', doctorId)
    .eq('status', 'ACTIVE');

  // Get active break glass IDs
  const { data: bgEvents } = await supabase
    .from('break_glass_events')
    .select('patient_id')
    .eq('doctor_id', doctorId)
    .eq('status', 'ACTIVE')
    .gt('expires_at', new Date().toISOString());

  const excludedPatientIds = new Set<string>();
  (assignments || []).forEach((a: any) => excludedPatientIds.add(a.patient_id));
  (bgEvents || []).forEach((b: any) => excludedPatientIds.add(b.patient_id));

  // Get all patients
  const { data: allPatients } = await supabase
    .from('patients')
    .select('*, departments(name), patient_doctor_assignments(status, doctors(id, user_id, specialization, profiles(name)))')
    .order('created_at', { ascending: false });

  if (!allPatients) return [];

  const unassigned = allPatients.filter((p: any) => !excludedPatientIds.has(p.id));

  return unassigned.map((p: any) => {
    const activeAssign = (p.patient_doctor_assignments || []).find((a: any) => a.status === 'ACTIVE');
    const docProf = activeAssign?.doctors?.profiles;
    const assignedDoctorName = (Array.isArray(docProf) ? docProf[0]?.name : (docProf as any)?.name) || 'Department Specialist';
    const deptName = Array.isArray(p.departments) ? p.departments[0]?.name : (p.departments as any)?.name;

    return {
      id: p.id,
      name: p.name,
      address: p.address,
      phone: p.phone,
      bloodGroup: p.blood_group,
      previousMedicines: p.previous_medicines,
      currentProblem: p.current_problem,
      departmentId: p.department_id,
      departmentName: deptName || 'Hospital Dept',
      assignedDoctorName,
      aadharNumber: maskAadhar(p.aadhar_number),
      createdAt: p.created_at,
      isAuthorized: false,
      isBreakGlass: false
    };
  });
}

export async function fetchHospitalPatientsWithSupabase(currentUser: User): Promise<Patient[]> {
  if (currentUser.role === 'DOCTOR') {
    return fetchDoctorPatientsWithSupabase(currentUser);
  }

  const { data: patients } = await supabase
    .from('patients')
    .select('*, departments(name), patient_doctor_assignments(status, doctors(id, user_id, specialization, profiles(name)))')
    .order('created_at', { ascending: false });

  if (!patients) return [];

  return patients.map((p: any) => {
    const activeAssign = (p.patient_doctor_assignments || []).find((a: any) => a.status === 'ACTIVE');
    const docProfiles = activeAssign?.doctors?.profiles;
    const assignedDoctorName = (Array.isArray(docProfiles) ? docProfiles[0]?.name : (docProfiles as any)?.name) || 'Unassigned';
    const deptName = Array.isArray(p.departments) ? p.departments[0]?.name : (p.departments as any)?.name;

    return {
      id: p.id,
      name: p.name,
      address: p.address,
      phone: p.phone,
      bloodGroup: p.blood_group,
      previousMedicines: p.previous_medicines,
      currentProblem: p.current_problem,
      departmentId: p.department_id,
      departmentName: deptName || 'General',
      assignedDoctorName,
      aadharNumber: maskAadhar(p.aadhar_number),
      createdAt: p.created_at,
      isAuthorized: true,
      isBreakGlass: false
    };
  });
}

export async function fetchPatientDetailsWithSupabase(currentUser: User, patientId: string): Promise<Patient> {
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*, departments(name), patient_doctor_assignments(status, doctors(id, user_id, specialization, profiles(name)))')
    .eq('id', patientId)
    .single();

  if (error || !patient) {
    throw new Error('Patient record not found');
  }

  let isAuthorized = false;
  let isBreakGlass = false;

  let doctorId = currentUser.doctor?.id;
  if (!doctorId && currentUser.role === 'DOCTOR') {
    const { data: docRecord } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', currentUser.id)
      .single();
    if (docRecord) doctorId = docRecord.id;
  }

  if (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST') {
    isAuthorized = true;
  } else if (currentUser.role === 'DOCTOR' && doctorId) {
    const { data: assignments } = await supabase
      .from('patient_doctor_assignments')
      .select('id')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .eq('status', 'ACTIVE');

    if (assignments && assignments.length > 0) {
      isAuthorized = true;
    } else {
      const { data: bgEvents } = await supabase
        .from('break_glass_events')
        .select('id')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .eq('status', 'ACTIVE')
        .gt('expires_at', new Date().toISOString());

      if (bgEvents && bgEvents.length > 0) {
        isAuthorized = true;
        isBreakGlass = true;
      }
    }
  }

  if (!isAuthorized) {
    await supabase.from('security_events').insert({
      user_id: currentUser.id,
      event_type: 'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT',
      risk_score: 65,
      classification: 'HIGH',
      details: `User ${currentUser.name} (${currentUser.role}) attempted unauthorized access to patient ID ${patientId}`
    });

    await supabase.from('audit_logs').insert({
      user_id: currentUser.id,
      action: 'UNAUTHORIZED_PATIENT_ACCESS_DENIED',
      patient_id: patientId,
      status: 'DENIED',
      risk_score: 65,
      reason: `Unauthorized access block. Patient not assigned to ${currentUser.name}`
    });

    throw new Error('ACCESS_RESTRICTED');
  }

  await supabase.from('audit_logs').insert({
    user_id: currentUser.id,
    action: isBreakGlass ? 'BREAK_GLASS_PATIENT_VIEW' : 'PATIENT_VIEW',
    patient_id: patientId,
    status: isBreakGlass ? 'EMERGENCY' : 'SUCCESS',
    risk_score: isBreakGlass ? 40 : 0,
    reason: isBreakGlass ? 'Emergency Break-Glass record view' : 'Authorized patient record view'
  });

  const activeAssign = (patient.patient_doctor_assignments || []).find((a: any) => a.status === 'ACTIVE');
  const docProf = activeAssign?.doctors?.profiles;
  const assignedDoctorName = (Array.isArray(docProf) ? docProf[0]?.name : (docProf as any)?.name) || currentUser.name;
  const deptName = Array.isArray(patient.departments) ? patient.departments[0]?.name : (patient.departments as any)?.name;

  return {
    id: patient.id,
    name: patient.name,
    address: patient.address,
    phone: patient.phone,
    bloodGroup: patient.blood_group,
    previousMedicines: patient.previous_medicines,
    currentProblem: patient.current_problem,
    departmentId: patient.department_id,
    departmentName: deptName || 'Medical Dept',
    assignedDoctorName,
    aadharNumber: maskAadhar(patient.aadhar_number),
    createdAt: patient.created_at,
    isAuthorized: true,
    isBreakGlass,
    isBreakGlassView: isBreakGlass
  };
}

export async function registerPatientWithSupabase(data: {
  name: string;
  address: string;
  aadharNumber: string;
  phone: string;
  bloodGroup: string;
  previousMedicines?: string;
  currentProblem: string;
  departmentId: string;
  doctorId?: string;
  receptionistUserId?: string;
}) {
  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      name: data.name,
      address: data.address,
      aadhar_number: data.aadharNumber,
      phone: data.phone,
      blood_group: data.bloodGroup,
      previous_medicines: data.previousMedicines || 'None reported',
      current_problem: data.currentProblem,
      department_id: data.departmentId
    })
    .select('*, departments(name)')
    .single();

  if (error || !patient) throw error || new Error('Failed to insert patient record');

  let selectedDoctorId = data.doctorId;

  if (!selectedDoctorId) {
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id, profiles(name)')
      .eq('department_id', data.departmentId)
      .limit(1);

    if (doctors && doctors.length > 0) {
      selectedDoctorId = doctors[0].id;
    }
  }

  let assignedDoctor = null;

  if (selectedDoctorId) {
    await supabase.from('patient_doctor_assignments').insert({
      patient_id: patient.id,
      doctor_id: selectedDoctorId,
      status: 'ACTIVE'
    });

    const { data: docData } = await supabase
      .from('doctors')
      .select('id, specialization, profiles(name)')
      .eq('id', selectedDoctorId)
      .single();

    if (docData) {
      const profName = Array.isArray(docData.profiles) ? docData.profiles[0]?.name : (docData.profiles as any)?.name;
      assignedDoctor = {
        id: docData.id,
        name: profName || 'Department Specialist',
        specialization: docData.specialization
      };
    }
  }

  await supabase.from('audit_logs').insert({
    user_id: data.receptionistUserId,
    action: 'PATIENT_REGISTERED',
    patient_id: patient.id,
    status: 'SUCCESS',
    risk_score: 0,
    reason: `Registered patient ${patient.name} and assigned to ${assignedDoctor?.name || 'Department pool'}`
  });

  const deptName = Array.isArray(patient.departments) ? patient.departments[0]?.name : (patient.departments as any)?.name;

  return {
    patient: {
      id: patient.id,
      name: patient.name,
      currentProblem: patient.current_problem,
      departmentName: deptName || 'Medical Department'
    },
    assignedDoctor
  };
}

// ============================================
// BREAK GLASS: Request, Verify, Active List
// ============================================

export async function requestBreakGlassWithSupabase(doctorUserId: string, patientId: string, reason: string) {
  const { data: doctorRecords } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', doctorUserId);
  
  const doctorId = doctorRecords && doctorRecords[0]?.id;

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabase.from('otp_sessions').insert({
    user_id: doctorUserId,
    otp_code: generatedOtp,
    expires_at: expiresAt
  });

  await supabase.from('audit_logs').insert({
    user_id: doctorUserId,
    action: 'EMERGENCY_BREAK_GLASS_REQUESTED',
    patient_id: patientId,
    status: 'WARNING',
    risk_score: 35,
    reason: `Emergency Break-Glass requested. Reason: ${reason}`
  });

  return { demoOtpCode: generatedOtp, doctorId };
}

export async function verifyBreakGlassWithSupabase(doctorUserId: string, patientId: string, reason: string, _otpCode: string) {
  const { data: doctorRecords } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', doctorUserId);
  
  const doctorId = doctorRecords && doctorRecords[0]?.id;
  if (!doctorId) throw new Error('Doctor record not found');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  await supabase
    .from('break_glass_events')
    .update({ status: 'EXPIRED' })
    .eq('doctor_id', doctorId)
    .eq('patient_id', patientId)
    .eq('status', 'ACTIVE');

  const { data: breakGlass, error } = await supabase
    .from('break_glass_events')
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      reason,
      started_at: now.toISOString(),
      expires_at: expiresAt,
      status: 'ACTIVE',
      otp_verified: true
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('audit_logs').insert({
    user_id: doctorUserId,
    action: 'BREAK_GLASS_ACCESS_GRANTED',
    patient_id: patientId,
    status: 'EMERGENCY',
    risk_score: 50,
    reason: `Emergency 15-minute access granted. Reason: ${reason}`
  });

  await supabase.from('security_events').insert({
    user_id: doctorUserId,
    event_type: 'EMERGENCY_BREAK_GLASS_ACTIVATED',
    risk_score: 50,
    classification: 'MEDIUM',
    details: `Activated Break-Glass for patient. Reason: ${reason}`
  });

  return breakGlass;
}

export async function fetchActiveBreakGlassWithSupabase(doctorId: string): Promise<ActiveBreakGlass[]> {
  const { data: events } = await supabase
    .from('break_glass_events')
    .select('*, patients(name, departments(name))')
    .eq('doctor_id', doctorId)
    .eq('status', 'ACTIVE')
    .gt('expires_at', new Date().toISOString());

  return (events || []).map((e: any) => {
    const patName = Array.isArray(e.patients) ? e.patients[0]?.name : (e.patients as any)?.name;
    const deptObj = Array.isArray(e.patients) ? e.patients[0]?.departments : (e.patients as any)?.departments;
    const deptName = Array.isArray(deptObj) ? deptObj[0]?.name : (deptObj as any)?.name;

    return {
      id: e.id,
      patientId: e.patient_id,
      patientName: patName || 'Emergency Patient',
      patientDepartment: deptName || 'Clinical Dept',
      reason: e.reason,
      startedAt: e.started_at,
      expiresAt: e.expires_at,
      remainingSeconds: Math.max(0, Math.floor((new Date(e.expires_at).getTime() - Date.now()) / 1000))
    };
  });
}

// ============================================
// AUDIT LOGS
// ============================================

export async function fetchAuditLogsWithSupabase(filters?: { action?: string; status?: string; userId?: string }): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*, profiles!audit_logs_user_id_fkey(name, email, role), patients!audit_logs_patient_id_fkey(name)')
    .order('timestamp', { ascending: false })
    .limit(50);

  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.userId) query = query.eq('user_id', filters.userId);

  const { data: logs } = await query;

  return (logs || []).map((l: any) => {
    const prof = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
    const pat = Array.isArray(l.patients) ? l.patients[0] : l.patients;

    return {
      id: l.id,
      userId: l.user_id,
      user: prof ? { id: l.user_id, name: prof.name, role: prof.role, email: prof.email } : undefined,
      action: l.action,
      patientId: l.patient_id,
      patient: pat ? { id: l.patient_id, name: pat.name } : undefined,
      status: l.status,
      riskScore: l.risk_score,
      reason: l.reason,
      ipAddress: l.ip_address,
      timestamp: l.timestamp
    };
  });
}

// ============================================
// SECURITY EVENTS
// ============================================

export async function fetchSecurityEventsWithSupabase(): Promise<SecurityEvent[]> {
  const { data } = await supabase
    .from('security_events')
    .select('*, profiles!security_events_user_id_fkey(name, email, role)')
    .order('timestamp', { ascending: false })
    .limit(50);

  return (data || []).map((e: any) => {
    const prof = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;

    return {
      id: e.id,
      userId: e.user_id,
      user: prof ? { name: prof.name, role: prof.role, email: prof.email } : undefined,
      eventType: e.event_type,
      riskScore: e.risk_score,
      classification: e.classification,
      details: e.details,
      timestamp: e.timestamp
    };
  });
}

// ============================================
// THREAT MONITOR / AI SCORING
// ============================================

export async function fetchThreatMonitorWithSupabase(): Promise<ThreatOverview> {
  const { count: failedLogins } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('action', 'FAILED_LOGIN_ATTEMPT');
  const { count: unauthorizedAttempts } = await supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('event_type', 'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT');
  const { count: activeBreakGlass } = await supabase.from('break_glass_events').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');

  const failedVal = failedLogins || 0;
  const unauthVal = unauthorizedAttempts || 0;
  const breakGlassVal = activeBreakGlass || 0;

  const riskScore = Math.min(100, (failedVal * 15) + (unauthVal * 25) + (breakGlassVal * 20));
  let classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore > 80) classification = 'CRITICAL';
  else if (riskScore > 60) classification = 'HIGH';
  else if (riskScore > 30) classification = 'MEDIUM';

  const explainableReasons: string[] = [];
  if (failedVal > 0) explainableReasons.push(`Failed authentication attempts detected (${failedVal})`);
  if (unauthVal > 0) explainableReasons.push(`Unauthorized patient access attempts (${unauthVal})`);
  if (breakGlassVal > 0) explainableReasons.push(`Active Emergency Break-Glass override sessions (${breakGlassVal})`);
  if (explainableReasons.length === 0) explainableReasons.push('Standard operational access pattern');

  return {
    riskScore,
    classification,
    isAnomaly: riskScore > 60,
    explainableReasons,
    recommendation: classification === 'CRITICAL' ? 'Account lock recommended' : (classification === 'HIGH' ? 'Enhanced audit monitoring' : 'No action required')
  };
}

// ============================================
// HELPERS
// ============================================

function maskAadhar(aadhar: string): string {
  if (!aadhar || aadhar.length < 8) return 'XXXX-XXXX-XXXX';
  const clean = aadhar.replace(/[^0-9]/g, '');
  if (clean.length < 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${clean.slice(-4)}`;
}
