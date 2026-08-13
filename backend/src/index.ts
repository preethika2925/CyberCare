import express from 'express';
import cors from 'cors';
import { config } from './config';

import { login, verifyOtp, resendOtp, getMe, logout } from './controllers/authController';
import {
  getDashboardOverview,
  getUsers,
  createUser,
  updateUserStatus,
  deleteUser,
  getAuditLogs,
  getSecurityEvents,
  getThreatMonitor
} from './controllers/adminController';
import {
  getDoctorProfile,
  getMyPatients,
  getAllHospitalPatients,
  getPatientDetail
} from './controllers/doctorController';
import { registerPatient, getDepartments } from './controllers/receptionistController';
import {
  requestBreakGlass,
  verifyBreakGlass,
  getActiveBreakGlass,
  revokeBreakGlass
} from './controllers/breakGlassController';

import { authenticateJWT, requireRole } from './middleware/auth';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Public Auth Routes
app.post('/api/auth/login', login);
app.post('/api/auth/verify-otp', verifyOtp);
app.post('/api/auth/resend-otp', resendOtp);

// Protected Auth Routes
app.get('/api/auth/me', authenticateJWT, getMe);
app.post('/api/auth/logout', authenticateJWT, logout);

// Department List (for intake dropdowns)
app.get('/api/departments', authenticateJWT, getDepartments);

// Doctor Routes
app.get('/api/doctors/me', authenticateJWT, requireRole('DOCTOR'), getDoctorProfile);
app.get('/api/doctors/me/patients', authenticateJWT, requireRole('DOCTOR'), getMyPatients);
app.get('/api/doctors/hospital-patients', authenticateJWT, requireRole('DOCTOR'), getAllHospitalPatients);
app.get('/api/patients/:id', authenticateJWT, getPatientDetail);

// Receptionist Routes
app.post('/api/patients', authenticateJWT, requireRole('RECEPTIONIST', 'ADMIN'), registerPatient);

// Emergency Break-Glass Routes
app.post('/api/break-glass/request', authenticateJWT, requireRole('DOCTOR'), requestBreakGlass);
app.post('/api/break-glass/verify', authenticateJWT, requireRole('DOCTOR'), verifyBreakGlass);
app.get('/api/break-glass/active', authenticateJWT, requireRole('DOCTOR', 'ADMIN'), getActiveBreakGlass);
app.post('/api/break-glass/revoke/:id', authenticateJWT, requireRole('ADMIN', 'DOCTOR'), revokeBreakGlass);

// Admin Routes
app.get('/api/admin/overview', authenticateJWT, requireRole('ADMIN'), getDashboardOverview);
app.get('/api/admin/users', authenticateJWT, requireRole('ADMIN'), getUsers);
app.post('/api/admin/users', authenticateJWT, requireRole('ADMIN'), createUser);
app.put('/api/admin/users/:id/status', authenticateJWT, requireRole('ADMIN'), updateUserStatus);
app.delete('/api/admin/users/:id', authenticateJWT, requireRole('ADMIN'), deleteUser);
app.get('/api/admin/audit-logs', authenticateJWT, requireRole('ADMIN'), getAuditLogs);
app.get('/api/admin/security-events', authenticateJWT, requireRole('ADMIN'), getSecurityEvents);
app.get('/api/admin/threat-monitor', authenticateJWT, requireRole('ADMIN'), getThreatMonitor);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message || 'An unexpected error occurred' });
});

app.listen(config.port, () => {
  console.log(`⚡ CyberCare Backend Server running on http://localhost:${config.port}`);
});
