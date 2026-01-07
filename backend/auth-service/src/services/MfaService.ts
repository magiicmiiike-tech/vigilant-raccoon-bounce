import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { AppDataSource } from '../data-source';
import { Profile } from '../entities/Profile'; // Changed from User to Profile
import { config } from '../config/config';
import { MfaSetupResponse } from '../types/auth.types';
import { NotFoundError } from '../utils/errors';

export class MfaService {
  private profileRepository = AppDataSource.getRepository(Profile); // Changed to profileRepository

  async setupMfa(profileId: string): Promise<MfaSetupResponse> { // Changed userId to profileId
    const profile = await this.profileRepository.findOne({ where: { id: profileId } }); // Changed user to profile
    
    if (!profile) {
      throw new NotFoundError('Profile'); // Changed User to Profile
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${config.mfa.appName}:${profile.email}`, // Changed user.email to profile.email
    });

    // Generate QR code URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (encrypted in real production)
    profile.mfaSecret = secret.base32;
    await this.profileRepository.save(profile); // Changed userRepository to profileRepository

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  async verifyMfa(profileId: string, token: string): Promise<boolean> { // Changed userId to profileId
    const profile = await this.profileRepository.findOne({ where: { id: profileId } }); // Changed user to profile
    
    if (!profile || !profile.mfaSecret) {
      throw new NotFoundError('Profile or MFA secret'); // Changed User to Profile
    }

    const verified = speakeasy.totp.verify({
      secret: profile.mfaSecret, // Changed user.mfaSecret to profile.mfaSecret
      encoding: 'base32',
      token,
      window: 1, // Allow 30 seconds before/after
    });

    if (verified && !profile.mfaEnabled) { // Changed user.mfaEnabled to profile.mfaEnabled
      profile.mfaEnabled = true; // Changed user.mfaEnabled to profile.mfaEnabled
      await this.profileRepository.save(profile); // Changed userRepository to profileRepository
    }

    return verified;
  }

  async disableMfa(profileId: string): Promise<void> { // Changed userId to profileId
    await this.profileRepository.update( // Changed userRepository to profileRepository
      { id: profileId },
      { mfaEnabled: false, mfaSecret: null }
    );
  }

  async generateBackupCodes(profileId: string, count: number = 10): Promise<string[]> { // Changed userId to profileId
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }

    // In production, store hashed backup codes
    // For now, return plain codes
    return codes;
  }

  async validateBackupCode(profileId: string, code: string): Promise<boolean> { // Changed userId to profileId
    // Implement backup code validation
    // This would check against stored (hashed) backup codes
    return false;
  }
}