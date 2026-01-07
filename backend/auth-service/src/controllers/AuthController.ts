import { Request, Response, NextFunction } from 'express';
import { classToPlain } from 'class-transformer';
import { AppDataSource } from '../data-source';
import { Profile } from '../entities/Profile';
import { AppSession } from '../entities/AppSession';
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
} from '../types/auth.types';
import { RoleType } from '../types/db.types'; // Correctly import RoleType from db.types.ts
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError, 
  ConflictError,
  RateLimitError 
} from '../utils/errors';
import { logger } from '../utils/logger';

export class AuthController {
  private profileRepository = AppDataSource.getRepository(Profile);
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

      // Check if profile already exists in tenant
      const existingProfile = await this.profileRepository.findOne({
        where: { email: registerData.email, tenantId: registerData.tenantId },
      });

      if (existingProfile) {
        throw new ConflictError('Profile with this email already exists in this tenant');
      }

      // Create profile
      const hashedPassword = await PasswordService.hash(registerData.password);
      
      const profile = this.profileRepository.create({
        email: registerData.email,
        passwordHash: hashedPassword,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phone: registerData.phone,
        tenantId: registerData.tenantId,
        status: 'active', // Default status
        metadata: registerData.metadata,
      });

      await this.profileRepository.save(profile);

      // Create initial session
      const { sessionId, refreshToken } = await this.sessionService.createSession(
        profile.id,
        profile.tenantId,
        req.get('user-agent'),
        req.ip,
        req.body.deviceInfo
      );

      const accessToken = TokenService.generateAccessToken({
        sub: profile.id,
        email: profile.email,
        tenantId: profile.tenantId,
        role: RoleType.USER, // Assuming default role for new registrations
      });

      const response: AuthResponse = {
        user: classToPlain(profile) as any,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 24 * 60 * 60, // 24 hours in seconds
        },
      };

      // Remove sensitive data from response
      delete (response.user as any).passwordHash;
      delete (response.user as any).mfaSecret;

      logger.info(`Profile registered: ${profile.email} in tenant ${profile.tenantId}`);

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

      // Find profile
      const profile = await this.profileRepository.findOne({
        where: { email: loginData.email, tenantId: loginData.tenantId },
        relations: ['roles'], // Load roles to get the primary role
      });

      // Record login attempt
      await this.recordLoginAttempt(
        loginData.email,
        loginData.tenantId,
        req.ip,
        req.get('user-agent'),
        !!profile
      );

      if (!profile) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if account is locked
      if (profile.isLocked()) {
        throw new AuthenticationError('Account is temporarily locked. Try again later.');
      }

      // Verify password
      const passwordValid = await PasswordService.compare(loginData.password, profile.passwordHash);
      if (!passwordValid) {
        profile.recordFailedAttempt();
        await this.profileRepository.save(profile);
        throw new AuthenticationError('Invalid credentials');
      }

      // Reset failed attempts on successful login
      profile.recordSuccessfulLogin();
      await this.profileRepository.save(profile);

      // Determine the primary role for the JWT payload
      const primaryRole = profile.roles?.[0]?.name || RoleType.USER;

      // Check if MFA is required
      if (profile.mfaEnabled) {
        const mfaToken = TokenService.generateMFAToken(profile.id);
        
        res.status(200).json({
          requiresMfa: true,
          mfaToken,
          profileId: profile.id,
        });
        return;
      }

      // Create session
      const { sessionId, refreshToken } = await this.sessionService.createSession(
        profile.id,
        profile.tenantId,
        req.get('user-agent'),
        req.ip,
        loginData.deviceInfo
      );

      const accessToken = TokenService.generateAccessToken({
        sub: profile.id,
        email: profile.email,
        tenantId: profile.tenantId,
        role: primaryRole,
      });

      const response: AuthResponse = {
        user: classToPlain(profile) as any,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 24 * 60 * 60,
        },
      };

      // Remove sensitive data
      delete (response.user as any).passwordHash;
      delete (response.user as any).mfaSecret;

      logger.info(`Profile logged in: ${profile.email} from ${req.ip}`);

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

      logger.info(`Profile logged out: ${req.user?.email}`);

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
      const session = await AppDataSource.getRepository(AppSession).findOne({
        where: { refreshTokenHash: refreshToken, status: 'active' },
        relations: ['profile', 'profile.roles'],
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
      const primaryRole = session.profile.roles?.[0]?.name || RoleType.USER;

      const accessToken = TokenService.generateAccessToken({
        sub: session.profile.id,
        email: session.profile.email,
        tenantId: session.profile.tenantId,
        role: primaryRole,
      });

      // Update session with new refresh token
      session.refreshTokenHash = newRefreshToken;
      session.updateLastUsed();
      await AppDataSource.getRepository(AppSession).save(session);

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

      const profile = await this.profileRepository.findOne({
        where: { email, tenantId, status: 'active' },
      });

      if (!profile) {
        // Don't reveal that profile doesn't exist
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
        profileId: profile.id,
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
        relations: ['profile'],
      });

      if (!resetToken || !resetToken.isValid()) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      // Ensure profile belongs to the correct tenant
      if (resetToken.profile.tenantId !== tenantId) {
        throw new AuthenticationError('Invalid tenant');
      }

      // Update password
      const hashedPassword = await PasswordService.hash(password);
      resetToken.profile.passwordHash = hashedPassword;
      resetToken.profile.passwordChangedAt = new Date();
      await this.profileRepository.save(resetToken.profile);

      // Mark token as used
      resetToken.markAsUsed();
      await this.passwordResetRepository.save(resetToken);

      // Invalidate all existing sessions
      await this.sessionService.invalidateAllProfileSessions(resetToken.profile.id);

      logger.info(`Password reset for profile: ${resetToken.profile.email}`);

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  async setupMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user!.sub;
      const result = await this.mfaService.setupMfa(profileId);
      
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

      // Get profile and create session
      const profile = await this.profileRepository.findOne({ where: { id: payload.sub } });
      if (!profile) {
        throw new NotFoundError('Profile');
      }

      const { sessionId, refreshToken } = await this.sessionService.createSession(
        profile.id,
        profile.tenantId,
        req.get('user-agent'),
        req.ip
      );

      const primaryRole = profile.roles?.[0]?.name || RoleType.USER;

      const accessToken = TokenService.generateAccessToken({
        sub: profile.id,
        email: profile.email,
        tenantId: profile.tenantId,
        role: primaryRole,
      });

      const response: AuthResponse = {
        user: classToPlain(profile) as any,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 24 * 60 * 60,
        },
      };

      delete (response.user as any).passwordHash;
      delete (response.user as any).mfaSecret;

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async disableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user!.sub;
      await this.mfaService.disableMfa(profileId);
      
      res.status(200).json({ message: 'MFA disabled successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await this.profileRepository.findOne({
        where: { id: req.user!.sub },
        relations: ['roles'],
      });

      if (!profile) {
        throw new NotFoundError('Profile');
      }

      const response = classToPlain(profile) as any;
      delete response.passwordHash;
      delete response.mfaSecret;

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, scopes, expiresInDays } = req.body;
      const profileId = req.user!.sub;
      const tenantId = req.user!.tenantId;

      const result = await this.apiKeyService.createApiKey(
        profileId,
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
      const profileId = req.user!.sub;
      const apiKeys = await this.apiKeyService.getProfileApiKeys(profileId);
      
      res.status(200).json(apiKeys);
    } catch (error) {
      next(error);
    }
  }

  async revokeApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const profileId = req.user!.sub;
      
      await this.apiKeyService.revokeApiKey(id, profileId);
      
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