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
import { User } from './User';

@Entity('api_keys')
@Index(['key'], { unique: true })
@Index(['userId'])
@Index(['tenantId'])
@Index(['expiresAt'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

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

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateKey() {
    if (!this.key) {
      this.key = require('crypto').randomBytes(32).toString('hex');
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