import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
import { createDatabaseConfig } from '../../shared/utils/database';
import { User } from './models/User';

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3010;

const AppDataSource = createDatabaseConfig([User]);

AppDataSource.initialize()
  .then(() => {
    console.log('Auth Service: Database connected');
    
    app.get('/health', (req, res) => {
      res.json({ status: 'up', service: 'auth-service' });
    });

    app.listen(port, () => {
      console.log(`Auth Service running on port ${port}`);
    });
  })
  .catch((error) => console.log('Auth Service Error: ', error));
