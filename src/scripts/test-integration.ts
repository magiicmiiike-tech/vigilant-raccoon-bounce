import { authDataSource, tenantsDataSource } from '../config/typeorm.config';
import { User } from '../entities/auth/User';
import { Tenant } from '../entities/tenants/Tenant';
import { Role } from '../entities/auth/Role'; // Import Role entity
import * as bcrypt from 'bcrypt';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000002';

async function testMultiTenantIsolation() {
  try {
    // Initialize both data sources
    await Promise.all([authDataSource.initialize(), tenantsDataSource.initialize()]);
    
    const tenantRepo = tenantsDataSource.getRepository(Tenant);
    const userRepo = authDataSource.getRepository(User);
    const roleRepo = authDataSource.getRepository(Role);

    // Ensure roles exist for user creation
    let userRole = await roleRepo.findOne({ where: { name: 'user' } });
    if (!userRole) {
      userRole = roleRepo.create({ name: 'user', description: 'Regular user role', isSystem: true });
      await roleRepo.save(userRole);
    }

    // Create test tenants
    const tenant1 = tenantRepo.create({
      id: 'a0000000-0000-0000-0000-000000000001', // Unique ID for test
      name: 'Test Tenant 1',
      domain: 'test1.dukat.io',
      planTier: 'starter',
    });
    
    const tenant2 = tenantRepo.create({
      id: 'b0000000-0000-0000-0000-000000000001', // Unique ID for test
      name: 'Test Tenant 2',
      domain: 'test2.dukat.io',
      planTier: 'business',
    });
    
    await tenantRepo.save([tenant1, tenant2]);
    console.log('Created test tenants.');

    // Create users for each tenant
    const hashedPassword = await bcrypt.hash('Test123!', 12);

    const user1 = userRepo.create({
      tenantId: tenant1.id,
      email: 'user1@test1.dukat.io',
      passwordHash: hashedPassword,
      firstName: 'User',
      lastName: 'One',
      role: userRole,
    });
    
    const user2 = userRepo.create({
      tenantId: tenant2.id,
      email: 'user2@test2.dukat.io',
      passwordHash: hashedPassword,
      firstName: 'User',
      lastName: 'Two',
      role: userRole,
    });
    
    await userRepo.save([user1, user2]);
    console.log('Created test users.');

    // Test isolation: user1 should not see user2's data
    const tenant1Users = await userRepo.find({ where: { tenantId: tenant1.id } });
    const tenant2Users = await userRepo.find({ where: { tenantId: tenant2.id } });
    
    console.log(`Tenant 1 has ${tenant1Users.length} users`);
    console.log(`Tenant 2 has ${tenant2Users.length} users`);
    
    // Verify isolation
    const tenant1UserEmails = tenant1Users.map((u: User) => u.email);
    const tenant2UserEmails = tenant2Users.map((u: User) => u.email);
    
    const hasLeakage = tenant1UserEmails.some((email: string) => email.includes('test2')) ||
                       tenant2UserEmails.some((email: string) => email.includes('test1'));
    
    if (hasLeakage) {
      throw new Error('Data leakage detected between tenants!');
    }
    
    console.log('Multi-tenant isolation test passed');
    
    // Cleanup
    await userRepo.delete([user1.id, user2.id]);
    await tenantRepo.delete([tenant1.id, tenant2.id]);
    console.log('Cleaned up test data.');
    
    await Promise.all([authDataSource.destroy(), tenantsDataSource.destroy()]);
  } catch (error) {
    console.error('Integration test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testMultiTenantIsolation();
}