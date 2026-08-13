import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';

const registerPatientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().min(3, 'Address is required'),
  aadharNumber: z.string().min(12, 'Aadhar number must be 12 digits'),
  phone: z.string().min(10, 'Phone number is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  previousMedicines: z.string().optional(),
  currentProblem: z.string().min(2, 'Current problem/symptom is required'),
  departmentId: z.string().min(1, 'Medical department is required')
});

export async function registerPatient(req: Request, res: Response) {
  try {
    const data = registerPatientSchema.parse(req.body);

    const department = await prisma.department.findUnique({
      where: { id: data.departmentId }
    });

    if (!department) {
      return res.status(400).json({ error: 'INVALID_DEPARTMENT', message: 'Selected medical department does not exist' });
    }

    // Find available doctor in selected department
    const availableDoctor = await prisma.doctor.findFirst({
      where: { departmentId: department.id, user: { status: 'ACTIVE' } },
      include: { user: true }
    });

    // Create Patient record
    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        address: data.address,
        aadharNumber: data.aadharNumber,
        phone: data.phone,
        bloodGroup: data.bloodGroup,
        previousMedicines: data.previousMedicines || 'None reported',
        currentProblem: data.currentProblem,
        departmentId: department.id
      }
    });

    let assignedDoctorInfo = null;

    if (availableDoctor) {
      await prisma.patientDoctorAssignment.create({
        data: {
          patientId: patient.id,
          doctorId: availableDoctor.id,
          status: 'ACTIVE'
        }
      });

      assignedDoctorInfo = {
        id: availableDoctor.id,
        name: availableDoctor.user.name,
        specialization: availableDoctor.specialization,
        departmentName: department.name
      };
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'PATIENT_REGISTERED',
        patientId: patient.id,
        status: 'SUCCESS',
        riskScore: 0,
        reason: `Registered patient ${patient.name} and assigned to ${assignedDoctorInfo?.name || 'Department pool'} (${department.name})`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.status(201).json({
      message: 'Patient Successfully Registered',
      patient: {
        id: patient.id,
        name: patient.name,
        currentProblem: patient.currentProblem,
        departmentName: department.name,
        createdAt: patient.createdAt
      },
      assignedDoctor: assignedDoctorInfo
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    }
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
}

export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        doctors: {
          include: { user: { select: { name: true, status: true } } }
        }
      }
    });
    return res.status(200).json({ departments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
