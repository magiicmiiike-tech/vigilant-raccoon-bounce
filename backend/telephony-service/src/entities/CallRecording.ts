import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { Call } from './Call';

@Entity('call_recordings')
export class CallRecording extends BaseEntity {
  @Column()
  url: string; // S3 URL

  @Column({ nullable: true })
  format: string; // mp3, wav

  @Column({ type: 'int', nullable: true })
  sizeBytes: number;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @OneToOne(() => Call, call => call.recording)
  @JoinColumn({ name: 'call_id' })
  call: Call;

  @Column({ type: 'uuid' })
  callId: string;
}
