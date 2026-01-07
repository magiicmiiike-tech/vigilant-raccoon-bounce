import { Entity, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../shared/BaseEntity';
import { User } from './User';
import { Permission } from './Permission';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string;

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean;

  @OneToMany(() => User, (user: User) => user.role)
  users!: User[];

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions!: Permission[];
}