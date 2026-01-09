import { Entity, Column, OneToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { CallRecording } from './CallRecording';
import { CallTranscript } from './CallTranscript';

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BUSY = 'busy'
}

@Entity('calls')
export class Call extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  direction: 'inbound' | 'outbound';

  @Column()
  fromNumber: string;

  @Column()
  toNumber: string;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.INITIATED })
  status: CallStatus;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ nullable: true })
  providerCallId: string; // Twilio/LiveKit SID

  @OneToOne(() => CallRecording, recording => recording.call)
  recording: CallRecording;

  @OneToOne(() => CallTranscript, transcript => transcript.call)
  transcript: CallTranscript;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>; // Custom data, context
}
