import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from '@dukat/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3017;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

// Send Email
app.post('/api/notifications/email', async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        logger.info(`Sending email to ${to}: ${subject}`);
        // Implement Nodemailer or SendGrid logic here
        res.json({ success: true, message: "Email queued" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Send SMS
app.post('/api/notifications/sms', async (req, res) => {
    try {
        const { to, message } = req.body;
        logger.info(`Sending SMS to ${to}: ${message}`);
        // Implement Twilio SMS logic here
        res.json({ success: true, message: "SMS queued" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  logger.info(`Notification Service running on port ${PORT}`);
});
