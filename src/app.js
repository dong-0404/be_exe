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

  // Disable ETag to prevent 304 responses during development
  app.set('etag', false);

  // Disable caching for all responses
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // Body parsers with increased limit for image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
