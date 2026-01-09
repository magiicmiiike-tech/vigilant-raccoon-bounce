import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('call_metrics')
export class CallMetric extends BaseEntity {
  @Column({ type: 'uuid' })
  callId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'float' })
  jitter: number;

  @Column({ type: 'float' })
  latency: number; // RTT

  @Column({ type: 'float' })
  packetLoss: number;

  @Column({ type: 'float', nullable: true })
  mosScore: number; // Mean Opinion Score (1-5)

  @Column({ type: 'jsonb', nullable: true })
  timeline: any[]; // Series of events/metrics
}
