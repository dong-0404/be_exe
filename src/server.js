const createApp = require('./app');
const database = require('./config/database');
const config = require('./config/env');
const { Server } = require('socket.io');
const socketAuth = require('./middlewares/socketAuth.middleware');
const WebSocketService = require('./services/websocket.service');
const MessageController = require('./controllers/message.controller');
const { setMessageController } = require('./routes/index');

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

    // Initialize Socket.io
    const io = new Server(server, {
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST'],
      },
    });

    // Socket.io authentication middleware
    io.use(socketAuth);

    // Initialize WebSocket service
    const websocketService = new WebSocketService();
    websocketService.initialize(io);

    // Update MessageController with websocket service
    const messageController = new MessageController(websocketService);
    setMessageController(messageController);

    console.log('Socket.io server initialized');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        io.close();
        await database.disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        io.close();
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
