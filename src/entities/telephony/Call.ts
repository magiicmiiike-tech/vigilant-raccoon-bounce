import { Entity, Column, Index, OneToMany, ManyToOne } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';
import { CallRecording } from './CallRecording';
import { CallTranscript } from './CallTranscript';

@Entity('calls')
@Index(['tenantId', 'startTime'])
@Index(['callSid'], { unique: true })
@Index(['fromNumber', 'direction'])
export class Call extends TenantEntity {
  @Column({ type: 'varchar', length: 100 })
  callSid!: string; // Unique ID from telephony provider

  @Column({ type: 'uuid', nullable: true })
  userId!: string; // User who initiated/received the call

  @Column({ type: 'varchar', length: 20 })
  direction!: 'inbound' | 'outbound';

  @Column({ type: 'varchar', length: 50 })
  status!: 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no_answer';

  @Column({ type: 'varchar', length: 20 })
  fromNumber!: string;

  @Column({ type: 'varchar', length: 20 })
  toNumber!: string;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  answerTime!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime!: Date;

  @Column({ type: 'integer', nullable: true })
  durationSeconds!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sipTrunkId!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: {
    callerName?: string;
    callerLocation?: string;
    dialedNumber?: string;
    sipHeaders?: Record<string, string>;
  };

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  cost!: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency!: string;

  @OneToMany(() => CallRecording, (recording: CallRecording) => recording.call)
  recordings!: CallRecording[];

  @OneToMany(() => CallTranscript, (transcript: CallTranscript) => transcript.call)
  transcripts!: CallTranscript[];

  // Computed properties (not stored in DB)
  get isActive(): boolean {
    return this.status === 'ringing' || this.status === 'answered';
  }
}