import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';
import { Subscription } from './Subscription';

@Entity('usage_records')
@Index(['subscriptionId', 'timestamp'])
@Index(['tenantId', 'metricType', 'timestamp'])
export class UsageRecord extends TenantEntity {
  @Column({ type: 'uuid' })
  subscriptionId!: string;

  @Column({ type: 'varchar', length: 100 })
  metricType!: string; // e.g., 'call_minutes', 'api_requests', 'storage_gb'

  @Column({ type: 'numeric', precision: 10, scale: 4 })
  amount!: number;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Subscription, (subscription: Subscription) => subscription.usageRecords, { onDelete: 'CASCADE' })
  subscription!: Subscription;
}