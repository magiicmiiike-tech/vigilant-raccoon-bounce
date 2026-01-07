import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../shared/BaseEntity';
import { Tenant } from './Tenant';

@Entity('api_keys')
@Index(['keyHash'], { unique: true })
@Index(['tenantId', 'name'])
export class ApiKey extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 512 })
  keyHash!: string;

  @Column({ type: 'varchar', length: 20, default: 'live' })
  environment!: 'live' | 'test' | 'development';

  @Column({ type: 'jsonb', default: [] })
  scopes!: string[];

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastUsedIp!: string;

  @Column({ type: 'boolean', default: false })
  isRevoked!: boolean;

  @ManyToOne(() => Tenant, (tenant: Tenant) => tenant.apiKeys, { onDelete: 'CASCADE' })
  tenant!: Tenant;
}