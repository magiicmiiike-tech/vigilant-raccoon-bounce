import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string; // URL-friendly identifier

  @Column({ nullable: true })
  domain: string;

  @Column({ default: 'active' })
  status: 'active' | 'suspended' | 'archived';

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>; // Flexible settings for voice, branding, etc.

  @Column({ nullable: true })
  contactEmail: string;
}
