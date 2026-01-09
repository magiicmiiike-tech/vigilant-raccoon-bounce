import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';
import { Role } from './Role';
import { Session } from './Session';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'uuid' })
  tenantId: string; // Multi-tenancy key

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ nullable: true, type: 'uuid' })
  roleId: string;

  @OneToMany(() => Session, session => session.user)
  sessions: Session[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}
