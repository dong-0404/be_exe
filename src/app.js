const express = require('express');
const cors = require('cors');
const { registerRoutes } = require('./routes/index');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

/**
 * Initialize Express application
 * @returns {Express} Express app instance
 */
function createApp() {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Register all routes
  registerRoutes(app);

  // 404 handler - must be after all routes
  app.use(notFound);

  // Global error handler - must be last
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
