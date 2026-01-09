import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('plans')
export class Plan extends BaseEntity {
  @Column({ unique: true })
  name: string; // 'starter', 'enterprise'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceMonthly: number;

  @Column({ type: 'jsonb' })
  limits: {
    maxUsers: number;
    maxConcurrentCalls: number;
    recordingStorageGb: number;
  };

  @Column({ nullable: true })
  stripePriceId: string;
}
