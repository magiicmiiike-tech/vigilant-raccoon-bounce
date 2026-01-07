import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Profile } from './Profile';
import { Role } from './Role';

@Entity('profile_roles')
@Index(['profileId'])
@Index(['roleId'])
export class ProfileRole {
  @PrimaryColumn({ type: 'uuid', name: 'profile_id' })
  profileId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', name: 'assigned_at' })
  assignedAt!: Date;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_by' })
  assignedBy?: string;

  @ManyToOne(() => Profile, (profile: Profile) => profile.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  @ManyToOne(() => Role, (role: Role) => role.profiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}