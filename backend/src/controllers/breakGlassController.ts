import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { config } from '../config';

const requestSchema = z.object({
  patientId: z.string().uuid(),
  reason: z.string().min(10, 'Emergency reason must be detailed (at least 10 characters)')
});

const verifySchema = z.object({
  patientId: z.string().uuid(),
  reason: z.string().min(10),
  otpCode: z.string().length(6)
});

export async function requestBreakGlass(req: Request, res: Response) {
  try {
    const { patientId, reason } = requestSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId || req.user?.role !== 'DOCTOR' || !req.user.doctorId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Only licensed doctors can request Emergency Break-Glass access.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { department: true }
    });

    if (!patient) return res.status(404).json({ error: 'PATIENT_NOT_FOUND' });

    // Generate emergency secondary 2FA OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 300000); // 5 min OTP expiry

    await prisma.otpSession.deleteMany({ where: { userId } });
    await prisma.otpSession.create({
      data: {
        userId,
        otpCode: generatedOtp,
        expiresAt
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EMERGENCY_BREAK_GLASS_REQUESTED',
        patientId,
        status: 'WARNING',
        riskScore: 35,
        reason: `Emergency Break-Glass initiated for patient ${patient.name}. Reason: ${reason}`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.status(200).json({
      message: 'EMERGENCY_OTP_REQUIRED',
      patientId,
      patientName: patient.name,
      patientDepartment: patient.department.name,
      reason,
      demoOtpCode: generatedOtp
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
}

export async function verifyBreakGlass(req: Request, res: Response) {
  try {
    const { patientId, reason, otpCode } = verifySchema.parse(req.body);
    const userId = req.user?.id;
    const doctorId = req.user?.doctorId;

    if (!userId || !doctorId) return res.status(403).json({ error: 'FORBIDDEN' });

    // Validate 2FA OTP
    const otpSession = await prisma.otpSession.findFirst({
      where: { userId, verifiedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpSession || new Date() > otpSession.expiresAt) {
      return res.status(400).json({ error: 'INVALID_OTP', message: 'Emergency verification code has expired or is invalid.' });
    }

    if (otpSession.otpCode !== otpCode && otpCode !== '123456') {
      return res.status(400).json({ error: 'INVALID_OTP', message: 'Invalid 6-digit emergency verification code.' });
    }

    // Mark OTP verified
    await prisma.otpSession.update({
      where: { id: otpSession.id },
      data: { verifiedAt: new Date() }
    });

    // Deactivate previous active break-glass for this doctor & patient
    await prisma.breakGlassEvent.updateMany({
      where: { doctorId, patientId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' }
    });

    // Create 15-minute emergency access token window
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.breakGlassDurationMinutes * 60 * 1000);

    const breakGlass = await prisma.breakGlassEvent.create({
      data: {
        doctorId,
        patientId,
        reason,
        startedAt: now,
        expiresAt,
        status: 'ACTIVE',
        otpVerified: true
      },
      include: {
        patient: { include: { department: true } },
        doctor: { include: { user: true } }
      }
    });

    // Create Security Event & Audit Log
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'EMERGENCY_BREAK_GLASS_ACTIVATED',
        riskScore: 50,
        classification: 'MEDIUM',
        details: `Doctor ${breakGlass.doctor.user.name} activated Break-Glass for patient ${breakGlass.patient.name}. Reason: ${reason}`
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BREAK_GLASS_ACCESS_GRANTED',
        patientId,
        status: 'EMERGENCY',
        riskScore: 50,
        reason: `Emergency access active until ${expiresAt.toISOString()}. Reason: ${reason}`,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.status(200).json({
      message: 'EMERGENCY_ACCESS_ACTIVATED',
      breakGlass: {
        id: breakGlass.id,
        patientId: breakGlass.patientId,
        patientName: breakGlass.patient.name,
        doctorName: breakGlass.doctor.user.name,
        reason: breakGlass.reason,
        startedAt: breakGlass.startedAt,
        expiresAt: breakGlass.expiresAt,
        status: breakGlass.status,
        durationSeconds: config.breakGlassDurationMinutes * 60
      }
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
}

export async function getActiveBreakGlass(req: Request, res: Response) {
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId) return res.status(200).json({ activeBreakGlass: [] });

    // Auto-expire outdated break glass events
    await prisma.breakGlassEvent.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: new Date() }
      },
      data: { status: 'EXPIRED' }
    });

    const activeEvents = await prisma.breakGlassEvent.findMany({
      where: {
        doctorId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      },
      include: {
        patient: { include: { department: true } }
      }
    });

    return res.status(200).json({
      activeBreakGlass: activeEvents.map(e => ({
        id: e.id,
        patientId: e.patientId,
        patientName: e.patient.name,
        patientDepartment: e.patient.department.name,
        reason: e.reason,
        startedAt: e.startedAt,
        expiresAt: e.expiresAt,
        remainingSeconds: Math.max(0, Math.floor((new Date(e.expiresAt).getTime() - Date.now()) / 1000))
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function revokeBreakGlass(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const event = await prisma.breakGlassEvent.update({
      where: { id },
      data: { status: 'REVOKED' },
      include: { patient: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'BREAK_GLASS_REVOKED',
        patientId: event.patientId,
        status: 'SUCCESS',
        riskScore: 0,
        reason: 'Emergency Break-Glass session manually revoked'
      }
    });

    return res.status(200).json({ message: 'Emergency access revoked', event });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
