import Stripe from 'stripe';

class UsageMetering {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-12-18' as any, // 2026-ready API version
    });
  }

  async meterCall(tenantId: string, durationInSeconds: number) {
    try {
      // Integrate with Stripe Meter Events (2026 std for usage-based)
      // This assumes you have a meter set up in Stripe with event_name 'call_minutes'
      await this.stripe.billing.meterEvents.create({
        event_name: 'call_minutes',
        payload: {
          value: (durationInSeconds / 60).toString(),
          stripe_customer_id: await this.getStripeCustomerId(tenantId),
        },
      });
      console.log(`✅ Metered ${durationInSeconds}s for tenant ${tenantId}`);
    } catch (error) {
      console.error(`❌ Failed to meter call for tenant ${tenantId}:`, error);
    }
  }

  private async getStripeCustomerId(tenantId: string): Promise<string> {
    // In a real implementation, you would fetch this from your database
    // Mocking for now
    return `cus_${tenantId.substring(0, 10)}`;
  }
}

export default new UsageMetering();
