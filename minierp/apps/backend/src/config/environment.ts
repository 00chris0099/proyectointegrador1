import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '12h',
  IMGBB_API_KEY: process.env.IMGBB_API_KEY!,
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL!,
  N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET!,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3002', 'http://localhost:3003'],
  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASS: process.env.EMAIL_PASS!,
  EMAIL_FROM: process.env.EMAIL_FROM || 'Mini-ERP <noreply@laasuncion.edu.pe>',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3002',
};
