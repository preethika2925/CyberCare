export type Role = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'LOCKED';

export interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: Role;
  status: UserStatus;
  createdAt?: string;
  doctor?: Doctor | null;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  doctorCount?: number;
  patientCount?: number;
}

export interface Doctor {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  employeeId?: string;
  departmentId: string;
  departmentName?: string;
  department?: Department;
  specialization: string;
  roomNumber?: string;
  phone?: string;
  licenseNumber?: string;
  status?: string;
  createdAt?: string;
  patientCount?: number;
}

export interface Patient {
  id: string;
  name: string;
  address: string;
  aadharNumber: string;
  phone: string;
  bloodGroup: string;
  previousMedicines?: string;
  currentProblem: string;
  departmentId: string;
  departmentName?: string;
  department?: Department;
  assignedDoctorName?: string;
  assignedDoctorId?: string;
  isAuthorized?: boolean;
  isBreakGlass?: boolean;
  isBreakGlassView?: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    role: Role;
    email: string;
  };
  action: string;
  patientId?: string;
  patient?: {
    id: string;
    name: string;
  };
  status: 'SUCCESS' | 'DENIED' | 'WARNING' | 'EMERGENCY';
  riskScore: number;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  user?: {
    name: string;
    role: Role;
    email: string;
  };
  eventType: string;
  riskScore: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  timestamp: string;
}

export interface ActiveBreakGlass {
  id: string;
  patientId: string;
  patientName: string;
  patientDepartment: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
}

export interface ThreatOverview {
  riskScore: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isAnomaly: boolean;
  explainableReasons: string[];
  recommendation: string;
}
