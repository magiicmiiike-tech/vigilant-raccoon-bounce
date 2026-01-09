import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('phone_numbers')
export class PhoneNumber extends BaseEntity {
  @Column({ unique: true })
  e164: string; // +15551234567

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  provider: 'twilio' | 'bandwidth' | 'telnyx';

  @Column({ nullable: true })
  providerSid: string;

  @Column({ nullable: true })
  friendlyName: string;

  @Column({ type: 'jsonb', default: {} })
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
}
