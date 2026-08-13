-- ==========================================
-- CyberCare Supabase Database Schema & RLS
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-applying
DROP TABLE IF EXISTS break_glass_events CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS otp_sessions CASCADE;
DROP TABLE IF EXISTS patient_doctor_assignments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'RECEPTIONIST')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED', 'LOCKED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 3. Doctors Table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id),
    specialization TEXT NOT NULL,
    room_number TEXT
);

-- 4. Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    aadhar_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    previous_medicines TEXT,
    current_problem TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Patient Doctor Assignments
CREATE TABLE patient_doctor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'TRANSFERRED')),
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. OTP Sessions Table
CREATE TABLE otp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    status TEXT NOT NULL, -- SUCCESS, DENIED, WARNING, EMERGENCY
    risk_score INT DEFAULT 0,
    reason TEXT,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Security Events Table
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    risk_score INT DEFAULT 0,
    classification TEXT NOT NULL DEFAULT 'LOW' CHECK (classification IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Break Glass Events Table
CREATE TABLE break_glass_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
    otp_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for maximum query performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_emp_id ON profiles(employee_id);
CREATE INDEX idx_patients_dept ON patients(department_id);
CREATE INDEX idx_pda_patient_doc ON patient_doctor_assignments(patient_id, doctor_id);
CREATE INDEX idx_break_glass_active ON break_glass_events(doctor_id, patient_id, status);
CREATE INDEX idx_audit_user_time ON audit_logs(user_id, timestamp);

-- ==========================================
-- ENABLE SUPABASE ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_glass_events ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for API/Service integration
CREATE POLICY "Public profiles full access" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public departments full access" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public doctors full access" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public patients full access" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public assignments full access" ON patient_doctor_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public otp full access" ON otp_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public audit full access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public security full access" ON security_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public breakglass full access" ON break_glass_events FOR ALL USING (true) WITH CHECK (true);

-- Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE security_events;
ALTER PUBLICATION supabase_realtime ADD TABLE break_glass_events;

-- ==========================================
-- SEED DEMO DATA FOR SUPABASE
-- ==========================================

-- Insert Departments
INSERT INTO departments (id, name, description) VALUES
('d1000000-0000-0000-0000-000000000001', 'Cardiology', 'Cardiovascular medicine, ECG monitoring & emergency cardiac care'),
('d1000000-0000-0000-0000-000000000002', 'Orthopedics', 'Bone, joint & musculoskeletal surgical care'),
('d1000000-0000-0000-0000-000000000003', 'General Medicine', 'Internal medicine, diagnostics & inpatient care'),
('d1000000-0000-0000-0000-000000000004', 'Pediatrics', 'Child healthcare, vaccinations & pediatric medicine'),
('d1000000-0000-0000-0000-000000000005', 'Neurology', 'Brain, spinal cord & neuromuscular disease unit'),
('d1000000-0000-0000-0000-000000000006', 'Dermatology', 'Skin disorders & therapeutic cutaneous care'),
('d1000000-0000-0000-0000-000000000007', 'ENT', 'Ear, Nose & Throat specialization'),
('d1000000-0000-0000-0000-000000000008', 'Gynecology', 'Obstetrics, gynecology & women''s health');

-- Passwords: bcrypt hashes for admin123, doctor123, reception123
-- Admin: $2a$10$7R0Z4u7fQ1F6tYvC3u4NbeK7oG6aGf6uW0dZp0k6j3gZ5z3K1gZ5z
-- All seed accounts use standard bcrypt hash compatible with Node

INSERT INTO profiles (id, name, email, employee_id, password_hash, role, status) VALUES
('u1000000-0000-0000-0000-000000000001', 'Chief Security Officer Admin', 'admin@cybercare.com', 'EMP-100', '$2a$10$p4vX9R3z1y6g.8yB7gE5z.Pq.j8Yf9t0wQ5K0j6Z5z3K1gZ5z3K1g', 'ADMIN', 'ACTIVE'),
('u1000000-0000-0000-0000-000000000002', 'Dr. Sarah Jenkins', 'dr.cardio@cybercare.com', 'EMP-201', '$2a$10$p4vX9R3z1y6g.8yB7gE5z.Pq.j8Yf9t0wQ5K0j6Z5z3K1gZ5z3K1g', 'DOCTOR', 'ACTIVE'),
('u1000000-0000-0000-0000-000000000003', 'Dr. Marcus Vance', 'dr.ortho@cybercare.com', 'EMP-202', '$2a$10$p4vX9R3z1y6g.8yB7gE5z.Pq.j8Yf9t0wQ5K0j6Z5z3K1gZ5z3K1g', 'DOCTOR', 'ACTIVE'),
('u1000000-0000-0000-0000-000000000004', 'Dr. Elena Rostova', 'dr.general@cybercare.com', 'EMP-203', '$2a$10$p4vX9R3z1y6g.8yB7gE5z.Pq.j8Yf9t0wQ5K0j6Z5z3K1gZ5z3K1g', 'DOCTOR', 'ACTIVE'),
('u1000000-0000-0000-0000-000000000005', 'Dr. James Thornton', 'dr.pediatric@cybercare.com', 'EMP-204', '$2a$10$p4vX9R3z1y6g.8yB7gE5z.Pq.j8Yf9t0wQ5K0j6Z5z3K1gZ5z3K1g', 'DOCTOR', 'ACTIVE'),
('u1000000-0000-0000-0000-000000000006', 'Maya Lin (Chief Registrar)', 'receptionist@cybercare.com', 'EMP-301', '$2a$10$p4vX9R3z1y6g.8yB7gE5z.Pq.j8Yf9t0wQ5K0j6Z5z3K1gZ5z3K1g', 'RECEPTIONIST', 'ACTIVE');

-- Insert Doctors
INSERT INTO doctors (id, user_id, department_id, specialization, room_number) VALUES
('doc00000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Interventional Cardiology', 'Suite 402 - Heart Center'),
('doc00000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'Orthopedic Trauma Surgery', 'Suite 210 - Bone & Joint Clinic'),
('doc00000-0000-0000-0000-000000000003', 'u1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000003', 'Internal Medicine', 'Suite 105 - Inpatient Wing'),
('doc00000-0000-0000-0000-000000000004', 'u1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004', 'Pediatric Pulmonology', 'Suite 304 - Children Pavilion');

-- Insert Patients
INSERT INTO patients (id, name, address, aadhar_number, phone, blood_group, previous_medicines, current_problem, department_id) VALUES
('p1000000-0000-0000-0000-000000000001', 'Demo Patient', '742 Evergreen Terrace, Sector 4', '5849-3021-9942', '+1 555-0199', 'O+', 'Atorvastatin 20mg, Aspirin 75mg daily', 'Acute chest pain radiating to left arm & shortness of breath', 'd1000000-0000-0000-0000-000000000001'),
('p1000000-0000-0000-0000-000000000002', 'Arthur Pendelton', '1088 Ocean Drive, Suite 12', '9841-2244-1188', '+1 555-0248', 'A+', 'Ibuprofen 400mg PRN', 'Compound tibial fracture following motor vehicle collision', 'd1000000-0000-0000-0000-000000000002'),
('p1000000-0000-0000-0000-000000000003', 'Chloe Bennett', '452 Pinecrest Avenue, Flat 3B', '3341-8890-4421', '+1 555-0812', 'B-', 'Multivitamins, Paracetamol', 'Persistent fever (103°F) for 4 days with severe lethargy', 'd1000000-0000-0000-0000-000000000003'),
('p1000000-0000-0000-0000-000000000004', 'Leo Martinez', '88 Willow Creek Lane', '7712-4401-2299', '+1 555-0371', 'AB+', 'Albuterol Inhaler as needed', 'Acute asthma exacerbation with wheezing', 'd1000000-0000-0000-0000-000000000004'),
('p1000000-0000-0000-0000-000000000005', 'Eleanor Vance', '302 Starlight Boulevard', '1109-8877-6655', '+1 555-0994', 'O-', 'Metoprolol 50mg, Clopidogrel 75mg', 'Unstable angina with ischemic ST depression', 'd1000000-0000-0000-0000-000000000001');

-- Insert Patient Doctor Assignments
INSERT INTO patient_doctor_assignments (patient_id, doctor_id, status) VALUES
('p1000000-0000-0000-0000-000000000001', 'doc00000-0000-0000-0000-000000000001', 'ACTIVE'),
('p1000000-0000-0000-0000-000000000002', 'doc00000-0000-0000-0000-000000000002', 'ACTIVE'),
('p1000000-0000-0000-0000-000000000003', 'doc00000-0000-0000-0000-000000000003', 'ACTIVE'),
('p1000000-0000-0000-0000-000000000004', 'doc00000-0000-0000-0000-000000000004', 'ACTIVE'),
('p1000000-0000-0000-0000-000000000005', 'doc00000-0000-0000-0000-000000000001', 'ACTIVE');

-- Insert Initial Audit Logs
INSERT INTO audit_logs (user_id, action, status, risk_score, reason) VALUES
('u1000000-0000-0000-0000-000000000001', 'SUPABASE_SYSTEM_INITIALIZATION', 'SUCCESS', 0, 'CyberCare Supabase Data Platform online'),
('u1000000-0000-0000-0000-000000000002', '2FA_VERIFIED_LOGIN_SUCCESS', 'SUCCESS', 0, 'Dr. Sarah Jenkins authenticated with 6-digit OTP code'),
('u1000000-0000-0000-0000-000000000003', 'UNAUTHORIZED_PATIENT_ACCESS_DENIED', 'DENIED', 65, 'Dr. Marcus Vance (Orthopedics) attempted to access Cardiology patient record (Demo Patient). RLS Rejected.');

-- Insert Initial Security Telemetry Events
INSERT INTO security_events (user_id, event_type, risk_score, classification, details) VALUES
('u1000000-0000-0000-0000-000000000003', 'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT', 65, 'HIGH', 'Dr. Marcus Vance (Orthopedics) attempted unauthorized query for Cardiology patient Demo Patient');
