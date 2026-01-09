import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from '@dukat/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3014;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-service' });
});

// Record Call Metric
app.post('/api/analytics/call', async (req, res) => {
    try {
        const { tenantId, duration, status, quality } = req.body;
        // In production, write to TimescaleDB or InfluxDB
        logger.info(`Recorded call metric for tenant ${tenantId}: ${duration}s, ${status}`);
        res.status(201).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Aggregated Stats
app.get('/api/analytics/stats/:tenantId', async (req, res) => {
    // Placeholder for real DB aggregation
    res.json({
        activeCalls: 5,
        totalMinutes: 150,
        averageMOS: 4.2
    });
});

app.listen(PORT, () => {
  logger.info(`Analytics Service running on port ${PORT}`);
});
