import { initializeDatabase, AppDataSource } from './data-source';

const start = async () => {
  try {
    await initializeDatabase();
    console.log('Dukat Voice AI SaaS Backend started successfully.');

    // Example: Run migrations on startup in development (optional, for quick setup)
    if (process.env.NODE_ENV === 'development') {
      console.log('Running migrations...');
      await AppDataSource.runMigrations();
      console.log('Migrations completed.');
    }

    // Here you would typically start your Express/NestJS/Fastify application
    // For now, we'll just keep the database connection alive.
    console.log('Application is running. Press Ctrl+C to exit.');

  } catch (error) {
    console.error('Failed to start Dukat Voice AI SaaS Backend:', error);
    process.exit(1);
  }
};

start();

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
  process.exit(0);
});