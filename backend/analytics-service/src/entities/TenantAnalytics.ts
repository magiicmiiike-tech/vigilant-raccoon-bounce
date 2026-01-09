import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('tenant_analytics')
export class TenantAnalytics extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'int', default: 0 })
  totalCalls: number;

  @Column({ type: 'int', default: 0 })
  totalMinutes: number;

  @Column({ type: 'int', default: 0 })
  failedCalls: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costEstimate: number;
}
