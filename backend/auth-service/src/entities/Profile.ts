import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserStatus, RoleType } from '../types/db.types'; // Import RoleType from db.types.ts
import { AppSession } from './AppSession';
import { Role } from './Role';
import { AuditLog } from './AuditLog';
import { PasswordResetToken } from './PasswordResetToken';
import { ApiKey } from './ApiKey';

@Entity('profiles')
@Index(['tenantId', 'email'], { unique: true, where: '"deleted_at" IS NULL' })
@Index(['tenantId', 'status'], { where: '"deleted_at" IS NULL' })
@Index(['deletedAt'], { where: '"deleted_at" IS NULL' })
@Index(['createdAt'])
@Index(['tenantId'])
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false, name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email!: string;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_verification_token' })
  emailVerificationToken?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'email_verification_sent_at' })
  emailVerificationSentAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'password_hash' })
  @Exclude()
  passwordHash!: string;

  @Column({ type: 'boolean', default: false, name: 'mfa_enabled' })
  mfaEnabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'mfa_secret' })
  @Exclude()
  mfaSecret?: string;

  @Column({ type: 'simple-array', nullable: true, name: 'mfa_backup_codes' })
  mfaBackupCodes?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
  lastName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'locked_until' })
  lockedUntil?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @Column({ type: 'inet', nullable: true, name: 'last_login_ip' })
  lastLoginIp?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'password_changed_at' })
  passwordChangedAt!: Date;

  @Column({ type: 'simple-array', default: [], name: 'password_history' })
  passwordHistory!: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updatedBy?: string;

  @OneToMany(() => AppSession, (session: AppSession) => session.profile)
  sessions!: AppSession[];

  @OneToMany(() => AuditLog, (auditLog: AuditLog) => auditLog.changedByProfile)
  auditLogs!: AuditLog[];

  @OneToMany(() => PasswordResetToken, (token: PasswordResetToken) => token.profile)
  passwordResetTokens!: PasswordResetToken[];

  @OneToMany(() => ApiKey, (apiKey: ApiKey) => apiKey.profile)
  apiKeys!: ApiKey[];

  @ManyToMany(() => Role, (role: Role) => role.profiles)
  @JoinTable({
    name: 'profile_roles',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    if (!this.email) {
      throw new Error('Email is required');
    }
    if (!this.tenantId) {
      throw new Error('Tenant ID is required');
    }
  }

  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  lockAccount(minutes: number = 15): void {
    const lockTime = new Date();
    lockTime.setMinutes(lockTime.getMinutes() + minutes);
    this.lockedUntil = lockTime;
    this.status = UserStatus.LOCKED;
  }

  unlockAccount(): void {
    this.lockedUntil = undefined;
    this.failedLoginAttempts = 0;
    this.status = UserStatus.ACTIVE;
  }

  recordFailedAttempt(): void {
    this.failedLoginAttempts++;
    if (this.failedLoginAttempts >= 5) { // Assuming 5 attempts before lock
      this.lockAccount();
    }
  }

  recordSuccessfulLogin(): void {
    this.lastLoginAt = new Date();
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
    this.status = UserStatus.ACTIVE;
  }
}