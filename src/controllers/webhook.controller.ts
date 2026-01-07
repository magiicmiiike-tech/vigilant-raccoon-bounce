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

import { WebhookService } from '../services/webhook.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Tenant } from '../decorators/tenant.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateWebhookDto, UpdateWebhookDto } from '../models/dto/webhook.dto';
import { Webhook } from '../models/entities/webhook.entity';
import { WebhookDelivery } from '../models/entities/webhook-delivery.entity';

@ApiTags('webhooks')
@Controller('tenants/:tenantId/webhooks')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth('bearer')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  @Roles('admin', 'super_admin', 'tenant_admin', 'tenant_user')
  @ApiOperation({
    summary: 'List webhooks',
    description: 'Get a list of webhooks for a specific tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'List of webhooks',
    type: [Webhook],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<Webhook[]> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.webhookService.findAll(tenantId);
  }

  @Post()
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Create webhook',
    description: 'Create a new webhook for a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiBody({ type: CreateWebhookDto })
  @ApiResponse({
    status: 201,
    description: 'Webhook created successfully',
    type: Webhook,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() createWebhookDto: CreateWebhookDto,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<Webhook> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.webhookService.create(tenantId, createWebhookDto, userId);
  }

  @Get(':id')
  @Roles('admin', 'super_admin', 'tenant_admin', 'tenant_user')
  @ApiOperation({
    summary: 'Get webhook',
    description: 'Get detailed information about a specific webhook',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Webhook ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Webhook details',
    type: Webhook,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('id') tenantContext: string,
  ): Promise<Webhook> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.webhookService.findById(id, tenantId);
  }

  @Put(':id')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Update webhook',
    description: 'Update webhook configuration',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Webhook ID (UUID)' })
  @ApiBody({ type: UpdateWebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Webhook updated successfully',
    type: Webhook,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<Webhook> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.webhookService.update(id, tenantId, updateWebhookDto, userId);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Delete webhook',
    description: 'Delete a webhook',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Webhook ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
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

    await this.webhookService.delete(id, tenantId, userId);
    return { message: 'Webhook deleted successfully' };
  }

  @Post(':id/test')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Test webhook',
    description: 'Send a test event to the webhook',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Webhook ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Test event sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        responseTime: { type: 'number' },
        error: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async test(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    return this.webhookService.test(id, tenantId, userId);
  }

  @Get(':id/deliveries')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'List webhook deliveries',
    description: 'Get a paginated list of deliveries for a webhook',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Webhook ID (UUID)' })
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
    type: String,
    description: 'Filter by delivery status',
  })
  @ApiQuery({
    name: 'eventType',
    required: false,
    type: String,
    description: 'Filter by event type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter by start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter by end date (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of deliveries',
    schema: {
      type: 'object',
      properties: {
        deliveries: {
          type: 'array',
          items: { $ref: '#/components/schemas/WebhookDelivery' },
        },
        total: { type: 'integer' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async getDeliveries(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Tenant('id') tenantContext: string, // Moved to be a required parameter before optional @Query
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    if (limit > 100) {
      limit = 100;
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (eventType) filters.eventType = eventType;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.webhookService.getDeliveries(id, tenantId, page, limit, filters);
  }

  @Post('deliveries/:deliveryId/retry')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Retry webhook delivery',
    description: 'Retry a failed webhook delivery',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'deliveryId', description: 'Delivery ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Delivery queued for retry' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async retryDelivery(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('deliveryId', ParseUUIDPipe) deliveryId: string,
    @CurrentUser('id') userId: string,
    @Tenant('id') tenantContext: string,
  ): Promise<{ message: string }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    await this.webhookService.retryDelivery(deliveryId, userId);
    return { message: 'Delivery queued for retry' };
  }

  @Get('stats/overview')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Get webhook statistics',
    description: 'Get overview statistics for webhooks in a tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Webhook statistics',
    schema: {
      type: 'object',
      properties: {
        totalWebhooks: { type: 'number' },
        enabledWebhooks: { type: 'number' },
        disabledWebhooks: { type: 'number' },
        totalDeliveries: { type: 'number' },
        successfulDeliveries: { type: 'number' },
        failedDeliveries: { type: 'number' },
        pendingDeliveries: { type: 'number' },
        successRate: { type: 'number' },
        averageResponseTime: { type: 'number' },
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
    totalWebhooks: number;
    enabledWebhooks: number;
    disabledWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingDeliveries: number;
    successRate: number;
    averageResponseTime: number;
  }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    const webhooks = await this.webhookService.findAll(tenantId);
    const enabledWebhooks = webhooks.filter((w: Webhook) => w.enabled).length; // Explicitly typed 'w'

    // Mock statistics - in reality, you'd query the deliveries database
    const totalDeliveries = 1000;
    const successfulDeliveries = 850;
    const failedDeliveries = 100;
    const pendingDeliveries = 50;
    const successRate = (successfulDeliveries / (successfulDeliveries + failedDeliveries)) * 100;

    return {
      totalWebhooks: webhooks.length,
      enabledWebhooks,
      disabledWebhooks: webhooks.length - enabledWebhooks,
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      pendingDeliveries,
      successRate,
      averageResponseTime: 250, // ms
    };
  }

  @Post('trigger/:event')
  @Roles('admin', 'super_admin', 'tenant_admin')
  @ApiOperation({
    summary: 'Trigger webhook event',
    description: 'Manually trigger a webhook event for testing',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID (UUID)' })
  @ApiParam({ name: 'event', description: 'Event type to trigger' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        payload: { type: 'object', description: 'Event payload' },
      },
      required: ['payload'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Event triggered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        webhooksTriggered: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async triggerEvent(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('event') event: string,
    @Body('payload') payload: Record<string, any>,
    @Tenant('id') tenantContext: string,
  ): Promise<{ message: string; webhooksTriggered: number }> {
    if (tenantContext !== tenantId) {
      throw new BadRequestException('Tenant ID mismatch');
    }

    await this.webhookService.triggerEvent(tenantId, event as any, payload);

    const webhooks = await this.webhookService.findAll(tenantId);
    const matchingWebhooks = webhooks.filter((w: Webhook) => w.enabled && w.events.includes(event)); // Explicitly typed 'w'

    return {
      message: `Event '${event}' triggered successfully`,
      webhooksTriggered: matchingWebhooks.length,
    };
  }
}