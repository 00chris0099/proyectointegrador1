import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/environment';
import { prisma } from './config/database';
import { redisClient } from './config/redis';
import { sseService } from './services/sse.service';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import recoveryRoutes from './routes/recovery.routes';
import profileRoutes from './routes/profile.routes';
import studentRoutes from './routes/student.routes';
import tramiteRoutes from './routes/tramite.routes';
import adminTramiteRoutes from './routes/admin-tramite.routes';
import direccionTramiteRoutes from './routes/direccion-tramite.routes';
import adminAuditoriaRoutes from './routes/admin-auditoria.routes';
import uploadRoutes from './routes/upload.routes';
import sseRoutes from './routes/sse.routes';

// NOTE: SSE routes MUST be registered BEFORE tramiteRoutes to avoid
// GET /api/tramites/stream being matched by GET /api/tramites/:id

const app = express();
const PORT = config.PORT;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://aimachristian-adminintegrador.ajcxjb.easypanel.host',
    'http://localhost:3002'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', recoveryRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/apoderados/me', studentRoutes);
app.use('/api', studentRoutes);
// SSE routes MUST be before tramiteRoutes to prevent /api/tramites/stream
// from being matched by /api/tramites/:id
app.use('/api', sseRoutes);
app.use('/api', tramiteRoutes);
app.use('/api', adminTramiteRoutes);
app.use('/api', direccionTramiteRoutes);
app.use('/api', adminAuditoriaRoutes);
app.use('/api', uploadRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    // Test Redis connection
    await redisClient.ping();
    console.log('✅ Redis connected');

    // Start SSE heartbeat
    sseService.startHeartbeat();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  sseService.stopHeartbeat();
  prisma.$disconnect();
  redisClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  sseService.stopHeartbeat();
  prisma.$disconnect();
  redisClient.disconnect();
  process.exit(0);
});

start();

export default app;
