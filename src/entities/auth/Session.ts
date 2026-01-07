import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';
import { User } from './User';

@Entity('sessions')
@Index(['tokenHash'], { unique: true })
@Index(['userId', 'expiresAt'])
export class Session extends TenantEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 512 })
  tokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string;

  @Column({ type: 'text', nullable: true })
  userAgent!: string;

  @Column({ type: 'jsonb', default: {} })
  deviceInfo!: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isRevoked!: boolean;

  @ManyToOne(() => User, (user: User) => user.sessions, { onDelete: 'CASCADE' })
  user!: User;
}