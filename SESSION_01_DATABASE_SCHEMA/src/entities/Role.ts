import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToMany } from 'typeorm';
import { Profile } from './Profile';

@Entity('roles')
@Index(['tenantId', 'name'], { unique: true, where: '"deleted_at" IS NULL AND "tenant_id" IS NOT NULL' })
@Index(['name'], { unique: true, where: '"deleted_at" IS NULL AND "tenant_id" IS NULL AND "is_system" = TRUE' })
@Index(['tenantId'], { where: '"deleted_at" IS NULL' })
@Index(['isSystem'], { where: '"deleted_at" IS NULL' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @ManyToMany(() => Profile, profile => profile.roles)
  profiles!: Profile[];
}