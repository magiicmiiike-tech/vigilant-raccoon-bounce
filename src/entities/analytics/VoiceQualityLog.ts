import { Entity, Column, Index } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';

@Entity('voice_quality_logs')
@Index(['tenantId', 'timestamp'])
@Index(['callId', 'timestamp'])
export class VoiceQualityLog extends TenantEntity {
  @Column({ type: 'uuid' })
  callId: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  mosScore: number; // Mean Opinion Score

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  latencyMs: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  jitterMs: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  packetLoss: number; // Percentage

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}