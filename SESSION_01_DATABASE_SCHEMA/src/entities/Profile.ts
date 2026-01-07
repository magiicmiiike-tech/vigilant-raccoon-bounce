import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Session } from './Session';
import { Role } from './Role';

@Entity('profiles')
@Index(['tenantId', 'email'], { unique: true, where: '"deleted_at" IS NULL' })
@Index(['tenantId', 'status'], { where: '"deleted_at" IS NULL' })
@Index(['deletedAt'], { where: '"deleted_at" IS NULL' })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email!: string;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationSentAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: false })
  passwordHash!: string;

  @Column({ type: 'boolean', default: false })
  mfaEnabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfaSecret?: string;

  @Column({ type: 'simple-array', nullable: true })
  mfaBackupCodes?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'enum', enum: ['active', 'suspended', 'locked', 'inactive'], default: 'active' })
  status!: string;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'inet', nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  passwordChangedAt!: Date;

  @Column({ type: 'simple-array', default: [] })
  passwordHistory!: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @OneToMany(() => Session, session => session.profile)
  sessions!: Session[];

  @ManyToMany(() => Role, role => role.profiles)
  @JoinTable({
    name: 'profile_roles',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];
}