import { AppDataSource } from '../data-source';
import { ApiKey } from '../entities/ApiKey';
import { TokenService } from './TokenService';
import { ApiKeyPayload } from '../types/auth.types';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export class ApiKeyService {
  private apiKeyRepository = AppDataSource.getRepository(ApiKey);

  async createApiKey(
    userId: string,
    tenantId: string,
    name: string,
    scopes: string[],
    expiresInDays?: number
  ): Promise<{ apiKey: string; entity: ApiKey }> {
    const payload: ApiKeyPayload = {
      sub: userId,
      tenantId,
      scopes,
      type: 'user',
    };

    const jwtToken = TokenService.generateApiKey(payload);

    const apiKeyEntity = this.apiKeyRepository.create({
      key: jwtToken,
      userId,
      tenantId,
      name,
      scopes,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
      isActive: true,
    });

    await this.apiKeyRepository.save(apiKeyEntity);

    return {
      apiKey: jwtToken,
      entity: apiKeyEntity,
    };
  }

  async createTenantApiKey(
    tenantId: string,
    name: string,
    scopes: string[]
  ): Promise<{ apiKey: string; entity: ApiKey }> {
    const payload: ApiKeyPayload = {
      sub: tenantId,
      tenantId,
      scopes,
      type: 'tenant',
    };

    const jwtToken = TokenService.generateApiKey(payload);

    const apiKeyEntity = this.apiKeyRepository.create({
      key: jwtToken,
      tenantId,
      name,
      scopes,
      isActive: true,
    });

    await this.apiKeyRepository.save(apiKeyEntity);

    return {
      apiKey: jwtToken,
      entity: apiKeyEntity,
    };
  }

  async validateApiKey(apiKey: string): Promise<ApiKey> {
    try {
      // Verify JWT signature
      const payload = TokenService.verifyApiKey(apiKey);

      // Find in database
      const apiKeyEntity = await this.apiKeyRepository.findOne({
        where: { key: apiKey },
      });

      if (!apiKeyEntity) {
        throw new AuthorizationError('API key not found');
      }

      if (!apiKeyEntity.canUse()) {
        throw new AuthorizationError('API key is not active or expired');
      }

      // Update last used timestamp
      apiKeyEntity.recordUsage();
      await this.apiKeyRepository.save(apiKeyEntity);

      return apiKeyEntity;
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw new AuthorizationError('Invalid API key');
    }
  }

  async revokeApiKey(apiKeyId: string, userId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId, userId },
    });

    if (!apiKey) {
      throw new NotFoundError('API key');
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }

  async revokeAllUserApiKeys(userId: string): Promise<void> {
    await this.apiKeyRepository.update(
      { userId, isActive: true },
      { isActive: false }
    );
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTenantApiKeys(tenantId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { tenantId, userId: null }, // Tenant-level API keys
      order: { createdAt: 'DESC' },
    });
  }
}