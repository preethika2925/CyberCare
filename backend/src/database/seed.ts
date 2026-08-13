import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CyberCare Database Seeding...');

  // Clean existing database
  await prisma.breakGlassEvent.deleteMany();
  await prisma.patientDoctorAssignment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.otpSession.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Departments
  const deptCardio = await prisma.department.create({
    data: { name: 'Cardiology', description: 'Cardiovascular medicine, ECG monitoring & emergency cardiac care' }
  });
  const deptOrtho = await prisma.department.create({
    data: { name: 'Orthopedics', description: 'Bone, joint & musculoskeletal surgical care' }
  });
  const deptGeneral = await prisma.department.create({
    data: { name: 'General Medicine', description: 'Internal medicine, diagnostics & inpatient care' }
  });
  const deptPeds = await prisma.department.create({
    data: { name: 'Pediatrics', description: 'Child healthcare, vaccinations & pediatric medicine' }
  });
  const deptNeuro = await prisma.department.create({
    data: { name: 'Neurology', description: 'Brain, spinal cord & neuromuscular disease unit' }
  });
  const deptDerm = await prisma.department.create({
    data: { name: 'Dermatology', description: 'Skin disorders & therapeutic cutaneous care' }
  });
  const deptENT = await prisma.department.create({
    data: { name: 'ENT', description: 'Ear, Nose & Throat specialization' }
  });
  const deptGyn = await prisma.department.create({
    data: { name: 'Gynecology', description: 'Obstetrics, gynecology & women\'s health' }
  });

  console.log('✅ 8 Medical Departments created');

  // Password hashes
  const adminPassword = await bcrypt.hash('admin123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const receptionistPassword = await bcrypt.hash('reception123', 10);

  // 2. Create Users & Doctors
  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: 'Chief Security Officer Admin',
      email: 'admin@cybercare.com',
      employeeId: 'EMP-100',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // Doctor 1: Cardiologist
  const userCardio = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'dr.cardio@cybercare.com',
      employeeId: 'EMP-201',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      status: 'ACTIVE'
    }
  });
  const docCardio = await prisma.doctor.create({
    data: {
      userId: userCardio.id,
      departmentId: deptCardio.id,
      specialization: 'Interventional Cardiology',
      roomNumber: 'Suite 402 - Heart Center'
    }
  });

  // Doctor 2: Orthopedist
  const userOrtho = await prisma.user.create({
    data: {
      name: 'Dr. Marcus Vance',
      email: 'dr.ortho@cybercare.com',
      employeeId: 'EMP-202',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      status: 'ACTIVE'
    }
  });
  const docOrtho = await prisma.doctor.create({
    data: {
      userId: userOrtho.id,
      departmentId: deptOrtho.id,
      specialization: 'Orthopedic Trauma Surgery',
      roomNumber: 'Suite 210 - Bone & Joint Clinic'
    }
  });

  // Doctor 3: General Physician
  const userGeneral = await prisma.user.create({
    data: {
      name: 'Dr. Elena Rostova',
      email: 'dr.general@cybercare.com',
      employeeId: 'EMP-203',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      status: 'ACTIVE'
    }
  });
  const docGeneral = await prisma.doctor.create({
    data: {
      userId: userGeneral.id,
      departmentId: deptGeneral.id,
      specialization: 'Internal Medicine',
      roomNumber: 'Suite 105 - Inpatient Wing'
    }
  });

  // Doctor 4: Pediatrician
  const userPeds = await prisma.user.create({
    data: {
      name: 'Dr. James Thornton',
      email: 'dr.pediatric@cybercare.com',
      employeeId: 'EMP-204',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      status: 'ACTIVE'
    }
  });
  const docPeds = await prisma.doctor.create({
    data: {
      userId: userPeds.id,
      departmentId: deptPeds.id,
      specialization: 'Pediatric Pulmonology',
      roomNumber: 'Suite 304 - Children Pavilion'
    }
  });

  // Receptionist User
  const receptionistUser = await prisma.user.create({
    data: {
      name: 'Maya Lin (Chief Registrar)',
      email: 'receptionist@cybercare.com',
      employeeId: 'EMP-301',
      passwordHash: receptionistPassword,
      role: 'RECEPTIONIST',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Users & Doctors created');

  // 3. Create Patients & Assignments
  const patient1 = await prisma.patient.create({
    data: {
      name: 'Demo Patient',
      address: '742 Evergreen Terrace, Sector 4',
      aadharNumber: '5849-3021-9942',
      phone: '+1 555-0199',
      bloodGroup: 'O+',
      previousMedicines: 'Atorvastatin 20mg, Aspirin 75mg daily',
      currentProblem: 'Acute chest pain radiating to left arm & shortness of breath',
      departmentId: deptCardio.id
    }
  });
  await prisma.patientDoctorAssignment.create({
    data: { patientId: patient1.id, doctorId: docCardio.id, status: 'ACTIVE' }
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: 'Arthur Pendelton',
      address: '1088 Ocean Drive, Suite 12',
      aadharNumber: '9841-2244-1188',
      phone: '+1 555-0248',
      bloodGroup: 'A+',
      previousMedicines: 'Ibuprofen 400mg PRN',
      currentProblem: 'Compound tibial fracture following motor vehicle collision',
      departmentId: deptOrtho.id
    }
  });
  await prisma.patientDoctorAssignment.create({
    data: { patientId: patient2.id, doctorId: docOrtho.id, status: 'ACTIVE' }
  });

  const patient3 = await prisma.patient.create({
    data: {
      name: 'Chloe Bennett',
      address: '452 Pinecrest Avenue, Flat 3B',
      aadharNumber: '3341-8890-4421',
      phone: '+1 555-0812',
      bloodGroup: 'B-',
      previousMedicines: 'Multivitamins, Paracetamol',
      currentProblem: 'Persistent fever (103°F) for 4 days with severe lethargy',
      departmentId: deptGeneral.id
    }
  });
  await prisma.patientDoctorAssignment.create({
    data: { patientId: patient3.id, doctorId: docGeneral.id, status: 'ACTIVE' }
  });

  const patient4 = await prisma.patient.create({
    data: {
      name: 'Leo Martinez',
      address: '88 Willow Creek Lane',
      aadharNumber: '7712-4401-2299',
      phone: '+1 555-0371',
      bloodGroup: 'AB+',
      previousMedicines: 'Albuterol Inhaler as needed',
      currentProblem: 'Acute asthma exacerbation with wheezing',
      departmentId: deptPeds.id
    }
  });
  await prisma.patientDoctorAssignment.create({
    data: { patientId: patient4.id, doctorId: docPeds.id, status: 'ACTIVE' }
  });

  const patient5 = await prisma.patient.create({
    data: {
      name: 'Eleanor Vance',
      address: '302 Starlight Boulevard',
      aadharNumber: '1109-8877-6655',
      phone: '+1 555-0994',
      bloodGroup: 'O-',
      previousMedicines: 'Metoprolol 50mg, Clopidogrel 75mg',
      currentProblem: 'Unstable angina with ischemic ST depression',
      departmentId: deptCardio.id
    }
  });
  await prisma.patientDoctorAssignment.create({
    data: { patientId: patient5.id, doctorId: docCardio.id, status: 'ACTIVE' }
  });

  console.log('✅ Patients & Assignments created');

  // 4. Create Initial Audit Logs & Security Telemetry
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_INITIALIZATION',
        status: 'SUCCESS',
        riskScore: 0,
        reason: 'CyberCare AI-Powered Security SOC Engine online',
        timestamp: new Date(Date.now() - 3600000 * 5)
      },
      {
        userId: userCardio.id,
        action: '2FA_VERIFIED_LOGIN_SUCCESS',
        status: 'SUCCESS',
        riskScore: 0,
        reason: 'Dr. Sarah Jenkins authenticated with 6-digit OTP code',
        timestamp: new Date(Date.now() - 3600000 * 3)
      },
      {
        userId: userOrtho.id,
        action: 'UNAUTHORIZED_PATIENT_ACCESS_DENIED',
        patientId: patient1.id,
        status: 'DENIED',
        riskScore: 65,
        reason: 'Dr. Marcus Vance (Orthopedics) attempted to access Cardiology patient record (Demo Patient). Authorization Rejected.',
        timestamp: new Date(Date.now() - 3600000 * 2)
      },
      {
        userId: receptionistUser.id,
        action: 'PATIENT_REGISTERED',
        patientId: patient1.id,
        status: 'SUCCESS',
        riskScore: 0,
        reason: 'Registered patient Demo Patient (Chest pain) and assigned to Cardiology',
        timestamp: new Date(Date.now() - 3600000 * 1)
      }
    ]
  });

  await prisma.securityEvent.createMany({
    data: [
      {
        userId: userOrtho.id,
        eventType: 'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT',
        riskScore: 65,
        classification: 'HIGH',
        details: 'Dr. Marcus Vance (Orthopedics) attempted unauthorized query for Cardiology patient Demo Patient',
        timestamp: new Date(Date.now() - 3600000 * 2)
      },
      {
        userId: userOrtho.id,
        eventType: 'FAILED_OTP_VERIFICATION',
        riskScore: 40,
        classification: 'MEDIUM',
        details: 'Entered expired 2FA code during secondary verification',
        timestamp: new Date(Date.now() - 3600000 * 1.5)
      }
    ]
  });

  console.log('✅ Initial Audit & Security Telemetry created');
  console.log('🎉 CyberCare Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
