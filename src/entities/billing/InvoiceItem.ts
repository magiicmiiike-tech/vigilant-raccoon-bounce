import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../shared/BaseEntity';
import { Invoice } from './Invoice';

@Entity('invoice_items')
@Index(['invoiceId'])
export class InvoiceItem extends BaseEntity {
  @Column({ type: 'uuid' })
  invoiceId!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  unitAmount!: number;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @ManyToOne(() => Invoice, (invoice: Invoice) => invoice.items, { onDelete: 'CASCADE' })
  invoice!: Invoice;
}