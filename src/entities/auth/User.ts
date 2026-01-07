import { Entity, Column, Index, ManyToOne, OneToMany } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';
import { Role } from './Role';
import { Session } from './Session';
import { Permission } from './Permission'; // Assuming Permission entity exists

@Entity('users')
@Index(['tenantId', 'email'], { unique: true, where: 'deleted_at IS NULL' })
export class User extends TenantEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName!: string;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  mfaEnabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfaSecret!: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Role, (role: Role) => role.users)
  role!: Role;

  @OneToMany(() => Session, (session: Session) => session.user)
  sessions!: Session[];

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'suspended' | 'locked' | 'inactive';
}