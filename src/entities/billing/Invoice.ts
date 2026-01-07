import { Entity, Column, Index, ManyToOne, OneToMany } from 'typeorm';
import { TenantEntity } from '../shared/BaseEntity';
import { Subscription } from './Subscription';
import { InvoiceItem } from './InvoiceItem';

@Entity('invoices')
@Index(['tenantId', 'status'])
@Index(['stripeInvoiceId'], { unique: true, where: 'deleted_at IS NULL' })
export class Invoice extends TenantEntity {
  @Column({ type: 'uuid' })
  subscriptionId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeInvoiceId!: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

  @Column({ type: 'timestamptz' })
  invoiceDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate!: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amountDue!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  amountPaid!: number;

  @Column({ type: 'varchar', length: 3 })
  currency!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  invoicePdfUrl!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Subscription, (subscription: Subscription) => subscription.invoices, { onDelete: 'CASCADE' })
  subscription!: Subscription;

  @OneToMany(() => InvoiceItem, (item: InvoiceItem) => item.invoice)
  items!: InvoiceItem[];
}