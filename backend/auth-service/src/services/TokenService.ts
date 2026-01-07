import jwt from 'jsonwebtoken';
import * as crypto from 'crypto'; // Changed to import * as crypto
import { config } from '../config/config';
import { JwtPayload, ApiKeyPayload } from '../types/auth.types';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

export class TokenService {
  static generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
      issuer: 'dukat-auth-service',
      audience: 'dukat-voice',
    });
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret, {
        issuer: 'dukat-auth-service',
        audience: 'dukat-voice',
      }) as JwtPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid access token');
      }
      throw error;
    }
  }

  static generateApiKey(payload: ApiKeyPayload): string {
    const token = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: '365d',
      issuer: 'dukat-auth-service',
      audience: 'dukat-voice-api',
    });
    
    // Prefix with duk_ for easy identification
    return `duk_${Buffer.from(token).toString('base64')}`;
  }

  static verifyApiKey(apiKey: string): ApiKeyPayload {
    try {
      // Remove prefix
      const token = apiKey.startsWith('duk_') 
        ? Buffer.from(apiKey.slice(4), 'base64').toString()
        : apiKey;
        
      return jwt.verify(token, config.jwt.accessSecret, {
        issuer: 'dukat-auth-service',
        audience: 'dukat-voice-api',
      }) as ApiKeyPayload;
    } catch (error: any) {
      throw new AuthorizationError('Invalid API key');
    }
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateMFAToken(profileId: string): string { // Changed userId to profileId
    return jwt.sign(
      { sub: profileId, type: 'mfa' }, // Changed userId to profileId
      config.jwt.accessSecret,
      { expiresIn: '5m' }
    );
  }

  static verifyMFAToken(token: string): { sub: string } {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as { sub: string };
    } catch (error: any) {
      throw new AuthenticationError('Invalid MFA token');
    }
  }

  static decodeTokenWithoutVerification(token: string): any {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }
}