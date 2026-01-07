import { Entity, Column, Index } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';

@Entity('phone_numbers')
@Index(['tenantId', 'number'], { unique: true, where: 'deleted_at IS NULL' })
export class PhoneNumber extends TenantEntity {
  @Column({ type: 'varchar', length: 20 })
  number!: string;

  @Column({ type: 'varchar', length: 50, default: 'available' })
  status!: 'available' | 'assigned' | 'porting' | 'released';

  @Column({ type: 'varchar', length: 10, nullable: true })
  countryCode!: string;

  @Column({ type: 'jsonb', default: {} })
  capabilities!: {
    sms?: boolean;
    voice?: boolean;
    mms?: boolean;
    fax?: boolean;
  };

  @Column({ type: 'uuid', nullable: true })
  assignedToUserId!: string; // Optional: if a number is assigned to a specific user

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;
}