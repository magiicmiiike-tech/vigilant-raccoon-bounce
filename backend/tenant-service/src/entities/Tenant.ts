import { Entity, Column, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { TenantConfig } from './TenantConfig';
import { ApiKey } from './ApiKey';
import { Webhook } from './Webhook';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ default: 'active' })
  status: 'active' | 'suspended' | 'archived';

  @Column({ nullable: true })
  contactEmail: string;

  @OneToOne(() => TenantConfig, config => config.tenant, { cascade: true })
  config: TenantConfig;

  @OneToMany(() => ApiKey, apiKey => apiKey.tenant)
  apiKeys: ApiKey[];

  @OneToMany(() => Webhook, webhook => webhook.tenant)
  webhooks: Webhook[];
}