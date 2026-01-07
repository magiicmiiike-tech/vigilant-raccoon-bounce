import { createApp } from './app';
import { initializeDatabase, AppDataSource } from './data-source'; // Import AppDataSource
import { config } from './config/config';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Auth service running on port ${config.port} in ${config.env} mode`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Received shutdown signal, closing server gracefully');
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connection
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info('Database connection closed');
        }
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();