import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());

const port = process.env.PORT || 3000;

// Auth Service Proxy
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3010',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' }
}));

// Tenant Service Proxy
app.use('/api/tenants', createProxyMiddleware({
  target: process.env.TENANT_SERVICE_URL || 'http://localhost:3011',
  changeOrigin: true,
  pathRewrite: { '^/api/tenants': '' }
}));

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});