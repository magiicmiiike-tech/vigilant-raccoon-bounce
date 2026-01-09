import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('voice_quality_logs')
export class VoiceQualityLog extends BaseEntity {
  @Column({ type: 'uuid' })
  callId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'text' })
  issueType: 'echo' | 'silence' | 'robotic' | 'noise';

  @Column({ type: 'float' })
  severity: number; // 0-1

  @Column()
  timestamp: Date;
}
