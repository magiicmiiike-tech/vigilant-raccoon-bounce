import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from '@dukat/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3015;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'emergency-service' });
});

// Validate Address for E911
app.post('/api/emergency/validate-address', async (req, res) => {
    try {
        const { address, city, state, zip, country } = req.body;
        // Mock validation logic (would connect to Bandwidth/Twilio/RapidSOS)
        logger.info(`Validating emergency address: ${address}, ${zip}`);
        
        res.json({
            valid: true,
            addressId: "addr_" + Math.random().toString(36).substring(7),
            normalizedAddress: { address, city, state, zip, country }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// E911 Call Notification Webhook
app.post('/api/emergency/notification', async (req, res) => {
    try {
        const { callId, fromNumber, location } = req.body;
        logger.warn(`EMERGENCY CALL DETECTED: ${callId} from ${fromNumber} at ${JSON.stringify(location)}`);
        // Logic to notify tenant admins immediately
        res.json({ received: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  logger.info(`Emergency Service running on port ${PORT}`);
});
