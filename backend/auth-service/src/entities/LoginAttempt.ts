import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('login_attempts')
@Index(['email', 'tenantId'])
@Index(['ipAddress'])
@Index(['createdAt'])
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'ip_address' })
  ipAddress!: string;

  @Column()
  successful!: boolean;

  @Column({ nullable: true })
  reason?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}