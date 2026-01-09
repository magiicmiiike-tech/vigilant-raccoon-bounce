import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from '@dukat/shared';
import { StripeService } from './services/StripeService';
import { UsageService } from './services/UsageService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3013;

const stripeService = new StripeService();
const usageService = new UsageService();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'billing-service' });
});

// Create Customer & Subscription
app.post('/api/billing/subscribe', async (req, res) => {
    try {
        const { email, name, tenantId, priceId } = req.body;
        const customer = await stripeService.createCustomer(email, name, tenantId);
        const subscription = await stripeService.createSubscription(customer.id, priceId);
        res.status(201).json({ customerId: customer.id, subscriptionId: subscription.id });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Report Usage (Internal)
app.post('/api/billing/usage', async (req, res) => {
    try {
        const { subscriptionItemId, quantity } = req.body;
        await usageService.reportUsage(subscriptionItemId, quantity);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  logger.info(`Billing Service running on port ${PORT}`);
});
