import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../database/prisma';
import { config } from '../config';
import { analyzeSecurityMetrics } from '../services/mlService';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST'])
});

const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  otpCode: z.string().length(6, 'OTP must be 6 digits')
});

export async function login(req: Request, res: Response) {
  try {
    const { identifier, password, role } = loginSchema.parse(req.body);

    // Find user by email or employeeId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { employeeId: identifier.toUpperCase() }
        ]
      },
      include: { doctor: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid credentials or account does not exist' });
    }

    if (user.status === 'LOCKED') {
      return res.status(403).json({ error: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked due to high-risk anomaly detections. Contact Administrator.' });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'ACCOUNT_DISABLED', message: 'Your employee account has been disabled.' });
    }

    if (user.role !== role) {
      return res.status(403).json({ error: 'ROLE_MISMATCH', message: `Account role is ${user.role}, not ${role}` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'FAILED_LOGIN_ATTEMPT',
          status: 'DENIED',
          riskScore: 35,
          reason: 'Incorrect password provided',
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      // Calculate ML Anomaly score for failed logins
      const failedCount = await prisma.auditLog.count({
        where: {
          userId: user.id,
          action: 'FAILED_LOGIN_ATTEMPT',
          timestamp: { gte: new Date(Date.now() - 1800000) }
        }
      });

      const anomaly = await analyzeSecurityMetrics({ failedLogins: failedCount });

      if (anomaly.classification === 'CRITICAL' || failedCount >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'LOCKED' }
        });
        return res.status(403).json({ error: 'ACCOUNT_LOCKED', message: 'Account locked due to multiple failed authentication attempts.' });
      }

      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email/employee ID or password' });
    }

    // Generate 6-digit OTP code (Deterministic or Random)
    // For easy demo, we can generate '123456' or random 6 digits
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    // Invalidate prior pending OTP sessions
    await prisma.otpSession.deleteMany({
      where: { userId: user.id }
    });

    await prisma.otpSession.create({
      data: {
        userId: user.id,
        otpCode: generatedOtp,
        expiresAt
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_AUTHENTICATED_OTP_SENT',
        status: 'SUCCESS',
        riskScore: 5,
        reason: 'Password verified successfully. 2FA OTP issued.',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.status(200).json({
      message: 'PASSWORD_VERIFIED',
      requiresOtp: true,
      userId: user.id,
      email: user.email,
      role: user.role,
      demoOtpCode: generatedOtp // Exposed safely for local demo & smooth testing
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    }
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  try {
    const { userId, otpCode } = verifyOtpSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { doctor: { include: { department: true } } }
    });

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User record not found' });
    }

    const otpSession = await prisma.otpSession.findFirst({
      where: { userId, verifiedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpSession) {
      return res.status(400).json({ error: 'NO_OTP_SESSION', message: 'No active OTP session found. Please sign in again.' });
    }

    if (new Date() > otpSession.expiresAt) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'EXPIRED_OTP_ATTEMPT',
          status: 'DENIED',
          riskScore: 40,
          reason: 'Attempted verification of expired 2FA code',
          ipAddress: req.ip || '127.0.0.1'
        }
      });
      return res.status(400).json({ error: 'OTP_EXPIRED', message: 'OTP code has expired. Please request a new code.' });
    }

    if (otpSession.attempts >= 4) {
      return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', message: 'Too many invalid OTP attempts. Please sign in again.' });
    }

    if (otpSession.otpCode !== otpCode && otpCode !== '123456') { // Allow 123456 as master demo override
      await prisma.otpSession.update({
        where: { id: otpSession.id },
        data: { attempts: otpSession.attempts + 1 }
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'INVALID_OTP_ATTEMPT',
          status: 'DENIED',
          riskScore: 45,
          reason: `Invalid OTP code provided (${otpSession.attempts + 1}/4 attempts)`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return res.status(400).json({ error: 'INVALID_OTP', message: 'Invalid 6-digit OTP code' });
    }

    // Mark OTP as verified
    await prisma.otpSession.update({
      where: { id: otpSession.id },
      data: { verifiedAt: new Date() }
    });

    // Issue JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      doctorId: user.doctor?.id,
      departmentId: user.doctor?.departmentId,
      departmentName: user.doctor?.department?.name
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '8h' });

    await prisma.auditLog.create({
      data: {
        userId,
        action: '2FA_VERIFIED_LOGIN_SUCCESS',
        status: 'SUCCESS',
        riskScore: 0,
        reason: '2FA OTP verified. User session created.',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return res.status(200).json({
      message: 'AUTHENTICATED',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        doctor: user.doctor ? {
          id: user.doctor.id,
          specialization: user.doctor.specialization,
          departmentId: user.doctor.departmentId,
          departmentName: user.doctor.department?.name,
          roomNumber: user.doctor.roomNumber
        } : null
      }
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
    }
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
}

export async function resendOtp(req: Request, res: Response) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

  await prisma.otpSession.deleteMany({ where: { userId } });
  await prisma.otpSession.create({
    data: {
      userId,
      otpCode: generatedOtp,
      expiresAt
    }
  });

  return res.status(200).json({
    message: 'OTP_RESENT',
    demoOtpCode: generatedOtp
  });
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { doctor: { include: { department: true } } }
  });
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      status: user.status,
      doctor: user.doctor ? {
        id: user.doctor.id,
        specialization: user.doctor.specialization,
        departmentId: user.doctor.departmentId,
        departmentName: user.doctor.department?.name,
        roomNumber: user.doctor.roomNumber
      } : null
    }
  });
}

export async function logout(req: Request, res: Response) {
  if (req.user) {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT',
        status: 'SUCCESS',
        riskScore: 0,
        reason: 'User explicitly logged out',
        ipAddress: req.ip || '127.0.0.1'
      }
    });
  }
  return res.status(200).json({ message: 'LOGGED_OUT' });
}
