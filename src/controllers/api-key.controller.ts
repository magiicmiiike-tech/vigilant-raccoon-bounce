import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { ApiKeyService } from '../services/api-key.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Tenant } from '../decorators/tenant.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../models/dto/api-key.dto';
import { ApiKey, ApiKeyEnvironment } from '../models/entities/api-key.entity';

@ApiTags('api-keys')
@Controller('tenants/:tenantId/api-keys')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('bearer')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'List API keys',
    description: 'Get a list of API keys for a specific tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiQuery({
    name: 'environment',
    required: false,
    enum: ApiKeyEnvironment,
    description: 'Filter by environment',
  })
  @ApiResponse({
    status: 200,
    description: 'List of API keys',
    type: [ApiKey],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Tenant('id') tenantContext: string, // Moved to be a required parameter before optional @Query
    @Query('environment') environment?: ApiKeyEnvironment,
  ): Promise<ApiKey[]> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.apiKeyService.findAll(tenantId, environment);
  }

  @Post()
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Create API key',
    description: 'Create a new API key for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        key: { type: 'string', description: 'The API key (only shown once)' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() createApiKeyDto: CreateApiKeyDto,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<{ id: string; key: string; name: string; createdAt: Date }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.apiKeyService.create(tenantId, createApiKeyDto, userId);
  }

  @Get(':id')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Get API key',
    description: 'Get detailed information about a specific API key',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'API key ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'API key details',
    type: ApiKey,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('id') tenantContext: string,
  ): Promise<ApiKey> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.apiKeyService.findById(id, tenantId);
  }

  @Put(':id')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Update API key',
    description: 'Update API key information',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'API key ID (UUID)' })
  @ApiBody({ type: UpdateApiKeyDto })
  @ApiResponse({
    status: 200,
    description: 'API key updated successfully',
    type: ApiKey,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<ApiKey> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.apiKeyService.update(id, tenantId, updateApiKeyDto, userId);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Revoke API key',
    description: 'Revoke an API key (soft delete)',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'API key ID (UUID)' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<{ message: string }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    await this.apiKeyService.revoke(id, tenantId, userId);
    return { message: 'API key revoked successfully' };
  }

  @Post(':id/rotate')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Rotate API key',
    description: 'Generate a new key for an existing API key record',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'API key ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'New API key generated',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'The new API key (only shown once)' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async rotate(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<{ key: string }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.apiKeyService.rotate(id, tenantId, userId);
  }

  @Get(':id/usage')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Get API key usage',
    description: 'Get usage statistics for a specific API key',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'API key ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'API key usage statistics',
    schema: {
      type: 'object',
      properties: {
        lastUsedAt: { type: 'string', format: 'date-time' },
        lastUsedIp: { type: 'string' },
        totalUses: { type: 'number' },
        usageByDay: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async getUsage(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('id') tenantContext: string,
  ): Promise<{
    lastUsedAt: Date | null;
    lastUsedIp: string | null;
    totalUses: number;
    usageByDay: Record<string, number>;
  }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    const apiKey = await this.apiKeyService.findById(id, tenantId);

    // Mock usage data - in reality, you'd query a usage database
    return {
      lastUsedAt: apiKey.lastUsedAt,
      lastUsedIp: apiKey.lastUsedIp,
      totalUses: 150,
      usageByDay: {
        '2024-01-01': 10,
        '2024-01-02': 15,
        '2024-01-03': 20,
      },
    };
  }

  @Get('stats/overview')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Get API key statistics',
    description: 'Get overview statistics for all API keys in a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'API key statistics',
    schema: {
      type: 'object',
      properties: {
        totalKeys: { type: 'number' },
        activeKeys: { type: 'number' },
        revokedKeys: { type: 'number' },
        expiredKeys: { type: 'number' },
        usageByEnvironment: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getStats(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<{
    totalKeys: number;
    activeKeys: number;
    revokedKeys: number;
    expiredKeys: number;
    usageByEnvironment: Record<string, number>;
  }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.apiKeyService.getUsageStats(tenantId);
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate API key',
    description: 'Validate an API key without requiring authentication',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'API key to validate' },
      },
      required: ['apiKey'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'API key validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        tenantId: { type: 'string', format: 'uuid' },
        environment: { type: 'string' },
        scopes: { type: 'array', items: { type: 'string' } },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  async validate(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body('apiKey') apiKey: string,
    @Body('ipAddress') ipAddress?: string,
  ): Promise<{
    valid: boolean;
    tenantId: string;
    environment: string;
    scopes: string[];
    expiresAt: string | null;
  }> {
    try {
      const apiKeyRecord = await this.apiKeyService.validateApiKey(
        tenantId,
        apiKey,
        ipAddress,
      );

      return {
        valid: true,
        tenantId: apiKeyRecord.tenantId,
        environment: apiKeyRecord.environment,
        scopes: apiKeyRecord.scopes,
        expiresAt: apiKeyRecord.expiresAt?.toISOString() || null,
      };
    } catch (error) {
      return {
        valid: false,
        tenantId,
        environment: 'unknown',
        scopes: [],
        expiresAt: null,
      };
    }
  }
}