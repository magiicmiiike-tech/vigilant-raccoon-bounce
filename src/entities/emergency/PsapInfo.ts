import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../shared/BaseEntity';

@Entity('psap_info')
@Index(['name'])
@Index(['state', 'city'])
export class PsapInfo extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  zipCode!: string;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  latitude!: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  longitude!: number;

  @Column({ type: 'jsonb', default: {} })
  serviceArea!: Record<string, any>; // GeoJSON or similar

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;
}