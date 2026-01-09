import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from '@dukat/shared';
import { AppDataSource } from './data-source';
import { Tenant } from './entities/Tenant';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3011;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Database
AppDataSource.initialize()
    .then(() => {
        logger.info("Data Source has been initialized!");
    })
    .catch((err) => {
        logger.error("Error during Data Source initialization", err);
    });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tenant-service' });
});

// Basic CRUD for Tenants
app.get('/api/tenants', async (req, res) => {
    try {
        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenants = await tenantRepo.find();
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tenants' });
    }
});

app.post('/api/tenants', async (req, res) => {
    try {
        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenant = tenantRepo.create(req.body);
        await tenantRepo.save(tenant);
        res.status(201).json(tenant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create tenant' });
    }
});

app.listen(PORT, () => {
  logger.info(`Tenant Service running on port ${PORT}`);
});
