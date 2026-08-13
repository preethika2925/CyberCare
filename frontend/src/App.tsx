import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { OtpVerifyPage } from './pages/OtpVerifyPage';

import { ProtectedRoute, RoleGuard } from './components/auth/ProtectedRoute';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { PatientManagementPage } from './pages/admin/PatientManagementPage';
import { ThreatMonitorPage } from './pages/admin/ThreatMonitorPage';
import { AuditTrailPage } from './pages/admin/AuditTrailPage';

import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage';
import { DoctorBreakGlassPage } from './pages/doctor/DoctorBreakGlassPage';

import { ReceptionistDashboard } from './pages/receptionist/ReceptionistDashboard';
import { RegisterPatientPage } from './pages/receptionist/RegisterPatientPage';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/verify-otp" element={<OtpVerifyPage />} />

            {/* Authenticated Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Admin Routes */}
              <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/patients" element={<PatientManagementPage />} />
                <Route path="/admin/security" element={<ThreatMonitorPage />} />
                <Route path="/admin/audit" element={<AuditTrailPage />} />
              </Route>

              {/* Doctor Routes */}
              <Route element={<RoleGuard allowedRoles={['DOCTOR']} />}>
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
                <Route path="/doctor/break-glass" element={<DoctorBreakGlassPage />} />
              </Route>

              {/* Receptionist Routes */}
              <Route element={<RoleGuard allowedRoles={['RECEPTIONIST']} />}>
                <Route path="/receptionist" element={<ReceptionistDashboard />} />
                <Route path="/receptionist/register-patient" element={<RegisterPatientPage />} />
                <Route path="/receptionist/patients" element={<PatientManagementPage />} />
              </Route>
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
