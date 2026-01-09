import { AccessToken } from 'livekit-server-sdk';
import { logger } from '@dukat/shared';

export interface TokenRequest {
  roomName: string;
  participantName: string;
  userId?: string;
  tenantId: string;
  metadata?: Record<string, any>;
}

export interface TokenResponse {
  token: string;
  roomName: string;
  participantName: string;
  wsUrl: string;
  expiresAt: number;
}

export class TokenService {
  private apiKey: string;
  private apiSecret: string;
  private livekitUrl: string;

  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    this.apiSecret = process.env.LIVEKIT_API_SECRET || 'devsecret';
    this.livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
  }

  async generateToken(request: TokenRequest): Promise<TokenResponse> {
    try {
      if (!request.roomName || !request.participantName) {
        throw new Error('Missing roomName or participantName');
      }

      const at = new AccessToken(this.apiKey, this.apiSecret, {
        identity: request.participantName,
        name: request.participantName,
        metadata: JSON.stringify({
          userId: request.userId,
          tenantId: request.tenantId,
          ...request.metadata,
        }),
      });

      at.addGrant({
        room: request.roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const token = await at.toJwt();
      const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

      logger.info(`Generated LiveKit token for participant: ${request.participantName} in room: ${request.roomName}`);

      return {
        token,
        roomName: request.roomName,
        participantName: request.participantName,
        wsUrl: this.livekitUrl,
        expiresAt,
      };
    } catch (error) {
      logger.error('Failed to generate LiveKit token', error);
      throw error;
    }
  }
}
