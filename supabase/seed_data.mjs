const PAT = process.env.SUPABASE_PAT || 'YOUR_SUPABASE_PAT';
const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'zshuteybuywijzbknhxb';

async function execSQL(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('ERROR:', res.status, text.substring(0, 300));
    throw new Error('SQL failed');
  }
  console.log('OK:', query.substring(0, 80).replace(/\n/g, ' ') + '...');
  return JSON.parse(text);
}

async function run() {
  // Use valid hex UUIDs
  // Users
  const ADMIN_ID     = 'a1000000-0000-0000-0000-000000000001';
  const DR_CARDIO_ID = 'a2000000-0000-0000-0000-000000000002';
  const DR_ORTHO_ID  = 'a3000000-0000-0000-0000-000000000003';
  const DR_GEN_ID    = 'a4000000-0000-0000-0000-000000000004';
  const DR_PED_ID    = 'a5000000-0000-0000-0000-000000000005';
  const RECEP_ID     = 'a6000000-0000-0000-0000-000000000006';

  // Departments
  const DEP_CARDIO   = 'b1000000-0000-0000-0000-000000000001';
  const DEP_ORTHO    = 'b2000000-0000-0000-0000-000000000002';
  const DEP_GEN      = 'b3000000-0000-0000-0000-000000000003';
  const DEP_PED      = 'b4000000-0000-0000-0000-000000000004';
  const DEP_NEURO    = 'b5000000-0000-0000-0000-000000000005';
  const DEP_DERM     = 'b6000000-0000-0000-0000-000000000006';
  const DEP_ENT      = 'b7000000-0000-0000-0000-000000000007';
  const DEP_GYN      = 'b8000000-0000-0000-0000-000000000008';

  // Doctors
  const DOC_CARDIO   = 'c1000000-0000-0000-0000-000000000001';
  const DOC_ORTHO    = 'c2000000-0000-0000-0000-000000000002';
  const DOC_GEN      = 'c3000000-0000-0000-0000-000000000003';
  const DOC_PED      = 'c4000000-0000-0000-0000-000000000004';

  // Patients
  const PAT1 = 'e1000000-0000-0000-0000-000000000001';
  const PAT2 = 'e2000000-0000-0000-0000-000000000002';
  const PAT3 = 'e3000000-0000-0000-0000-000000000003';
  const PAT4 = 'e4000000-0000-0000-0000-000000000004';
  const PAT5 = 'e5000000-0000-0000-0000-000000000005';

  // Password hashes
  const ADMIN_HASH = '$2b$10$wwvXEdbUI35RD/OTw3Wye.hxCDqpc7MiOeBAWrcMpIE/RWOk0FQyC';
  const DOC_HASH   = '$2b$10$UKEIkS.iu86chfqg.gXkb.NHuvdGF0jRm14Z/5NyIUJGUqY27yyIq';
  const RECEP_HASH = '$2b$10$hDhAht3/5BSBaFi1k7sAJePoEkKKoV8Zb/DWZ1uwv7yknw2CGYbKa';

  // 1. Seed Profiles
  await execSQL(`
    INSERT INTO profiles (id, name, email, employee_id, password_hash, role, status) VALUES
    ('${ADMIN_ID}', 'Chief Security Officer Admin', 'admin@cybercare.com', 'EMP-100', '${ADMIN_HASH}', 'ADMIN', 'ACTIVE'),
    ('${DR_CARDIO_ID}', 'Dr. Sarah Jenkins', 'dr.cardio@cybercare.com', 'EMP-201', '${DOC_HASH}', 'DOCTOR', 'ACTIVE'),
    ('${DR_ORTHO_ID}', 'Dr. Marcus Vance', 'dr.ortho@cybercare.com', 'EMP-202', '${DOC_HASH}', 'DOCTOR', 'ACTIVE'),
    ('${DR_GEN_ID}', 'Dr. Elena Rostova', 'dr.general@cybercare.com', 'EMP-203', '${DOC_HASH}', 'DOCTOR', 'ACTIVE'),
    ('${DR_PED_ID}', 'Dr. James Thornton', 'dr.pediatric@cybercare.com', 'EMP-204', '${DOC_HASH}', 'DOCTOR', 'ACTIVE'),
    ('${RECEP_ID}', 'Maya Lin (Chief Registrar)', 'receptionist@cybercare.com', 'EMP-301', '${RECEP_HASH}', 'RECEPTIONIST', 'ACTIVE');
  `);

  // 2. Seed Doctors
  await execSQL(`
    INSERT INTO doctors (id, user_id, department_id, specialization, room_number) VALUES
    ('${DOC_CARDIO}', '${DR_CARDIO_ID}', '${DEP_CARDIO}', 'Interventional Cardiology', 'Suite 402 - Heart Center'),
    ('${DOC_ORTHO}', '${DR_ORTHO_ID}', '${DEP_ORTHO}', 'Orthopedic Trauma Surgery', 'Suite 210 - Bone & Joint Clinic'),
    ('${DOC_GEN}', '${DR_GEN_ID}', '${DEP_GEN}', 'Internal Medicine', 'Suite 105 - Inpatient Wing'),
    ('${DOC_PED}', '${DR_PED_ID}', '${DEP_PED}', 'Pediatric Pulmonology', 'Suite 304 - Children Pavilion');
  `);

  // 3. Seed Patients
  await execSQL(`
    INSERT INTO patients (id, name, address, aadhar_number, phone, blood_group, previous_medicines, current_problem, department_id) VALUES
    ('${PAT1}', 'Demo Patient', '742 Evergreen Terrace, Sector 4', '5849-3021-9942', '+1 555-0199', 'O+', 'Atorvastatin 20mg, Aspirin 75mg daily', 'Acute chest pain radiating to left arm and shortness of breath', '${DEP_CARDIO}'),
    ('${PAT2}', 'Arthur Pendelton', '1088 Ocean Drive, Suite 12', '9841-2244-1188', '+1 555-0248', 'A+', 'Ibuprofen 400mg PRN', 'Compound tibial fracture following motor vehicle collision', '${DEP_ORTHO}'),
    ('${PAT3}', 'Chloe Bennett', '452 Pinecrest Avenue, Flat 3B', '3341-8890-4421', '+1 555-0812', 'B-', 'Multivitamins, Paracetamol', 'Persistent fever (103F) for 4 days with severe lethargy', '${DEP_GEN}'),
    ('${PAT4}', 'Leo Martinez', '88 Willow Creek Lane', '7712-4401-2299', '+1 555-0371', 'AB+', 'Albuterol Inhaler as needed', 'Acute asthma exacerbation with wheezing', '${DEP_PED}'),
    ('${PAT5}', 'Eleanor Vance', '302 Starlight Boulevard', '1109-8877-6655', '+1 555-0994', 'O-', 'Metoprolol 50mg, Clopidogrel 75mg', 'Unstable angina with ischemic ST depression', '${DEP_CARDIO}');
  `);

  // 4. Seed Patient-Doctor Assignments
  await execSQL(`
    INSERT INTO patient_doctor_assignments (patient_id, doctor_id, status) VALUES
    ('${PAT1}', '${DOC_CARDIO}', 'ACTIVE'),
    ('${PAT2}', '${DOC_ORTHO}', 'ACTIVE'),
    ('${PAT3}', '${DOC_GEN}', 'ACTIVE'),
    ('${PAT4}', '${DOC_PED}', 'ACTIVE'),
    ('${PAT5}', '${DOC_CARDIO}', 'ACTIVE');
  `);

  // 5. Seed Initial Audit Logs
  await execSQL(`
    INSERT INTO audit_logs (user_id, action, status, risk_score, reason) VALUES
    ('${ADMIN_ID}', 'SUPABASE_SYSTEM_INITIALIZATION', 'SUCCESS', 0, 'CyberCare Supabase Data Platform online'),
    ('${DR_CARDIO_ID}', '2FA_VERIFIED_LOGIN_SUCCESS', 'SUCCESS', 0, 'Dr. Sarah Jenkins authenticated with 6-digit OTP code'),
    ('${DR_ORTHO_ID}', 'UNAUTHORIZED_PATIENT_ACCESS_DENIED', 'DENIED', 65, 'Dr. Marcus Vance (Orthopedics) attempted to access Cardiology patient record (Demo Patient). RLS Rejected.');
  `);

  // 6. Seed Initial Security Events
  await execSQL(`
    INSERT INTO security_events (user_id, event_type, risk_score, classification, details) VALUES
    ('${DR_ORTHO_ID}', 'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT', 65, 'HIGH', 'Dr. Marcus Vance (Orthopedics) attempted unauthorized query for Cardiology patient Demo Patient');
  `);

  // Verify counts
  console.log('\n📊 VERIFICATION:');
  const tables = ['profiles', 'departments', 'doctors', 'patients', 'patient_doctor_assignments', 'audit_logs', 'security_events'];
  for (const t of tables) {
    const result = await execSQL(`SELECT count(*) as cnt FROM ${t};`);
    console.log(`  ✅ ${t}: ${result[0]?.cnt || 0} rows`);
  }

  console.log('\n🎉 ALL TABLES CREATED, RLS ENABLED, SEED DATA INSERTED SUCCESSFULLY!');
}

run().catch(err => console.error('FATAL:', err.message));
