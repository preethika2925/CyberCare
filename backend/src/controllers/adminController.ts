import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { analyzeSecurityMetrics } from '../services/mlService';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  employeeId: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST']),
  departmentId: z.string().optional(),
  specialization: z.string().optional(),
  roomNumber: z.string().optional()
});

export async function getDashboardOverview(req: Request, res: Response) {
  try {
    const totalPatients = await prisma.patient.count();
    const totalDoctors = await prisma.doctor.count();
    const totalReceptionists = await prisma.user.count({ where: { role: 'RECEPTIONIST' } });
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const blockedAccounts = await prisma.user.count({ where: { status: 'LOCKED' } });
    const suspiciousEvents = await prisma.securityEvent.count({
      where: { classification: { in: ['HIGH', 'CRITICAL'] } }
    });
    const activeBreakGlassCount = await prisma.breakGlassEvent.count({
      where: { status: 'ACTIVE', expiresAt: { gt: new Date() } }
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
        patient: { select: { id: true, name: true } }
      }
    });

    // Threat metrics calculation
    const totalViolations = await prisma.securityEvent.count({
      where: { timestamp: { gte: new Date(Date.now() - 86400000) } }
    });
    const failedLogins24h = await prisma.auditLog.count({
      where: { action: 'FAILED_LOGIN_ATTEMPT', timestamp: { gte: new Date(Date.now() - 86400000) } }
    });

    const threatAnalysis = await analyzeSecurityMetrics({
      failedLogins: failedLogins24h,
      unauthorizedAttempts: totalViolations,
      breakGlassCount: activeBreakGlassCount
    });

    return res.status(200).json({
      metrics: {
        totalPatients,
        totalDoctors,
        totalReceptionists,
        activeUsers,
        blockedAccounts,
        suspiciousEvents,
        activeBreakGlassCount,
        systemRiskScore: threatAnalysis.riskScore,
        riskClassification: threatAnalysis.classification
      },
      recentAuditLogs,
      threatAnalysis
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
        status: true,
        createdAt: true,
        doctor: {
          include: { department: true }
        }
      }
    });
    return res.status(200).json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const data = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        employeeId: data.employeeId.toUpperCase(),
        passwordHash,
        role: data.role,
        status: 'ACTIVE'
      }
    });

    if (data.role === 'DOCTOR' && data.departmentId) {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          departmentId: data.departmentId,
          specialization: data.specialization || 'General Practitioner',
          roomNumber: data.roomNumber || 'Room 101'
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ADMIN_USER_CREATED',
        status: 'SUCCESS',
        riskScore: 0,
        reason: `Created user ${user.email} (${user.role})`
      }
    });

    return res.status(201).json({ message: 'User created successfully', user });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body; // ACTIVE, DISABLED, LOCKED

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ADMIN_USER_STATUS_UPDATED',
        status: 'SUCCESS',
        riskScore: status === 'ACTIVE' ? 0 : 20,
        reason: `Updated status of user ${updatedUser.email} to ${status}`
      }
    });

    return res.status(200).json({ message: 'User status updated', user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user?.id) return res.status(400).json({ error: 'Cannot delete own account' });

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'ADMIN_USER_DELETED',
        status: 'WARNING',
        riskScore: 10,
        reason: `Deleted user account ${user.email}`
      }
    });

    return res.status(200).json({ message: 'User account removed successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const { role, action, status } = req.query;

    const whereClause: any = {};
    if (action) whereClause.action = { contains: String(action) };
    if (status) whereClause.status = String(status);
    if (role) {
      whereClause.user = { role: String(role) };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      take: 100,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
        patient: { select: { id: true, name: true } }
      }
    });

    return res.status(200).json({ auditLogs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getSecurityEvents(req: Request, res: Response) {
  try {
    const events = await prisma.securityEvent.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } }
      }
    });

    return res.status(200).json({ securityEvents: events });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getThreatMonitor(req: Request, res: Response) {
  try {
    const totalFailedLogins = await prisma.auditLog.count({ where: { action: 'FAILED_LOGIN_ATTEMPT' } });
    const totalUnauthorized = await prisma.securityEvent.count({ where: { eventType: 'UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT' } });
    const activeBreakGlass = await prisma.breakGlassEvent.count({ where: { status: 'ACTIVE', expiresAt: { gt: new Date() } } });

    const analysis = await analyzeSecurityMetrics({
      failedLogins: totalFailedLogins,
      unauthorizedAttempts: totalUnauthorized,
      breakGlassCount: activeBreakGlass,
      lookupFrequency: 8
    });

    const recentAnomalies = await prisma.securityEvent.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { user: true }
    });

    return res.status(200).json({
      threatOverview: analysis,
      metrics: {
        totalFailedLogins,
        totalUnauthorized,
        activeBreakGlass
      },
      recentAnomalies
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
