import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('usage_records')
export class UsageRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  type: 'voice_minutes' | 'transcription_minutes' | 'storage_gb';

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantity: number;

  @Column()
  timestamp: Date; // When the usage occurred
}
