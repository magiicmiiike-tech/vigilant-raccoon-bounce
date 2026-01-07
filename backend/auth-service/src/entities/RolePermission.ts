import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './Role';
import { Permission } from './Permission';

@Entity('role_permissions')
@Index(['roleId'])
@Index(['permissionId'])
export class RolePermission {
  @PrimaryColumn({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'permission_id' })
  permissionId!: string;

  @Column({ type: 'boolean', default: true })
  granted!: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'assigned_at' })
  assignedAt!: Date;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_by' })
  assignedBy?: string;

  @ManyToOne(() => Role, (role: Role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Permission, (permission: Permission) => permission.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;
}