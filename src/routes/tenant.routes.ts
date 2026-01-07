import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantController } from '../controllers/tenant.controller';
import { ApiKeyController } from '../controllers/api-key.controller';
import { WebhookController } from '../controllers/webhook.controller';
import { ConfigController } from '../controllers/config.controller';

import { TenantService } from '../services/tenant.service';
import { ApiKeyService } from '../services/api-key.service';
import { WebhookService } from '../services/webhook.service';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { EncryptionService } from '../services/encryption.service';
import { MessageQueueService } from '../services/message-queue.service';

import { Tenant } from '../models/entities/tenant.entity';
import { TenantConfig } from '../models/entities/tenant-config.entity';
import { ApiKey } from '../models/entities/api-key.entity';
import { Webhook } from '../models/entities/webhook.entity';
import { WebhookDelivery } from '../models/entities/webhook-delivery.entity';
import { FeatureFlag } from '../models/entities/feature-flag.entity';
import { UsageQuota } from '../models/entities/usage-quota.entity';
import { ConfigVersion } from '../models/entities/config-version.entity';

import { TenantRepository } from '../repositories/tenant.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      TenantConfig,
      ApiKey,
      Webhook,
      WebhookDelivery,
      FeatureFlag,
      UsageQuota,
      ConfigVersion,
    ]),
  ],
  controllers: [
    TenantController,
    ApiKeyController,
    WebhookController,
    ConfigController,
  ],
  providers: [
    TenantService,
    ApiKeyService,
    WebhookService,
    ConfigService,
    AuthService,
    NotificationService,
    EncryptionService,
    MessageQueueService,
    TenantRepository,
  ],
  exports: [
    TenantService,
    ApiKeyService,
    WebhookService,
    ConfigService,
  ],
})
export class TenantRoutesModule {}