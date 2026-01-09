import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from '@dukat/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3016;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'integration-service' });
});

// Trigger n8n Workflow
app.post('/api/integration/workflow/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const payload = req.body;
        const n8nUrl = process.env.N8N_URL || 'http://localhost:5678';
        
        logger.info(`Triggering workflow ${workflowId} on n8n`);
        
        // Proxy to n8n webhook
        // const response = await axios.post(`${n8nUrl}/webhook/${workflowId}`, payload);
        
        res.json({ success: true, message: "Workflow triggered" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// CRM Sync Endpoint
app.post('/api/integration/crm/sync', async (req, res) => {
    try {
        const { tenantId, entityType, data } = req.body;
        logger.info(`Syncing ${entityType} for tenant ${tenantId} to CRM`);
        res.json({ success: true, synced: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  logger.info(`Integration Service running on port ${PORT}`);
});
