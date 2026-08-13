import { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { checkPatientAccessAuthorization } from '../middleware/auth';

export async function getDoctorProfile(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.doctorId) {
      return res.status(403).json({ error: 'User is not registered as a Doctor' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.doctorId },
      include: {
        user: { select: { name: true, email: true, employeeId: true } },
        department: true,
        assignments: {
          include: { patient: true }
        }
      }
    });

    return res.status(200).json({ doctor });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMyPatients(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.doctorId) {
      return res.status(403).json({ error: 'User is not registered as a Doctor' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.doctorId }
    });

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // Fetch active assignments for this doctor
    const assignments = await prisma.patientDoctorAssignment.findMany({
      where: { doctorId: doctor.id, status: 'ACTIVE' },
      include: {
        patient: {
          include: { department: true }
        }
      }
    });

    // Also fetch patients in the same department
    const departmentPatients = await prisma.patient.findMany({
      where: { departmentId: doctor.departmentId },
      include: { department: true }
    });

    // Merge and deduplicate
    const patientMap = new Map();
    assignments.forEach(a => {
      patientMap.set(a.patient.id, {
        ...a.patient,
        aadharNumber: maskAadhar(a.patient.aadharNumber),
        assignmentStatus: 'ASSIGNED_TO_ME'
      });
    });

    departmentPatients.forEach(p => {
      if (!patientMap.has(p.id)) {
        patientMap.set(p.id, {
          ...p,
          aadharNumber: maskAadhar(p.aadharNumber),
          assignmentStatus: 'DEPARTMENT_PATIENT'
        });
      }
    });

    return res.status(200).json({ patients: Array.from(patientMap.values()) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAllHospitalPatients(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const allPatients = await prisma.patient.findMany({
      include: {
        department: true,
        assignments: {
          include: {
            doctor: {
              include: { user: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // For each patient, check authorization status for current doctor
    const processedPatients = await Promise.all(
      allPatients.map(async (patient) => {
        const authResult = await checkPatientAccessAuthorization(userId, patient.id);
        
        // Find assigned doctor name
        const activeAssignment = patient.assignments.find(a => a.status === 'ACTIVE');
        const assignedDoctorName = activeAssignment?.doctor?.user?.name || 'Unassigned';

        return {
          id: patient.id,
          name: patient.name,
          address: patient.address,
          phone: patient.phone,
          bloodGroup: patient.bloodGroup,
          currentProblem: patient.currentProblem,
          departmentId: patient.departmentId,
          departmentName: patient.department.name,
          assignedDoctorName,
          aadharNumber: maskAadhar(patient.aadharNumber),
          createdAt: patient.createdAt,
          isAuthorized: authResult.allowed,
          isBreakGlass: authResult.isBreakGlass
        };
      })
    );

    return res.status(200).json({ patients: processedPatients });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getPatientDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const authCheck = await checkPatientAccessAuthorization(userId, id, req.ip);
    if (!authCheck.allowed) {
      return res.status(403).json({
        error: 'ACCESS_RESTRICTED',
        message: 'You are not authorized to access this patient\'s record.',
        canBreakGlass: req.user?.role === 'DOCTOR'
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        department: true,
        assignments: {
          include: {
            doctor: {
              include: {
                user: true,
                department: true
              }
            }
          }
        }
      }
    });

    if (!patient) return res.status(404).json({ error: 'Patient record not found' });

    // Record audit event for authorized data view
    await prisma.auditLog.create({
      data: {
        userId,
        action: authCheck.isBreakGlass ? 'BREAK_GLASS_PATIENT_VIEW' : 'AUTHORIZED_PATIENT_VIEW',
        patientId: patient.id,
        status: authCheck.isBreakGlass ? 'EMERGENCY' : 'SUCCESS',
        riskScore: authCheck.isBreakGlass ? 50 : 0,
        reason: authCheck.isBreakGlass ? 'Accessed patient medical records via Emergency Break-Glass' : 'Authorized patient record view',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.status(200).json({
      patient: {
        ...patient,
        aadharNumber: maskAadhar(patient.aadharNumber),
        isBreakGlassView: authCheck.isBreakGlass
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

function maskAadhar(aadhar: string): string {
  if (!aadhar || aadhar.length < 8) return 'XXXX-XXXX-XXXX';
  const clean = aadhar.replace(/[^0-9]/g, '');
  if (clean.length < 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${clean.slice(-4)}`;
}
