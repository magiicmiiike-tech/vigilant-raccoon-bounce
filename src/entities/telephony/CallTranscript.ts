import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';
import { Call } from './Call';

@Entity('call_transcripts')
@Index(['callId'])
export class CallTranscript extends TenantEntity {
  @Column({ type: 'uuid' })
  callId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', default: [] })
  speakerDiarization!: { speaker: string; start: number; end: number; text: string }[];

  @Column({ type: 'varchar', length: 10, nullable: true })
  language!: string;

  @Column({ type: 'vector', dimensions: 1536, nullable: true }) // Assuming OpenAI embeddings
  embedding!: number[];

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Call, (call: Call) => call.transcripts, { onDelete: 'CASCADE' })
  call!: Call;
}