import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Profile } from './Profile'; // Changed from User to Profile
import * as crypto from 'crypto'; // Changed to import * as crypto

@Entity('api_keys')
@Index(['key'], { unique: true })
@Index(['profileId']) // Changed from userId to profileId
@Index(['tenantId'])
@Index(['expiresAt'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ name: 'profile_id', nullable: true }) // Changed from user_id to profile_id
  profileId?: string; // Changed from userId to profileId

  @ManyToOne(() => Profile, (profile: Profile) => profile.apiKeys, { nullable: true, onDelete: 'CASCADE' }) // Changed from User to Profile
  @JoinColumn({ name: 'profile_id' }) // Changed from user_id to profile_id
  profile?: Profile; // Changed from user to profile

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  name!: string;

  @Column('text', { array: true })
  scopes!: string[];

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt?: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @Column({ default: true, name: 'is_active' }) // Added name for consistency
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateKey() {
    if (!this.key) {
      this.key = crypto.randomBytes(32).toString('hex');
    }
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.isActive && this.expiresAt < new Date();
  }

  canUse(): boolean {
    return this.isActive && !this.isExpired();
  }

  recordUsage(): void {
    this.lastUsedAt = new Date();
  }
}