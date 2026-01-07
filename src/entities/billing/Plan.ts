import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../shared/BaseEntity';
import { Subscription } from './Subscription';

@Entity('plans')
@Index(['name'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['stripeProductId'], { unique: true, where: 'deleted_at IS NULL' })
export class Plan extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeProductId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripePriceId: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar', length: 20 })
  interval: 'month' | 'year';

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, any>; // e.g., { maxCalls: 1000, voiceCloning: true }

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}