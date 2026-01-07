import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { config } from '../config/config';
import { MfaSetupResponse } from '../types/auth.types';
import { NotFoundError } from '../utils/errors';

export class MfaService {
  private userRepository = AppDataSource.getRepository(User);

  async setupMfa(userId: string): Promise<MfaSetupResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${config.mfa.appName}:${user.email}`,
    });

    // Generate QR code URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (encrypted in real production)
    user.mfaSecret = secret.base32;
    await this.userRepository.save(user);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  async verifyMfa(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.mfaSecret) {
      throw new NotFoundError('User or MFA secret');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1, // Allow 30 seconds before/after
    });

    if (verified && !user.mfaEnabled) {
      user.mfaEnabled = true;
      await this.userRepository.save(user);
    }

    return verified;
  }

  async disableMfa(userId: string): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      { mfaEnabled: false, mfaSecret: null }
    );
  }

  async generateBackupCodes(userId: string, count: number = 10): Promise<string[]> {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }

    // In production, store hashed backup codes
    // For now, return plain codes
    return codes;
  }

  async validateBackupCode(userId: string, code: string): Promise<boolean> {
    // Implement backup code validation
    // This would check against stored (hashed) backup codes
    return false;
  }
}