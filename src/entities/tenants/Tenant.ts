import { Entity, Column, Index, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../shared/BaseEntity';
import { TenantConfig } from './TenantConfig';
import { ApiKey } from './ApiKey';

@Entity('tenants')
@Index(['domain'], { unique: true })
@Index(['status', 'createdAt'])
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  domain: string;

  @Column({ type: 'varchar', length: 50, default: 'starter' })
  planTier: 'starter' | 'business' | 'enterprise';

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'suspended' | 'pending' | 'inactive';

  @Column({ type: 'jsonb', default: {} })
  settings: {
    timezone?: string;
    locale?: string;
    currency?: string;
    branding?: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionEndsAt: Date;

  @OneToOne(() => TenantConfig, (config) => config.tenant)
  config: TenantConfig;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.tenant)
  apiKeys: ApiKey[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}