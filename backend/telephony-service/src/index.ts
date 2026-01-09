import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from '@dukat/shared';
import { TokenService } from './services/TokenService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3012;
const tokenService = new TokenService();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'voice-service' });
});

// Generate LiveKit token
app.post('/api/voice/token', async (req, res) => {
    try {
        const { roomName, participantName, userId, metadata } = req.body;
        const tenantId = req.headers['x-tenant-id'] as string || 'default';

        const result = await tokenService.generateToken({
            roomName,
            participantName,
            userId,
            tenantId,
            metadata
        });

        res.json(result);
    } catch (error: any) {
        logger.error('Token generation endpoint error', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  logger.info(`Voice Service running on port ${PORT}`);
});
