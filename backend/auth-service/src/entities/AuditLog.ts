import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './Profile';
import { AuditOperation } from '../types/db.types';

@Entity('audit_logs')
@Index(['tableName', 'recordId'])
@Index(['changedAt'])
@Index(['changedBy'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: false, name: 'table_name' })
  tableName!: string;

  @Column({ type: 'uuid', nullable: false, name: 'record_id' })
  recordId!: string;

  @Column({
    type: 'enum',
    enum: AuditOperation,
    nullable: false,
  })
  operation!: AuditOperation;

  @Column({ type: 'jsonb', nullable: true, name: 'old_data' })
  oldData?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'new_data' })
  newData?: Record<string, any>;

  @Column({ type: 'uuid', nullable: true, name: 'changed_by' })
  changedBy?: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'changed_at' })
  changedAt!: Date;

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @ManyToOne(() => Profile, (profile: Profile) => profile.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by' })
  changedByProfile?: Profile;
}