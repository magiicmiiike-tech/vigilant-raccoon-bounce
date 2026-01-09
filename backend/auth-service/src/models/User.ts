import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../shared/models/BaseEntity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  AGENT = 'agent',
  USER = 'user'
}

@Entity('users')
export class User extends BaseEntity {
  @Column()
  @Index()
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ nullable: true })
  tenantId: string; // Foreign key to Tenant service (logical link)

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;
}
