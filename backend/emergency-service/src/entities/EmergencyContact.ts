import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('emergency_contacts')
export class EmergencyContact extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  name: string;

  @Column()
  phoneNumber: string;

  @Column()
  relation: string; // e.g. 'security_desk', 'facility_manager'

  @Column({ default: 1 })
  priority: number; // 1 = First to call
}
