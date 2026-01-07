import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToMany,
  JoinTable, // Added JoinTable import
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from './Profile';
import { Permission } from './Permission';
import { RoleType } from '../types/db.types';

@Entity('roles')
@Index(['tenantId'], { where: '"deleted_at" IS NULL' })
@Index(['isSystem'], { where: '"deleted_at" IS NULL' })
@Index(['tenantId', 'name'], { unique: true, where: '"deleted_at" IS NULL AND "tenant_id" IS NOT NULL' })
@Index(['name'], { unique: true, where: '"deleted_at" IS NULL AND "tenant_id" IS NULL AND "is_system" = TRUE' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: RoleType; // Using RoleType enum

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false, name: 'is_system' })
  isSystem!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault!: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToMany(() => Profile, (profile: Profile) => profile.roles)
  profiles!: Profile[];

  @ManyToMany(() => Permission, (permission: Permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions!: Permission[];
}