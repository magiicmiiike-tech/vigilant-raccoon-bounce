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
  ApiSecurity,
} from '@nestjs/swagger';

import { TenantService } from '../services/tenant.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Tenant } from '../decorators/tenant.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateTenantDto, UpdateTenantDto } from '../models/dto/create-tenant.dto';
import { Tenant as TenantEntity, TenantStatus } from '../models/entities/tenant.entity';
import { TenantConfig } from '../models/entities/tenant-config.entity';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('bearer')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @Roles('admin', 'super_admin')
  @ApiOperation({
    summary: 'List all tenants',
    description: 'Get a paginated list of all tenants (admin only)',
  })
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TenantStatus,
    description: 'Filter by tenant status',
  })
  @ApiQuery({
    name: 'planTier',
    required: false,
    type: String,
    description: 'Filter by plan tier',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or domain',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenants',
    schema: {
      type: 'object',
      properties: {
        tenants: { type: 'array', items: { $ref: '#/components/schemas/Tenant' } },
        total: { type: 'integer' },
        page: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('status') status?: TenantStatus,
    @Query('planTier') planTier?: string,
    @Query('search') search?: string,
  ) {
    if (limit > 100) {
      limit = 100;
    }

    return this.tenantService.findAll(page, limit, {
      status,
      planTier,
      search,
    });
  }

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({
    summary: 'Create a new tenant',
    description: 'Create a new tenant with initial configuration',
  })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict - domain already exists' })
  async create(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser('id') userId: string,
  ): Promise<TenantEntity> {
    return this.tenantService.create(createTenantDto, userId);
  }

  @Get(':id')
  @Tenant('id')
  @Roles('admin', 'super_admin', 'tenant_admin', 'tenant_user')
  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Get detailed information about a specific tenant',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant details',
    type: TenantEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('id') tenantId: string,
  ): Promise<TenantEntity> {
    // Ensure the user is accessing their own tenant or has admin rights
    if (tenantId !== id) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.tenantService.findById(id);
  }

  @Put(':id')
  @Tenant('id')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Update tenant',
    description: 'Update tenant information and configuration',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID (UUID)' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantId: string,
  ): Promise<TenantEntity> {
    if (tenantId !== id) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.tenantService.update(id, updateTenantDto, userId);
  }

  @Delete(':id')
  @Tenant('id')
  @Roles('admin', 'super_admin')
  @ApiOperation({
    summary: 'Delete tenant',
    description: 'Soft delete a tenant (marks as deleted)',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantId: string,
  ): Promise<{ message: string }> {
    if (tenantId !== id) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    await this.tenantService.delete(id, userId);
    return { message: 'Tenant deleted successfully' };
  }

  @Put(':id/status')
  @Tenant('id')
  @Roles('admin', 'super_admin')
  @ApiOperation({
    summary: 'Update tenant status',
    description: 'Update the status of a tenant (active, suspended, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: Object.values(TenantStatus) },
        reason: { type: 'string', description: 'Reason for status change' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant status updated',
    type: TenantEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TenantStatus,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantId: string,
  ): Promise<TenantEntity> {
    if (tenantId !== id) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.tenantService.updateStatus(id, status, userId, reason);
  }

  @Get(':id/config')
  @Tenant('id')
  @Roles('admin', 'super_admin', 'tenant_admin', 'tenant_user')
  @ApiOperation({
    summary: 'Get tenant configuration',
    description: 'Get the configuration for a specific tenant',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID (UUID)' })
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
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeSecrets') includeSecrets: boolean = false,
    @Tenant('id') tenantId: string,
  ): Promise<TenantConfig> {
    if (tenantId !== id) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.tenantService.getConfig(id, includeSecrets);
  }

  @Put(':id/config')
  @Tenant('id')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Update tenant configuration',
    description: 'Update the configuration for a specific tenant',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID (UUID)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        voiceSettings: { type: 'object' },
        agentSettings: { type: 'object' },
        telephonySettings: { type: 'object' },
        integrationSettings: { type: 'object' },
        metadata: { type: 'object' },
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
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async updateConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() configData: Partial<TenantConfig>,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantId: string,
  ): Promise<TenantConfig> {
    if (tenantId !== id) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.tenantService.updateConfig(id, configData, userId);
  }

  @Get(':id/usage')
  @Tenant('id')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Get tenant usage',
    description: 'Get usage statistics for a specific tenant',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant usage statistics',
    schema: {
      type: 'object',
      properties: {
        callMinutes: { type: 'number' },
        apiRequests: { type: 'number' },
        storageMb: { type: 'number' },
        agentSessions: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getUsage(
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('id') tenantId: string,
  ): Promise<{
    callMinutes: number;
    apiRequests: number;
    storageMb: number;
    agentSessions: number;
  }> {
    if (tenantId !== id) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.tenantService.getUsage(id);
  }

  @Post(':id/validate-api-key')
  @ApiOperation({
    summary: 'Validate API key',
    description: 'Validate an API key for a specific tenant',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID (UUID)' })
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
        scopes: { type: 'array', items: { type: 'string' } },
        environment: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid API key' })
  async validateApiKey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('apiKey') apiKey: string,
  ): Promise<{
    valid: boolean;
    scopes: string[];
    environment: string;
    expiresAt: string | null;
  }> {
    const isValid = await this.tenantService.validateApiAccess(id, apiKey);

    if (!isValid) {
      throw new BadRequestException('Invalid API key');
    }

    // Return mock data - in reality, you'd get this from the API key validation
    return {
      valid: true,
      scopes: ['tenant:read', 'tenant:write'],
      environment: 'live',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}