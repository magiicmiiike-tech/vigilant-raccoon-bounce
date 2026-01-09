import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { Plan } from './Plan';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ default: 'active' })
  status: 'active' | 'canceled' | 'past_due' | 'trialing';

  @Column()
  currentPeriodStart: Date;

  @Column()
  currentPeriodEnd: Date;

  @Column({ nullable: true })
  stripeSubscriptionId: string;
}
