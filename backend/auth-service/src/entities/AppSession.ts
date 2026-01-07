import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from './Profile';
import { SessionStatus } from '../types/db.types';

@Entity('app_sessions')
@Index(['accessTokenHash'], { unique: true, where: '"deleted_at" IS NULL AND status = \'active\'' })
@Index(['profileId'], { where: '"deleted_at" IS NULL' })
@Index(['tenantId'], { where: '"deleted_at" IS NULL' })
@Index(['expiresAt'], { where: '"deleted_at" IS NULL AND status = \'active\'' })
@Index(['refreshExpiresAt'], { where: '"deleted_at" IS NULL AND status = \'active\'' })
@Index(['deletedAt'], { where: '"deleted_at" IS NULL' })
export class AppSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false, name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'uuid', nullable: false, name: 'profile_id' })
  profileId!: string;

  @Column({ type: 'varchar', length: 512, nullable: false, name: 'access_token_hash' })
  accessTokenHash!: string;

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'refresh_token_hash' })
  refreshTokenHash?: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'jsonb', default: {}, name: 'device_info' })
  deviceInfo!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'last_used_at' })
  lastUsedAt!: Date;

  @Column({ type: 'timestamptz', nullable: false, name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'refresh_expires_at' })
  refreshExpiresAt?: Date;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status!: SessionStatus;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToOne(() => Profile, (profile: Profile) => profile.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isRefreshExpired(): boolean {
    return this.refreshExpiresAt ? this.refreshExpiresAt < new Date() : true;
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date();
  }
}