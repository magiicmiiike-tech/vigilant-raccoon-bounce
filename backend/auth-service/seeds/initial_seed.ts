import { DataSource } from 'typeorm';
import { User } from '../src/entities/User';
import { Role } from '../src/entities/Role';
import { Permission } from '../src/entities/Permission';
import bcrypt from 'bcryptjs';

export const seedAuth = async (dataSource: DataSource) => {
  const permRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  // 1. Permissions
  const p1 = await permRepo.save(permRepo.create({ slug: 'users.read', description: 'Read users' }));
  const p2 = await permRepo.save(permRepo.create({ slug: 'users.write', description: 'Modify users' }));

  // 2. Roles
  const adminRole = await roleRepo.save(roleRepo.create({
    name: 'Super Admin',
    tenantId: '00000000-0000-0000-0000-000000000000', // System tenant
    permissions: [p1, p2]
  }));

  // 3. Users
  const passwordHash = await bcrypt.hash('password123', 10);
  await userRepo.save(userRepo.create({
    email: 'admin@dukat.ai',
    passwordHash,
    firstName: 'System',
    lastName: 'Admin',
    tenantId: '00000000-0000-0000-0000-000000000000',
    role: adminRole,
    isActive: true
  }));

  console.log('Auth Seed Completed');
};
