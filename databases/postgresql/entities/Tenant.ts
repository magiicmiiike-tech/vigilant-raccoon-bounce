import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, Index } from 'typeorm';
// Importing from backend/shared path since it's common in this monorepo
import { BaseEntity } from '../../../backend/shared/models/BaseEntity';

@Entity('tenants')
@Index(['externalId'], { unique: true })
@Index(['domain'], { unique: true })
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  externalId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain!: string | null;

  @Column({ type: 'enum', enum: ['starter', 'business', 'enterprise'], default: 'starter' })
  tier!: 'starter' | 'business' | 'enterprise';

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billingEmail!: string | null;

  @Column({ type: 'int', default: 10 })
  maxUsers!: number;

  @Column({ type: 'int', default: 10 })
  maxConcurrentCalls!: number;

  @Column({ type: 'int', default: 10 })
  maxStorageGb!: number;

  @Column({ type: 'int', default: 1 })
  voiceClonesAllowed!: number;

  @Column({ type: 'boolean', default: false })
  requiresHipaa!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresGdpr!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresPci!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeCustomerId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeSubscriptionId!: string | null;

  @Column({ type: 'int', default: 90 })
  monthlyRetentionDays!: number;

  @Column({ type: 'enum', enum: ['active', 'suspended', 'terminated'], default: 'active' })
  status!: 'active' | 'suspended' | 'terminated';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
