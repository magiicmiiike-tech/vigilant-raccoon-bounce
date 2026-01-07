import { Entity, Column, Index } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';

@Entity('emergency_calls')
@Index(['tenantId', 'callTime'])
@Index(['e911CallId'], { unique: true, where: 'deleted_at IS NULL' })
export class EmergencyCall extends TenantEntity {
  @Column({ type: 'varchar', length: 100 })
  e911CallId!: string; // Unique ID from E911 provider

  @Column({ type: 'uuid', nullable: true })
  originalCallId!: string; // Reference to the call in telephony DB

  @Column({ type: 'timestamptz' })
  callTime!: Date;

  @Column({ type: 'varchar', length: 20 })
  fromNumber!: string;

  @Column({ type: 'varchar', length: 20 })
  toNumber!: string; // PSAP number

  @Column({ type: 'varchar', length: 255, nullable: true })
  callerName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  locationAddress!: string;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  latitude!: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  longitude!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  psapId!: string; // Reference to PSAP info

  @Column({ type: 'varchar', length: 50, default: 'initiated' })
  status!: 'initiated' | 'routed' | 'answered' | 'completed' | 'failed';

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;
}