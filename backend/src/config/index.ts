import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5050,
  jwtSecret: process.env.JWT_SECRET || 'cybercare_ultra_secure_jwt_secret_key_2026',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
  otpExpiryMinutes: 5,
  breakGlassDurationMinutes: 15
};
