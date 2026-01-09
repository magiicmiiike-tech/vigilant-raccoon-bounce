import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  slug: string; // e.g., 'calls.create'

  @Column()
  description: string;

  @Column({ default: 'system' })
  scope: 'system' | 'tenant';
}
