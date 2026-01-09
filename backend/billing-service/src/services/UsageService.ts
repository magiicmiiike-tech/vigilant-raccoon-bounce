import { logger } from "@dukat/shared";
import Stripe from "stripe";

export class UsageService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2023-10-16" as any,
    });
  }

  async reportUsage(subscriptionItemId: string, quantity: number) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp,
          action: "increment",
        }
      );
      logger.info(`Reported usage of ${quantity} units for sub item ${subscriptionItemId}`);
    } catch (error) {
      logger.error("Failed to report usage to Stripe", error);
      throw error;
    }
  }
}
