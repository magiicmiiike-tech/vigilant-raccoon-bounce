import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { Call } from './Call';

@Entity('call_transcripts')
export class CallTranscript extends BaseEntity {
  @Column({ type: 'text' })
  content: string; // Full text

  @Column({ type: 'jsonb', nullable: true })
  segments: any[]; // Detailed segments with timestamps

  @Column({ nullable: true })
  modelUsed: string; // e.g., 'deepgram-nova-2'

  @OneToOne(() => Call, call => call.transcript)
  @JoinColumn({ name: 'call_id' })
  call: Call;

  @Column({ type: 'uuid' })
  callId: string;
}
