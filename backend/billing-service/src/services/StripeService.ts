import Stripe from "stripe";
import { logger } from "@dukat/shared";

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2023-10-16" as any,
    });
  }

  async createCustomer(email: string, name: string, tenantId: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: { tenantId },
      });
      logger.info(`Created Stripe customer for tenant ${tenantId}`);
      return customer;
    } catch (error) {
      logger.error("Failed to create Stripe customer", error);
      throw error;
    }
  }

  async createSubscription(customerId: string, priceId: string) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });
      return subscription;
    } catch (error) {
      logger.error("Failed to create Stripe subscription", error);
      throw error;
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    // Webhook handling logic for Stripe events
  }
}
