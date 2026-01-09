# Session 01 Testing Checklist

## 1. Database Connectivity
- [ ] Verify connection to PostgreSQL for Auth Service
- [ ] Verify connection to PostgreSQL for Tenant Service
- [ ] Verify connection to PostgreSQL for Telephony Service
- [ ] Verify connection to PostgreSQL for Billing Service
- [ ] Verify connection to PostgreSQL for Analytics Service
- [ ] Verify connection to PostgreSQL for Emergency Service

## 2. Schema Validation
- [ ] Run `typeorm schema:sync` (dev) or migrations and ensure no errors.
- [ ] Check `users` table has `tenant_id` column.
- [ ] Check `calls` table has `provider_call_id` column.
- [ ] Verify Foreign Key constraints exist on `users.role_id`.

## 3. Seeding
- [ ] Run `npm run seed` in Auth Service.
- [ ] Verify `admin@dukat.ai` exists in `users` table.
- [ ] Verify 'Super Admin' role exists.

## 4. Entity Logic
- [ ] Attempt to create a user with duplicate email (should fail).
- [ ] Attempt to create a tenant with duplicate slug (should fail).
- [ ] Check that `created_at` is automatically populated.

## 5. Relationships
- [ ] Fetch User with Role relation.
- [ ] Fetch Tenant with Config relation.
