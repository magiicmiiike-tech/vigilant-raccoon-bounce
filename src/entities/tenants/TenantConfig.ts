import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../shared/BaseEntity';
import { Tenant } from './Tenant';

@Entity('tenant_configs')
export class TenantConfig extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  tenantId!: string;

  @Column({ type: 'jsonb', default: {} })
  voiceSettings!: {
    defaultVoiceId?: string;
    speakingRate?: number;
    pitch?: number;
    volume?: number;
    emotion?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  agentSettings!: {
    personality?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    fallbackBehavior?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  telephonySettings!: {
    defaultCountryCode?: string;
    callRecordingEnabled?: boolean;
    callTranscriptionEnabled?: boolean;
    whisperDetectionEnabled?: boolean;
  };

  @Column({ type: 'jsonb', default: {} })
  integrationSettings!: {
    crmEnabled?: boolean;
    calendarEnabled?: boolean;
    webhookUrl?: string;
    webhookSecret?: string;
  };

  @OneToOne(() => Tenant, (tenant: Tenant) => tenant.config, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;
}