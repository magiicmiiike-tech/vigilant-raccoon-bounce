import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { Tenant } from './Tenant';

@Entity('tenant_configs')
export class TenantConfig extends BaseEntity {
  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  branding: Record<string, any>; // Logo, colors

  @Column({ type: 'jsonb', default: {} })
  voiceSettings: Record<string, any>; // Default voice ID, speed, etc.

  @OneToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  tenantId: string;
}
