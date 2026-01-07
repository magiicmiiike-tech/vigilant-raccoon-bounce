import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToMany,
} from 'typeorm';
import { Role } from './Role';
import { PermissionScope } from '../types/db.types';

@Entity('permissions')
@Index(['resource', 'action', 'scope'], { unique: true })
@Index(['resource'])
@Index(['action'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  resource!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  action!: string;

  @Column({
    type: 'enum',
    enum: PermissionScope,
    nullable: false,
  })
  scope!: PermissionScope;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Role, (role: Role) => role.permissions)
  roles!: Role[];
}