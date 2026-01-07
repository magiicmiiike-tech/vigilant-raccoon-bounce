import { authDataSource, tenantsDataSource, telephonyDataSource, billingDataSource, analyticsDataSource, emergencyDataSource } from '../config/typeorm.config';
import { User } from '../entities/auth/User';
import { Role } from '../entities/auth/Role';
import { Tenant } from '../entities/tenants/Tenant';
import { TenantConfig } from '../entities/tenants/TenantConfig';
import { ApiKey } from '../entities/tenants/ApiKey';
import { Call } from '../entities/telephony/Call';
import { CallRecording } from '../entities/telephony/CallRecording';
import { CallTranscript } from '../entities/telephony/CallTranscript';
import { PhoneNumber } from '../entities/telephony/PhoneNumber';
import { Plan } from '../entities/billing/Plan';
import { Subscription } from '../entities/billing/Subscription';
import { Invoice } from '../entities/billing/Invoice';
import { UsageRecord } from '../entities/billing/UsageRecord';
import { CallMetric } from '../entities/analytics/CallMetric';
import { VoiceQualityLog } from '../entities/analytics/VoiceQualityLog';
import { TenantAnalytics } from '../entities/analytics/TenantAnalytics';
import { EmergencyCall } from '../entities/emergency/EmergencyCall';
import { EmergencyContact } from '../entities/emergency/EmergencyContact';
import { PsapInfo } from '../entities/emergency/PsapInfo';
import * as bcrypt from 'bcrypt';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000002';
const TEST_CALL_ID = '00000000-0000-0000-0000-000000000003';
const TEST_PLAN_ID = '00000000-0000-0000-0000-000000000004';
const TEST_PSAP_ID = '00000000-0000-0000-0000-000000000005';

async function seedAuthDatabase() {
  try {
    await authDataSource.initialize();
    console.log('Auth database connected');

    const roleRepository = authDataSource.getRepository(Role);
    const userRepository = authDataSource.getRepository(User);

    // Create default roles if they don't exist
    const rolesToCreate = ['super_admin', 'tenant_admin', 'user', 'agent', 'viewer'];
    for (const roleName of rolesToCreate) {
      const existingRole = await roleRepository.findOne({ where: { name: roleName } });
      if (!existingRole) {
        const role = roleRepository.create({
          name: roleName,
          description: `${roleName} role`,
          isSystem: true,
        });
        await roleRepository.save(role);
        console.log(`Created role: ${roleName}`);
      }
    }

    // Create admin user
    const adminUser = await userRepository.findOne({ where: { id: ADMIN_USER_ID } });
    if (!adminUser) {
      const superAdminRole = await roleRepository.findOne({ where: { name: 'super_admin' } });
      if (!superAdminRole) {
        throw new Error('Super admin role not found, cannot create admin user.');
      }
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      const user = userRepository.create({
        id: ADMIN_USER_ID,
        tenantId: DEFAULT_TENANT_ID,
        email: 'admin@dukat.io',
        passwordHash: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true,
        role: superAdminRole,
        status: 'active',
      });
      await userRepository.save(user);
      console.log('Created admin user: admin@dukat.io');
    }

    console.log('Auth database seeding completed');
  } catch (error) {
    console.error('Error seeding auth database:', error);
    throw error;
  } finally {
    if (authDataSource.isInitialized) {
      await authDataSource.destroy();
    }
  }
}

async function seedTenantsDatabase() {
  try {
    await tenantsDataSource.initialize();
    console.log('Tenants database connected');

    const tenantRepository = tenantsDataSource.getRepository(Tenant);
    const tenantConfigRepository = tenantsDataSource.getRepository(TenantConfig);
    const apiKeyRepository = tenantsDataSource.getRepository(ApiKey);

    // Create default tenant
    const defaultTenant = await tenantRepository.findOne({ where: { id: DEFAULT_TENANT_ID } });
    if (!defaultTenant) {
      const tenant = tenantRepository.create({
        id: DEFAULT_TENANT_ID,
        name: 'Development Tenant',
        domain: 'dev.dukat.io',
        planTier: 'enterprise',
        status: 'active',
        settings: {
          timezone: 'America/New_York',
          locale: 'en-US',
          currency: 'USD',
        },
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      await tenantRepository.save(tenant);
      console.log('Created default tenant: Development Tenant');

      // Create default tenant config
      const config = tenantConfigRepository.create({
        tenantId: tenant.id,
        voiceSettings: { defaultVoiceId: 'en-US-Wavenet-D' },
        agentSettings: { personality: 'helpful', temperature: 0.7 },
      });
      await tenantConfigRepository.save(config);
      console.log('Created default tenant config');

      // Create a sample API key
      const apiKeyHash = await bcrypt.hash('dev_api_key_123', 12); // Hash a sample key
      const apiKey = apiKeyRepository.create({
        tenantId: tenant.id,
        name: 'Default Development Key',
        keyHash: apiKeyHash,
        environment: 'development',
        scopes: ['calls:read', 'calls:write', 'transcripts:read'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
      await apiKeyRepository.save(apiKey);
      console.log('Created sample API key');
    }

    console.log('Tenants database seeding completed');
  } catch (error) {
    console.error('Error seeding tenants database:', error);
    throw error;
  } finally {
    if (tenantsDataSource.isInitialized) {
      await tenantsDataSource.destroy();
    }
  }
}

async function seedTelephonyDatabase() {
  try {
    await telephonyDataSource.initialize();
    console.log('Telephony database connected');

    const callRepository = telephonyDataSource.getRepository(Call);
    const callRecordingRepository = telephonyDataSource.getRepository(CallRecording);
    const callTranscriptRepository = telephonyDataSource.getRepository(CallTranscript);
    const phoneNumberRepository = telephonyDataSource.getRepository(PhoneNumber);

    // Create a sample call
    const sampleCall = await callRepository.findOne({ where: { id: TEST_CALL_ID } });
    if (!sampleCall) {
      const call = callRepository.create({
        id: TEST_CALL_ID,
        tenantId: DEFAULT_TENANT_ID,
        userId: ADMIN_USER_ID,
        callSid: 'CA' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        direction: 'inbound',
        status: 'completed',
        fromNumber: '+15551234567',
        toNumber: '+15557654321',
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        answerTime: new Date(Date.now() - 59 * 60 * 1000),
        endTime: new Date(Date.now() - 30 * 60 * 1000),
        durationSeconds: 1740,
        cost: 1.74,
        currency: 'USD',
      });
      await callRepository.save(call);
      console.log('Created sample call');

      // Create a sample recording
      const recording = callRecordingRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        callId: call.id,
        storageUrl: 's3://dukat-recordings/sample-call.mp3',
        startTime: call.startTime,
        endTime: call.endTime,
        durationSeconds: call.durationSeconds,
        fileSizeBytes: 1024 * 1024 * 5, // 5MB
        format: 'mp3',
        isEncrypted: false,
        transcriptionStatus: 'completed',
      });
      await callRecordingRepository.save(recording);
      console.log('Created sample call recording');

      // Create a sample transcript
      const transcript = callTranscriptRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        callId: call.id,
        content: 'Hello, how can I help you today? I am looking for customer support.',
        speakerDiarization: [
          { speaker: 'agent', start: 0, end: 5, text: 'Hello, how can I help you today?' },
          { speaker: 'customer', start: 6, end: 10, text: 'I am looking for customer support.' },
        ],
        language: 'en-US',
        // embedding: [0.1, 0.2, 0.3, ...], // Placeholder for actual embedding
      });
      await callTranscriptRepository.save(transcript);
      console.log('Created sample call transcript');
    }

    // Create a sample phone number
    const samplePhoneNumber = await phoneNumberRepository.findOne({ where: { number: '+18005551234' } });
    if (!samplePhoneNumber) {
      const phoneNumber = phoneNumberRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        number: '+18005551234',
        status: 'assigned',
        countryCode: 'US',
        capabilities: { sms: true, voice: true },
        assignedToUserId: ADMIN_USER_ID,
      });
      await phoneNumberRepository.save(phoneNumber);
      console.log('Created sample phone number');
    }

    console.log('Telephony database seeding completed');
  } catch (error) {
    console.error('Error seeding telephony database:', error);
    throw error;
  } finally {
    if (telephonyDataSource.isInitialized) {
      await telephonyDataSource.destroy();
    }
  }
}

async function seedBillingDatabase() {
  try {
    await billingDataSource.initialize();
    console.log('Billing database connected');

    const planRepository = billingDataSource.getRepository(Plan);
    const subscriptionRepository = billingDataSource.getRepository(Subscription);
    const invoiceRepository = billingDataSource.getRepository(Invoice);
    const usageRecordRepository = billingDataSource.getRepository(UsageRecord);

    // Create a sample plan
    const starterPlan = await planRepository.findOne({ where: { id: TEST_PLAN_ID } });
    if (!starterPlan) {
      const plan = planRepository.create({
        id: TEST_PLAN_ID,
        name: 'Starter Plan',
        description: 'Basic plan for small businesses',
        price: 2500.00,
        currency: 'USD',
        interval: 'month',
        features: { maxCalls: 1000, voiceCloning: false },
        isActive: true,
      });
      await planRepository.save(plan);
      console.log('Created sample plan: Starter Plan');
    }

    // Create a sample subscription
    const sampleSubscription = await subscriptionRepository.findOne({ where: { tenantId: DEFAULT_TENANT_ID } });
    if (!sampleSubscription) {
      const plan = await planRepository.findOne({ where: { id: TEST_PLAN_ID } });
      if (!plan) throw new Error('Plan not found for subscription seeding');

      const subscription = subscriptionRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        planId: plan.id,
        status: 'active',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await subscriptionRepository.save(subscription);
      console.log('Created sample subscription');

      // Create a sample invoice
      const invoice = invoiceRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        subscriptionId: subscription.id,
        status: 'paid',
        invoiceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        amountDue: 2500.00,
        amountPaid: 2500.00,
        currency: 'USD',
      });
      await invoiceRepository.save(invoice);
      console.log('Created sample invoice');

      // Create sample usage records
      const usageRecord1 = usageRecordRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        subscriptionId: subscription.id,
        metricType: 'call_minutes',
        amount: 500,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      });
      const usageRecord2 = usageRecordRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        subscriptionId: subscription.id,
        metricType: 'api_requests',
        amount: 1500,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });
      await usageRecordRepository.save([usageRecord1, usageRecord2]);
      console.log('Created sample usage records');
    }

    console.log('Billing database seeding completed');
  } catch (error) {
    console.error('Error seeding billing database:', error);
    throw error;
  } finally {
    if (billingDataSource.isInitialized) {
      await billingDataSource.destroy();
    }
  }
}

async function seedAnalyticsDatabase() {
  try {
    await analyticsDataSource.initialize();
    console.log('Analytics database connected');

    const callMetricRepository = analyticsDataSource.getRepository(CallMetric);
    const voiceQualityLogRepository = analyticsDataSource.getRepository(VoiceQualityLog);
    const tenantAnalyticsRepository = analyticsDataSource.getRepository(TenantAnalytics);

    // Create sample call metrics
    const metric1 = callMetricRepository.create({
      tenantId: DEFAULT_TENANT_ID,
      callId: TEST_CALL_ID,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metricName: 'latency',
      metricValue: 150,
    });
    const metric2 = callMetricRepository.create({
      tenantId: DEFAULT_TENANT_ID,
      callId: TEST_CALL_ID,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      metricName: 'jitter',
      metricValue: 20,
    });
    await callMetricRepository.save([metric1, metric2]);
    console.log('Created sample call metrics');

    // Create sample voice quality logs
    const vql = voiceQualityLogRepository.create({
      tenantId: DEFAULT_TENANT_ID,
      callId: TEST_CALL_ID,
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      mosScore: 4.2,
      latencyMs: 120,
      jitterMs: 15,
      packetLoss: 0.5,
    });
    await voiceQualityLogRepository.save(vql);
    console.log('Created sample voice quality log');

    // Create sample tenant analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tenantAnalytics = await tenantAnalyticsRepository.findOne({ where: { tenantId: DEFAULT_TENANT_ID, date: today } });
    if (!tenantAnalytics) {
      const analytics = tenantAnalyticsRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        date: today,
        totalCalls: 10,
        totalMinutes: 150,
        totalCost: 15.00,
        callStatusDistribution: { completed: 8, failed: 2 },
      });
      await tenantAnalyticsRepository.save(analytics);
      console.log('Created sample tenant analytics');
    }

    console.log('Analytics database seeding completed');
  } catch (error) {
    console.error('Error seeding analytics database:', error);
    throw error;
  } finally {
    if (analyticsDataSource.isInitialized) {
      await analyticsDataSource.destroy();
    }
  }
}

async function seedEmergencyDatabase() {
  try {
    await emergencyDataSource.initialize();
    console.log('Emergency database connected');

    const emergencyCallRepository = emergencyDataSource.getRepository(EmergencyCall);
    const emergencyContactRepository = emergencyDataSource.getRepository(EmergencyContact);
    const psapInfoRepository = emergencyDataSource.getRepository(PsapInfo);

    // Create sample PSAP info
    const samplePsap = await psapInfoRepository.findOne({ where: { id: TEST_PSAP_ID } });
    if (!samplePsap) {
      const psap = psapInfoRepository.create({
        id: TEST_PSAP_ID,
        name: 'Local PSAP Center',
        phoneNumber: '+1911',
        address: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zipCode: '10001',
        latitude: 40.7128,
        longitude: -74.0060,
      });
      await psapInfoRepository.save(psap);
      console.log('Created sample PSAP info');
    }

    // Create sample emergency call
    const sampleEmergencyCall = await emergencyCallRepository.findOne({ where: { tenantId: DEFAULT_TENANT_ID } });
    if (!sampleEmergencyCall) {
      const emergencyCall = emergencyCallRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        e911CallId: 'E911-' + Math.random().toString(36).substring(2, 15),
        originalCallId: TEST_CALL_ID,
        callTime: new Date(),
        fromNumber: '+15551234567',
        toNumber: '+1911',
        callerName: 'John Doe',
        locationAddress: '123 Main St, Anytown, NY 10001',
        latitude: 40.7128,
        longitude: -74.0060,
        psapId: TEST_PSAP_ID,
        status: 'completed',
      });
      await emergencyCallRepository.save(emergencyCall);
      console.log('Created sample emergency call');
    }

    // Create sample emergency contact
    const sampleEmergencyContact = await emergencyContactRepository.findOne({ where: { tenantId: DEFAULT_TENANT_ID, userId: ADMIN_USER_ID } });
    if (!sampleEmergencyContact) {
      const contact = emergencyContactRepository.create({
        tenantId: DEFAULT_TENANT_ID,
        userId: ADMIN_USER_ID,
        name: 'Jane Admin',
        phoneNumber: '+15559876543',
        email: 'jane.admin@example.com',
        relationship: 'primary',
      });
      await emergencyContactRepository.save(contact);
      console.log('Created sample emergency contact');
    }

    console.log('Emergency database seeding completed');
  } catch (error) {
    console.error('Error seeding emergency database:', error);
    throw error;
  } finally {
    if (emergencyDataSource.isInitialized) {
      await emergencyDataSource.destroy();
    }
  }
}

// Run seed for all databases
async function seedAllDatabases() {
  console.log('Starting database seeding...');
  
  try {
    await seedTenantsDatabase(); // Tenants must be seeded first to provide tenantId
    await seedAuthDatabase();
    await seedTelephonyDatabase();
    await seedBillingDatabase();
    await seedAnalyticsDatabase();
    await seedEmergencyDatabase();
    
    console.log('All databases seeded successfully');
  } catch (error) {
    console.error('Failed to seed all databases:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAllDatabases();
}