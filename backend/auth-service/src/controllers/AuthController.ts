import { Request, Response, NextFunction } from 'express';
import { classToPlain } from 'class-transformer';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { LoginAttempt } from '../entities/LoginAttempt';
import { 
  PasswordService, 
  TokenService, 
  SessionService, 
  MfaService,
  ApiKeyService 
} from '../services';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirm,
  MfaVerifyRequest,
  UserRole 
} from '../types/auth.types';
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError, 
  ConflictError,
  RateLimitError 
} from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);
  private passwordResetRepository = AppDataSource.getRepository(PasswordResetToken);
  private loginAttemptRepository = AppDataSource.getRepository(LoginAttempt);
  private sessionService = new SessionService();
  private mfaService = new MfaService();
  private apiKeyService = new ApiKeyService();

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registerData: RegisterRequest = req.body;

      // Validate password strength
      const passwordValidation = PasswordService.validateStrength(registerData.password);
      if (!passwordValidation.valid) {
        throw new ValidationError('Password does not meet requirements', passwordValidation.errors);
      }

      // Check if user already exists in tenant
      const existingUser = await this.userRepository.findOne({
        where: { email: registerData.email, tenantId: registerData.tenantId },
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists in this tenant');
      }

      // Create user
      const hashedPassword = await PasswordService.hash(registerData.password);
      
      const user = this.userRepository.create({
        email: registerData.email,
        password: hashedPassword,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phone: registerData.phone,
        tenantId: registerData.tenantId,
        role: UserRole.USER,
        metadata: registerData.metadata,
      });

      await this.userRepository.save(user);

      // Create initial session
      const { sessionId, refreshToken } = await this.sessionService.createSession(
        user.id,
        req.get('user-agent'),
        req.ip,
        req.body.deviceInfo
      );

      const accessToken = TokenService.generateAccessToken({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });

      const response: AuthResponse = {
        user: classToPlain(user) as any,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 24 * 60 * 60, // 24 hours in seconds
        },
      };

      // Remove sensitive data from response
      delete (response.user as any).password;
      delete (response.user as any).mfaSecret;

      logger.info(`User registered: ${user.email} in tenant ${user.tenantId}`);

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;

      // Rate limiting check (would be implemented in middleware)
      // This is a simplified version
      const recentAttempts = await this.loginAttemptRepository.count({
        where: {
          ipAddress: req.ip,
          createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) }, // Last 15 minutes
        },
      });

      if (recentAttempts > 10) {
        throw new RateLimitError('Too many login attempts');
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { email: loginData.email, tenantId: loginData.tenantId },
      });

      // Record login attempt
      await this.recordLoginAttempt(
        loginData.email,
        loginData.tenantId,
        req.ip,
        req.get('user-agent'),
        !!user
      );

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked()) {
        throw new AuthenticationError('Account is temporarily locked. Try again later.');
      }

      // Verify password
      const passwordValid = await PasswordService.compare(loginData.password, user.password);
      if (!passwordValid) {
        user.recordFailedAttempt();
        await this.userRepository.save(user);
        throw new AuthenticationError('Invalid credentials');
      }

      // Reset failed attempts on successful login
      user.recordSuccessfulLogin();
      await this.userRepository.save(user);

      // Check if MFA is required
      if (user.mfaEnabled) {
        const mfaToken = TokenService.generateMFAToken(user.id);
        
        res.status(200).json({
          requiresMfa: true,
          mfaToken,
          userId: user.id,
        });
        return;
      }

      // Create session
      const { sessionId, refreshToken } = await this.sessionService.createSession(
        user.id,
        req.get('user-agent'),
        req.ip,
        loginData.deviceInfo
      );

      const accessToken = TokenService.generateAccessToken({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });

      const response: AuthResponse = {
        user: classToPlain(user) as any,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 24 * 60 * 60,
        },
      };

      // Remove sensitive data
      delete (response.user as any).password;
      delete (response.user as any).mfaSecret;

      logger.info(`User logged in: ${user.email} from ${req.ip}`);

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.user?.sessionId;
      if (sessionId) {
        await this.sessionService.invalidateSession(sessionId);
      }

      logger.info(`User logged out: ${req.user?.email}`);

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      // Find session by refresh token
      const session = await AppDataSource.getRepository(Session).findOne({
        where: { refreshToken, isValid: true },
        relations: ['user'],
      });

      if (!session) {
        throw new AuthenticationError('Invalid refresh token');
      }

      if (session.isExpired()) {
        await this.sessionService.invalidateSession(session.id);
        throw new AuthenticationError('Refresh token expired');
      }

      // Generate new tokens
      const newRefreshToken = TokenService.generateRefreshToken();
      const accessToken = TokenService.generateAccessToken({
        sub: session.user.id,
        email: session.user.email,
        tenantId: session.user.tenantId,
        role: session.user.role,
      });

      // Update session with new refresh token
      session.refreshToken = newRefreshToken;
      session.updateLastActive();
      await AppDataSource.getRepository(Session).save(session);

      res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, tenantId }: PasswordResetRequest = req.body;

      const user = await this.userRepository.findOne({
        where: { email, tenantId, isActive: true },
      });

      if (!user) {
        // Don't reveal that user doesn't exist
        res.status(200).json({ 
          message: 'If an account exists with this email, you will receive a reset link' 
        });
        return;
      }

      // Generate reset token
      const token = TokenService.generatePasswordResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      const resetToken = this.passwordResetRepository.create({
        token,
        userId: user.id,
        expiresAt,
      });

      await this.passwordResetRepository.save(resetToken);

      // Send email (simplified)
      // In production, use a proper email service
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&tenant=${tenantId}`;
      
      logger.info(`Password reset link for ${email}: ${resetLink}`);

      res.status(200).json({ 
        message: 'If an account exists with this email, you will receive a reset link' 
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password, tenantId }: PasswordResetConfirm = req.body;

      // Validate password strength
      const passwordValidation = PasswordService.validateStrength(password);
      if (!passwordValidation.valid) {
        throw new ValidationError('Password does not meet requirements', passwordValidation.errors);
      }

      // Find reset token
      const resetToken = await this.passwordResetRepository.findOne({
        where: { token },
        relations: ['user'],
      });

      if (!resetToken || !resetToken.isValid()) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      // Ensure user belongs to the correct tenant
      if (resetToken.user.tenantId !== tenantId) {
        throw new AuthenticationError('Invalid tenant');
      }

      // Update password
      const hashedPassword = await PasswordService.hash(password);
      resetToken.user.password = hashedPassword;
      await this.userRepository.save(resetToken.user);

      // Mark token as used
      resetToken.markAsUsed();
      await this.passwordResetRepository.save(resetToken);

      // Invalidate all existing sessions
      await this.sessionService.invalidateAllUserSessions(resetToken.user.id);

      logger.info(`Password reset for user: ${resetToken.user.email}`);

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async setupMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const result = await this.mfaService.setupMfa(userId);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token }: MfaVerifyRequest = req.body;
      const mfaToken = req.headers['x-mfa-token'] as string;

      if (!mfaToken) {
        throw new AuthenticationError('MFA token required');
      }

      const payload = TokenService.verifyMFAToken(mfaToken);
      const verified = await this.mfaService.verifyMfa(payload.sub, token);

      if (!verified) {
        throw new AuthenticationError('Invalid MFA code');
      }

      // Get user and create session
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new NotFoundError('User');
      }

      const { sessionId, refreshToken } = await this.sessionService.createSession(
        user.id,
        req.get('user-agent'),
        req.ip
      );

      const accessToken = TokenService.generateAccessToken({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      });

      const response: AuthResponse = {
        user: classToPlain(user) as any,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 24 * 60 * 60,
        },
      };

      delete (response.user as any).password;
      delete (response.user as any).mfaSecret;

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async disableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      await this.mfaService.disableMfa(userId);
      
      res.status(200).json({ message: 'MFA disabled successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: req.user!.sub },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      const response = classToPlain(user) as any;
      delete response.password;
      delete response.mfaSecret;

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, scopes, expiresInDays } = req.body;
      const userId = req.user!.sub;
      const tenantId = req.user!.tenantId;

      const result = await this.apiKeyService.createApiKey(
        userId,
        tenantId,
        name,
        scopes,
        expiresInDays
      );

      // Important: Return API key only once
      res.status(201).json({
        apiKey: result.apiKey,
        name: result.entity.name,
        scopes: result.entity.scopes,
        expiresAt: result.entity.expiresAt,
        createdAt: result.entity.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async getApiKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const apiKeys = await this.apiKeyService.getUserApiKeys(userId);
      
      res.status(200).json(apiKeys);
    } catch (error) {
      next(error);
    }
  }

  async revokeApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.sub;
      
      await this.apiKeyService.revokeApiKey(id, userId);
      
      res.status(200).json({ message: 'API key revoked successfully' });
    } catch (error) {
      next(error);
    }
  }

  private async recordLoginAttempt(
    email: string,
    tenantId: string,
    ipAddress: string,
    userAgent?: string,
    successful: boolean = false,
    reason?: string
  ): Promise<void> {
    const attempt = this.loginAttemptRepository.create({
      email,
      tenantId,
      ipAddress,
      userAgent,
      successful,
      reason,
    });

    await this.loginAttemptRepository.save(attempt);
  }
}