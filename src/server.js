const createApp = require('./app');
const database = require('./config/database');
const config = require('./config/env');

/**
 * Start the server
 */
async function startServer() {
  try {
    // Connect to database
    await database.connect();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await database.disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await database.disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
