import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './Profile'; // Changed from User to Profile

@Entity('password_reset_tokens')
@Index(['token'], { unique: true })
@Index(['profileId']) // Changed from userId to profileId
@Index(['expiresAt'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ name: 'profile_id' }) // Changed from user_id to profile_id
  profileId!: string; // Changed from userId to profileId

  @ManyToOne(() => Profile, (profile: Profile) => profile.passwordResetTokens, { onDelete: 'CASCADE' }) // Changed from User to Profile
  @JoinColumn({ name: 'profile_id' }) // Changed from user_id to profile_id
  profile!: Profile; // Changed from user to profile

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'used_at', nullable: true })
  usedAt?: Date;

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isValid(): boolean {
    return !this.used && !this.isExpired();
  }

  markAsUsed(): void {
    this.used = true;
    this.usedAt = new Date();
  }
}