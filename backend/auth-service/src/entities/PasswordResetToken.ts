import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('password_reset_tokens')
@Index(['token'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

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