import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column()
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';

  @Column({ nullable: true })
  stripeInvoiceId: string;

  @Column({ nullable: true })
  paidAt: Date;
}
