// Mock Master Seed Script for Session 01
import { v4 as uuidv4 } from 'uuid';

export const masterSeed = {
  tenants: [
    {
      id: "00000000-0000-0000-0000-000000000000",
      name: "System",
      slug: "system",
      status: "active"
    },
    {
      id: uuidv4(),
      name: "Acme Corp",
      slug: "acme-corp",
      status: "active"
    }
  ],
  plans: [
    {
      id: uuidv4(),
      name: "Enterprise",
      priceMonthly: 999.00,
      limits: { maxConcurrentCalls: 50, recordingStorageGb: 500 }
    }
  ],
  phoneNumbers: [
    {
      e164: "+18005550199",
      provider: "twilio",
      tenantId: "acme-tenant-id-placeholder"
    }
  ]
};

console.log('Master Seed Data Generated for all 6 Databases.');
