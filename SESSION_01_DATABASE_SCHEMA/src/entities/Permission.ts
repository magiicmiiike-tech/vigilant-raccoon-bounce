import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToMany } from 'typeorm';
import { Role } from './Role';

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

  @Column({ type: 'enum', enum: ['read', 'write', 'delete', 'manage'], nullable: false })
  scope!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[];
}