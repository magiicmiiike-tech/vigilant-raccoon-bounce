import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';
import { Call } from './Call';

@Entity('call_recordings')
@Index(['callId', 'startTime'])
export class CallRecording extends TenantEntity {
  @Column({ type: 'uuid' })
  callId!: string;

  @Column({ type: 'varchar', length: 255 })
  storageUrl!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  encryptionKeyId!: string;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime!: Date;

  @Column({ type: 'integer', nullable: true })
  durationSeconds!: number;

  @Column({ type: 'bigint', nullable: true })
  fileSizeBytes!: number;

  @Column({ type: 'varchar', length: 50 })
  format!: 'wav' | 'mp3' | 'ogg';

  @Column({ type: 'jsonb', default: {} })
  metadata!: {
    sampleRate?: number;
    channels?: number;
    bitRate?: number;
    codec?: string;
  };

  @Column({ type: 'boolean', default: false })
  isEncrypted!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transcriptionStatus!: 'pending' | 'processing' | 'completed' | 'failed';

  @ManyToOne(() => Call, (call: Call) => call.recordings, { onDelete: 'CASCADE' })
  call!: Call;
}