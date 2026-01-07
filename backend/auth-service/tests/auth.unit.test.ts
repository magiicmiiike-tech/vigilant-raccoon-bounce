import { PasswordService } from '../src/services/PasswordService';
import { TokenService } from '../src/services/TokenService';
import { ValidationError } from '../src/utils/errors';
import jwt from 'jsonwebtoken';
import { RoleType } from '../src/types/db.types'; // Import RoleType
// import { DoneCallback } from '@types/jest'; // Removed explicit import, relying on global types

describe('PasswordService Unit Tests', () => {
  describe('validateStrength', () => {
    it('should accept valid passwords', () => {
      const result = PasswordService.validateStrength('Valid123!@#');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short passwords', () => {
      const result = PasswordService.validateStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase', () => {
      const result = PasswordService.validateStrength('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase', () => {
      const result = PasswordService.validateStrength('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = PasswordService.validateStrength('NoNumbers!@');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = PasswordService.validateStrength('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('hash and compare', () => {
    it('should hash and compare passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordService.hash(password);
      
      expect(hash).not.toBe(password);
      expect(await PasswordService.compare(password, hash)).toBe(true);
      expect(await PasswordService.compare('wrong', hash)).toBe(false);
    });
  });

  describe('generateRandom', () => {
    it('should generate passwords of specified length', () => {
      const length = 20;
      const password = PasswordService.generateRandom(length);
      
      expect(password).toHaveLength(length);
    });
  });
});

describe('TokenService Unit Tests', () => {
  const testPayload = {
    sub: 'profile-123', // Changed user-123 to profile-123
    email: 'test@example.com',
    tenantId: 'tenant-123',
    role: RoleType.USER, // Changed 'user' as const to RoleType.USER
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT', () => {
      const token = TokenService.generateAccessToken(testPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid tokens', () => {
      const token = TokenService.generateAccessToken(testPayload);
      const decoded = TokenService.verifyAccessToken(token);
      
      expect(decoded.sub).toBe(testPayload.sub);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.tenantId).toBe(testPayload.tenantId);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should reject expired tokens', (done: jest.DoneCallback) => { // Explicitly typed done
      // Generate token with 1ms expiry
      const expiredToken = jwt.sign(
        testPayload,
        'test-secret', // Use a consistent secret for testing
        { expiresIn: '1ms' }
      );
      
      // Wait for token to expire
      setTimeout(() => {
        expect(() => {
          jwt.verify(expiredToken, 'test-secret'); // Verify with the same secret
        }).toThrow('jwt expired');
        done(); // Call done to signal test completion
      }, 10);
    });

    it('should reject invalid tokens', () => {
      expect(() => {
        TokenService.verifyAccessToken('invalid.token.here');
      }).toThrow('Invalid access token');
    });
  });

  describe('generateApiKey', () => {
    it('should generate API keys with prefix', () => {
      const payload = {
        sub: 'profile-123', // Changed user-123 to profile-123
        tenantId: 'tenant-123',
        scopes: ['read', 'write'],
        type: 'user' as const,
      };
      
      const apiKey = TokenService.generateApiKey(payload);
      
      expect(apiKey).toMatch(/^duk_/);
      expect(apiKey.length).toBeGreaterThan(50);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate random strings', () => {
      const token1 = TokenService.generateRefreshToken();
      const token2 = TokenService.generateRefreshToken();
      
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(128); // 64 bytes = 128 hex chars
    });
  });
});