import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '../shared/BaseEntity';
import { Role } from './Role';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string;

  @ManyToMany(() => Role, (role: Role) => role.permissions)
  roles!: Role[];
}