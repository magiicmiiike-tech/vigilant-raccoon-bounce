import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Profile } from './Profile';

@Entity('app_sessions')
@Index(['accessTokenHash'], { unique: true, where: '"deleted_at" IS NULL AND status = \'active\'' })
@Index(['profileId'], { where: '"deleted_at" IS NULL' })
@Index(['tenantId'], { where: '"deleted_at" IS NULL' })
@Index(['expiresAt'], { where: '"deleted_at" IS NULL AND status = \'active\'' })
@Index(['refreshExpiresAt'], { where: '"deleted_at" IS NULL AND status = \'active\'' })
@Index(['deletedAt'], { where: '"deleted_at" IS NULL' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  tenantId!: string;

  @Column({ type: 'uuid', nullable: false })
  profileId!: string;

  @Column({ type: 'varchar', length: 512, nullable: false })
  accessTokenHash!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  refreshTokenHash?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'jsonb', default: {} })
  deviceInfo!: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastUsedAt!: Date;

  @Column({ type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  refreshExpiresAt?: Date;

  @Column({ type: 'enum', enum: ['active', 'expired', 'revoked'], default: 'active' })
  status!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Profile, profile => profile.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;
}