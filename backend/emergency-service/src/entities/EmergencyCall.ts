import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('emergency_calls')
export class EmergencyCall extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  originalCallId: string; // Link to telephony call

  @Column()
  callerNumber: string;

  @Column({ type: 'jsonb' })
  locationData: {
    latitude?: number;
    longitude?: number;
    address?: string;
    confidence?: number;
  };

  @Column()
  psapId: string; // Public Safety Answering Point ID

  @Column()
  status: 'routing' | 'connected' | 'completed' | 'failed';

  @Column({ nullable: true })
  recordingUrl: string;
}
