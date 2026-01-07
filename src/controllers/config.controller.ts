import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
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

import { ConfigService } from '../services/config.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Tenant } from '../decorators/tenant.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { TenantConfig } from '../models/entities/tenant-config.entity';
import { ConfigVersion } from '../models/entities/config-version.entity';

@ApiTags('config')
@Controller('tenants/:tenantId/config')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('bearer')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Roles('admin', 'super_admin', 'tenant_admin', 'tenant_user')
  @ApiOperation({
    summary: 'Get tenant configuration',
    description: 'Get the complete configuration for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiQuery({
    name: 'includeSecrets',
    required: false,
    type: Boolean,
    description: 'Include sensitive configuration (API keys, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant configuration',
    type: TenantConfig,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant or config not found' })
  async getConfig(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('includeSecrets') includeSecrets: boolean = false,
    @Tenant('id') tenantContext: string,
  ): Promise<TenantConfig> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.configService.getConfig(tenantId, includeSecrets);
  }

  @Put()
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Update tenant configuration',
    description: 'Update the configuration for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        voiceSettings: { type: 'object' },
        agentSettings: { type: 'object' },
        telephonySettings: { type: 'object' },
        integrationSettings: { type: 'object' },
        metadata: { type: 'object' },
        description: { type: 'string', description: 'Change description' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    type: TenantConfig,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateConfig(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() configData: Partial<TenantConfig>,
    @Body('description') description: string,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<TenantConfig> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.configService.updateConfig(tenantId, configData, userId, description);
  }

  @Get('versions')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'List configuration versions',
    description: 'Get a paginated list of configuration versions',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts at 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of configuration versions',
    schema: {
      type: 'object',
      properties: {
        versions: {
          type: 'array',
          items: { $ref: '#/components/schemas/ConfigVersion' },
        },
        total: { type: 'integer' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getVersions(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Tenant('id') tenantContext: string,
  ): Promise<{ versions: ConfigVersion[]; total: number }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    if (limit > 100) {
      limit = 100;
    }

    return this.configService.getVersions(tenantId, page, limit);
  }

  @Get('versions/:versionId')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Get configuration version',
    description: 'Get a specific version of the configuration',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'versionId', description: 'Version ID (UUID)' })
  @ApiQuery({
    name: 'includeSecrets',
    required: false,
    type: Boolean,
    description: 'Include sensitive configuration (API keys, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration version',
    type: ConfigVersion,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async getVersion(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Query('includeSecrets') includeSecrets: boolean = false,
    @Tenant('id') tenantContext: string,
  ): Promise<ConfigVersion> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.configService.getVersion(tenantId, versionId, includeSecrets);
  }

  @Post('rollback/:versionId')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Rollback configuration',
    description: 'Rollback to a previous configuration version',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'versionId', description: 'Version ID to rollback to (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Configuration rolled back successfully',
    type: TenantConfig,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async rollback(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<TenantConfig> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.configService.rollback(tenantId, versionId, userId);
  }

  @Get('export')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Export configuration',
    description: 'Export tenant configuration as JSON or YAML',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'yaml'],
    description: 'Export format',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration exported successfully',
    schema: {
      type: 'string',
      description: 'Configuration in the specified format',
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async export(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('format') format: 'json' | 'yaml' = 'json',
    @Tenant('id') tenantContext: string,
  ): Promise<string> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.configService.exportConfig(tenantId, format);
  }

  @Post('import')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Import configuration',
    description: 'Import configuration from JSON or YAML',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        configData: { type: 'string', description: 'Configuration data' },
        format: { type: 'string', enum: ['json', 'yaml'], default: 'json' },
        description: { type: 'string', description: 'Import description' },
      },
      required: ['configData'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration imported successfully',
    type: TenantConfig,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async import(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body('configData') configData: string,
    @Body('format') format: 'json' | 'yaml' = 'json',
    @Body('description') description: string = 'Imported from file',
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<TenantConfig> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.configService.importConfig(tenantId, configData, userId, format);
  }

  @Post('validate')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Validate configuration',
    description: 'Validate configuration data without applying it',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        configData: { type: 'object', description: 'Configuration data to validate' },
      },
      required: ['configData'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Validation results',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async validate(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body('configData') configData: Partial<TenantConfig>,
    @Tenant('id') tenantContext: string,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.configService.validateConfig(configData);
  }

  @Get('defaults')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Get default configuration',
    description: 'Get default configuration for a specific plan tier',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiQuery({
    name: 'planTier',
    required: false,
    enum: ['starter', 'business', 'enterprise'],
    description: 'Plan tier to get defaults for',
  })
  @ApiResponse({
    status: 200,
    description: 'Default configuration',
    type: 'object',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDefaults(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('planTier') planTier: string = 'starter',
    @Tenant('id') tenantContext: string,
  ): Promise<Partial<TenantConfig>> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.configService.getDefaultConfig(planTier);
  }
}