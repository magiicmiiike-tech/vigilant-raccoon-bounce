import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('sessions')
@Index(['userId'])
@Index(['refreshToken'], { unique: true })
@Index(['expiresAt'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'refresh_token', unique: true })
  refreshToken!: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'device_type', nullable: true })
  deviceType?: string;

  @Column({ name: 'os', nullable: true })
  os?: string;

  @Column({ name: 'browser', nullable: true })
  browser?: string;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @Column({ name: 'last_active_at' })
  lastActiveAt!: Date;

  @Column({ default: true })
  isValid!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  updateLastActive(): void {
    this.lastActiveAt = new Date();
  }
}