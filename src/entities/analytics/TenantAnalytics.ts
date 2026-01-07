import { Entity, Column, Index } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';

@Entity('tenant_analytics')
@Index(['tenantId', 'date'])
export class TenantAnalytics extends TenantEntity {
  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'integer', default: 0 })
  totalCalls: number;

  @Column({ type: 'integer', default: 0 })
  totalMinutes: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column({ type: 'jsonb', default: {} })
  callStatusDistribution: Record<string, number>; // e.g., { 'completed': 100, 'failed': 5 }

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}