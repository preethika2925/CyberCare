import { config } from '../config';

export interface AnomalyAnalysisResult {
  riskScore: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isAnomaly: boolean;
  explainableReasons: string[];
  recommendation: string;
}

export async function analyzeSecurityMetrics(metrics: {
  failedLogins?: number;
  failedOtps?: number;
  unauthorizedAttempts?: number;
  breakGlassCount?: number;
  lookupFrequency?: number;
}): Promise<AnomalyAnalysisResult> {
  const failedLogins = metrics.failedLogins || 0;
  const failedOtps = metrics.failedOtps || 0;
  const unauthorizedAttempts = metrics.unauthorizedAttempts || 0;
  const breakGlassCount = metrics.breakGlassCount || 0;
  const lookupFrequency = metrics.lookupFrequency || 1;

  try {
    const response = await fetch(`${config.mlServiceUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        failed_logins: failedLogins,
        failed_otps: failedOtps,
        unauthorized_attempts: unauthorizedAttempts,
        break_glass_count: breakGlassCount,
        lookup_frequency: lookupFrequency,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as AnomalyAnalysisResult;
      return data;
    }
  } catch (err) {
    // Microservice offline or connection failed -> fallback to native algorithm
  }

  // Native fallback statistical anomaly engine
  let riskScore = Math.min(
    100,
    failedLogins * 15 + failedOtps * 12 + unauthorizedAttempts * 22 + breakGlassCount * 14 + (lookupFrequency > 10 ? 15 : 0)
  );

  let classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore > 80) classification = 'CRITICAL';
  else if (riskScore > 60) classification = 'HIGH';
  else if (riskScore > 30) classification = 'MEDIUM';

  const explainableReasons: string[] = [];
  if (failedLogins > 0) explainableReasons.push(`Failed password authentication attempts (${failedLogins})`);
  if (failedOtps > 0) explainableReasons.push(`Unverified or expired OTP attempts (${failedOtps})`);
  if (unauthorizedAttempts > 0) explainableReasons.push(`Unauthorized patient access attempts (${unauthorizedAttempts})`);
  if (breakGlassCount > 0) explainableReasons.push(`Emergency Break-Glass access active (${breakGlassCount})`);
  if (explainableReasons.length === 0) explainableReasons.push('Standard operational access pattern');

  return {
    riskScore,
    classification,
    isAnomaly: riskScore > 60,
    explainableReasons,
    recommendation: classification === 'CRITICAL' ? 'Account lock recommended' : (classification === 'HIGH' ? 'Enhanced audit monitoring' : 'No action required')
  };
}
