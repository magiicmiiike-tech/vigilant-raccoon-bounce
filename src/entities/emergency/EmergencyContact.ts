import { Entity, Column, Index } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';

@Entity('emergency_contacts')
@Index(['tenantId', 'userId'])
export class EmergencyContact extends TenantEntity {
  @Column({ type: 'uuid' })
  userId: string; // User who owns this contact

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, default: 'primary' })
  relationship: string; // e.g., 'primary', 'secondary', 'family'

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}