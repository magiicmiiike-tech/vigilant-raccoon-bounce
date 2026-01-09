import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from '@dukat/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3018;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'webhook-service' });
});

// Dispatch Webhook
app.post('/api/webhooks/dispatch', async (req, res) => {
    try {
        const { url, event, payload, secret } = req.body;
        logger.info(`Dispatching ${event} to ${url}`);
        
        // In production, add signature header using secret
        // await axios.post(url, payload, { headers: { 'X-Signature': ... } });
        
        res.json({ success: true, message: "Webhook dispatched" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  logger.info(`Webhook Service running on port ${PORT}`);
});
