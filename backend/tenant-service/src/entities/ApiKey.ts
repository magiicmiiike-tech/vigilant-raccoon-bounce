import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { Tenant } from './Tenant';

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Column()
  name: string;

  @Column({ select: false }) // Store hash, not plain key
  keyHash: string;

  @Column()
  prefix: string; // To display to user (e.g. sk_live_...)

  @Column({ type: 'text', array: true, default: [] })
  scopes: string[];

  @Column({ nullable: true })
  expiresAt: Date;

  @ManyToOne(() => Tenant, tenant => tenant.apiKeys)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  tenantId: string;
}
