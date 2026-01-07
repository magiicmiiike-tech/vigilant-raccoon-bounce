import Redis from 'ioredis';
import { AppDataSource } from '../data-source';
import { AppSession } from '../entities/AppSession'; // Changed from Session to AppSession
import { TokenService } from './TokenService';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { Not } from 'typeorm'; // Import Not operator

export class SessionService {
  private redis: Redis;
  private sessionRepository = AppDataSource.getRepository(AppSession); // Changed to AppSession

  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  async createSession(
    profileId: string, // Changed userId to profileId
    tenantId: string, // Added tenantId
    userAgent?: string,
    ipAddress?: string,
    deviceInfo?: any
  ): Promise<{ sessionId: string; refreshToken: string }> {
    const refreshToken = TokenService.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    const refreshExpiresAt = new Date(expiresAt); // Refresh token expires at the same time as access token for simplicity

    const session = this.sessionRepository.create({
      profileId, // Changed userId to profileId
      tenantId, // Added tenantId
      accessTokenHash: 'temp_hash_for_creation', // Placeholder, will be updated with actual access token hash later
      refreshTokenHash: refreshToken, // Storing the actual refresh token
      userAgent,
      ipAddress,
      deviceInfo: deviceInfo || {},
      expiresAt,
      refreshExpiresAt,
      lastUsedAt: new Date(),
      status: 'active',
    });

    await this.sessionRepository.save(session);

    // Store session metadata in Redis for fast access
    await this.redis.setex(
      `session:${session.id}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify({
        profileId, // Changed userId to profileId
        tenantId,
        lastUsedAt: session.lastUsedAt,
        status: 'active',
      })
    );

    return {
      sessionId: session.id,
      refreshToken,
    };
  }

  async validateSession(sessionId: string, refreshToken: string): Promise<AppSession> { // Changed to AppSession
    // Check Redis cache first
    const cached = await this.redis.get(`session:${sessionId}`);
    if (cached) {
      const sessionData = JSON.parse(cached);
      if (sessionData.status !== 'active') {
        throw new Error('Session invalidated');
      }
    }

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, refreshTokenHash: refreshToken, status: 'active' }, // Changed refreshToken to refreshTokenHash
      relations: ['profile'], // Load profile relation
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.isExpired()) {
      await this.invalidateSession(sessionId);
      throw new Error('Session expired');
    }

    // Update last active timestamp
    session.updateLastUsed();
    await this.sessionRepository.save(session);

    // Update Redis cache
    await this.redis.setex(
      `session:${sessionId}`,
      7 * 24 * 60 * 60,
      JSON.stringify({
        profileId: session.profileId, // Changed userId to profileId
        tenantId: session.tenantId,
        lastUsedAt: session.lastUsedAt,
        status: 'active',
      })
    );

    return session;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId },
      { status: 'revoked' }
    );
    
    await this.redis.del(`session:${sessionId}`);
  }

  async invalidateAllProfileSessions(profileId: string, excludeSessionId?: string): Promise<void> { // Changed userId to profileId
    const updateCriteria: any = { profileId, status: 'active' }; // Changed userId to profileId
    if (excludeSessionId) {
      updateCriteria.id = Not(excludeSessionId); // Fixed: Using TypeORM Not operator
    }

    await this.sessionRepository.update(
      updateCriteria,
      { status: 'revoked' }
    );

    // Find all session IDs to delete from Redis
    const sessions = await this.sessionRepository.find({
      where: { profileId, status: 'revoked' }, // Changed userId to profileId
      select: ['id'],
    });

    const pipeline = this.redis.pipeline();
    sessions.forEach((session: AppSession) => {
      pipeline.del(`session:${session.id}`);
    });
    await pipeline.exec();
  }

  async getProfileSessions(profileId: string): Promise<AppSession[]> { // Changed userId to profileId, Session to AppSession
    return this.sessionRepository.find({
      where: { profileId, status: 'active' }, // Changed userId to profileId
      order: { lastUsedAt: 'DESC' },
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.expires_at < :now', { now: new Date() })
      .orWhere('session.status != :activeStatus', { activeStatus: 'active' })
      .getMany();

    if (expiredSessions.length > 0) {
      const sessionIds = expiredSessions.map((s: AppSession) => s.id);
      
      // Delete from database
      await this.sessionRepository.remove(expiredSessions);
      
      // Delete from Redis
      const pipeline = this.redis.pipeline();
      sessionIds.forEach((id: string) => pipeline.del(`session:${id}`));
      await pipeline.exec();

      logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }

    return expiredSessions.length;
  }
}