import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../types/auth.types';

@Entity('users')
@Index(['email', 'tenantId'], { unique: true })
@Index(['tenantId'])
@Index(['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column()
  @Exclude()
  password!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ name: 'mfa_secret', nullable: true })
  @Exclude()
  mfaSecret?: string;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled!: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'account_locked_until', nullable: true })
  accountLockedUntil?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

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
    if (!this.accountLockedUntil) return false;
    return this.accountLockedUntil > new Date();
  }

  lockAccount(minutes: number = 15): void {
    const lockTime = new Date();
    lockTime.setMinutes(lockTime.getMinutes() + minutes);
    this.accountLockedUntil = lockTime;
  }

  unlockAccount(): void {
    this.accountLockedUntil = null;
    this.failedLoginAttempts = 0;
  }

  recordFailedAttempt(): void {
    this.failedLoginAttempts++;
    if (this.failedLoginAttempts >= 5) {
      this.lockAccount();
    }
  }

  recordSuccessfulLogin(): void {
    this.lastLoginAt = new Date();
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
  }
}