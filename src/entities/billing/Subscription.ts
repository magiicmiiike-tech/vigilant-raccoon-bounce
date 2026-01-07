import { Entity, Column, Index, ManyToOne, OneToMany } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';
import { Plan } from './Plan';
import { Invoice } from './Invoice';
import { UsageRecord } from './UsageRecord';

@Entity('subscriptions')
@Index(['tenantId', 'status'])
@Index(['stripeSubscriptionId'], { unique: true, where: 'deleted_at IS NULL' })
export class Subscription extends TenantEntity {
  @Column({ type: 'uuid' })
  planId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeSubscriptionId: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  currentPeriodStart: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  currentPeriodEnd: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  plan: Plan;

  @OneToMany(() => Invoice, (invoice) => invoice.subscription)
  invoices: Invoice[];

  @OneToMany(() => UsageRecord, (usageRecord) => usageRecord.subscription)
  usageRecords: UsageRecord[];
}