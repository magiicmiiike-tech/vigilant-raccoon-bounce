import { Entity, Column, Index } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';

@Entity('call_metrics')
@Index(['tenantId', 'timestamp'])
@Index(['callId', 'timestamp'])
export class CallMetric extends TenantEntity {
  @Column({ type: 'uuid' })
  callId!: string;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'varchar', length: 100 })
  metricName!: string; // e.g., 'latency', 'jitter', 'packet_loss'

  @Column({ type: 'numeric', precision: 10, scale: 4 })
  metricValue!: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;
}