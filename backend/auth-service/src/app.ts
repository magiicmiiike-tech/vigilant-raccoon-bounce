import express, { Request, Response, NextFunction } from 'express'; // Import types
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/config';
import { errorHandler, ValidationError } from './utils/errors'; // Import ValidationError
import { logger } from './utils/logger';
import { AuthController } from './controllers/AuthController';
import { 
  authenticateToken, 
  requireRole, 
  requireTenant,
  rateLimit 
} from './middleware/auth.middleware';

export const createApp = () => {
  const app = express();
  const authController = new AuthController();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: config.env === 'development' ? '*' : process.env.FRONTEND_URL,
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => { // Explicitly type parameters
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    });
    next();
  });

  // Health check
  app.get('/health', (req: Request, res: Response) => { // Explicitly type parameters
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
    });
  });

  // Public routes
  app.post('/api/auth/register', authController.register.bind(authController));
  app.post('/api/auth/login', rateLimit, authController.login.bind(authController));
  app.post('/api/auth/refresh', authController.refreshToken.bind(authController));
  app.post('/api/auth/forgot-password', authController.forgotPassword.bind(authController));
  app.post('/api/auth/reset-password', authController.resetPassword.bind(authController));
  app.post('/api/auth/mfa/verify', authController.verifyMfa.bind(authController));

  // Protected routes
  app.post('/api/auth/logout', authenticateToken, authController.logout.bind(authController));
  app.get('/api/auth/profile', authenticateToken, authController.getProfile.bind(authController));
  
  // MFA routes
  app.post('/api/auth/mfa/setup', authenticateToken, authController.setupMfa.bind(authController));
  app.post('/api/auth/mfa/disable', authenticateToken, authController.disableMfa.bind(authController));

  // API Key management
  app.post('/api/auth/api-keys', authenticateToken, authController.createApiKey.bind(authController));
  app.get('/api/auth/api-keys', authenticateToken, authController.getApiKeys.bind(authController));
  app.delete('/api/auth/api-keys/:id', authenticateToken, authController.revokeApiKey.bind(authController));

  // Admin routes
  app.get('/api/auth/admin/users', 
    authenticateToken, 
    requireRole(['tenant_admin', 'super_admin']),
    requireTenant,
    (req: Request, res: Response) => { // Explicitly type parameters
      // Implement user listing for admins
      res.json({ message: 'Admin user list endpoint' });
    }
  );

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use((req: Request, res: Response) => { // Explicitly type parameters
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    });
  });

  return app;
};