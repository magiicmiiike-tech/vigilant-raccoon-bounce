import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { Tenant } from './Tenant';

@Entity('webhooks')
export class Webhook extends BaseEntity {
  @Column()
  url: string;

  @Column({ type: 'text', array: true })
  events: string[]; // e.g. ['call.completed', 'recording.ready']

  @Column({ nullable: true })
  secret: string; // Signing secret

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Tenant, tenant => tenant.webhooks)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  tenantId: string;
}
