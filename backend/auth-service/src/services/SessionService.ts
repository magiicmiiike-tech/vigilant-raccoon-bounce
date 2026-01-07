import Redis from 'ioredis';
import { AppDataSource } from '../data-source';
import { Session } from '../entities/Session';
import { TokenService } from './TokenService';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class SessionService {
  private redis: Redis;
  private sessionRepository = AppDataSource.getRepository(Session);

  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
    deviceInfo?: any
  ): Promise<{ sessionId: string; refreshToken: string }> {
    const refreshToken = TokenService.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = this.sessionRepository.create({
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      deviceType: deviceInfo?.deviceType,
      os: deviceInfo?.os,
      browser: deviceInfo?.browser,
      expiresAt,
      lastActiveAt: new Date(),
      isValid: true,
    });

    await this.sessionRepository.save(session);

    // Store session metadata in Redis for fast access
    await this.redis.setex(
      `session:${session.id}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify({
        userId,
        lastActiveAt: session.lastActiveAt,
        isValid: true,
      })
    );

    return {
      sessionId: session.id,
      refreshToken,
    };
  }

  async validateSession(sessionId: string, refreshToken: string): Promise<Session> {
    // Check Redis cache first
    const cached = await this.redis.get(`session:${sessionId}`);
    if (cached) {
      const sessionData = JSON.parse(cached);
      if (!sessionData.isValid) {
        throw new Error('Session invalidated');
      }
    }

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, refreshToken, isValid: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.isExpired()) {
      await this.invalidateSession(sessionId);
      throw new Error('Session expired');
    }

    // Update last active timestamp
    session.updateLastActive();
    await this.sessionRepository.save(session);

    // Update Redis cache
    await this.redis.setex(
      `session:${sessionId}`,
      7 * 24 * 60 * 60,
      JSON.stringify({
        userId: session.userId,
        lastActiveAt: session.lastActiveAt,
        isValid: true,
      })
    );

    return session;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId },
      { isValid: false }
    );
    
    await this.redis.del(`session:${sessionId}`);
  }

  async invalidateAllUserSessions(userId: string, excludeSessionId?: string): Promise<void> {
    const updateQuery: any = { userId, isValid: true };
    if (excludeSessionId) {
      updateQuery.id = { $ne: excludeSessionId };
    }

    await this.sessionRepository.update(
      updateQuery,
      { isValid: false }
    );

    // Find all session IDs to delete from Redis
    const sessions = await this.sessionRepository.find({
      where: { userId, isValid: false },
      select: ['id'],
    });

    const pipeline = this.redis.pipeline();
    sessions.forEach((session: Session) => { // Explicitly type session
      pipeline.del(`session:${session.id}`);
    });
    await pipeline.exec();
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId, isValid: true },
      order: { lastActiveAt: 'DESC' },
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.expires_at < :now', { now: new Date() })
      .orWhere('session.isValid = false')
      .getMany();

    if (expiredSessions.length > 0) {
      const sessionIds = expiredSessions.map((s: Session) => s.id); // Explicitly type s
      
      // Delete from database
      await this.sessionRepository.remove(expiredSessions);
      
      // Delete from Redis
      const pipeline = this.redis.pipeline();
      sessionIds.forEach((id: string) => pipeline.del(`session:${id}`)); // Explicitly type id
      await pipeline.exec();

      logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }

    return expiredSessions.length;
  }
}