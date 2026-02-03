const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const studentRoutes = require('./student.route');
const tutorRoutes = require('./tutor.route');
const uploadRoutes = require('./upload.route');
const subjectRoutes = require('./subject.route');
const gradeRoutes = require('./grade.route');

/**
 * Register all application routes
 * @param {Express} app - Express app instance
 */
function registerRoutes(app) {
  // API version prefix
  const API_PREFIX = '/api/v1';

  // Authentication routes
  app.use(`${API_PREFIX}/auth`, authRoutes);

  // User routes
  app.use(`${API_PREFIX}/users`, userRoutes);

  // Student routes
  app.use(`${API_PREFIX}/students`, studentRoutes);

  // Tutor routes
  app.use(`${API_PREFIX}/tutors`, tutorRoutes);

  // Upload routes
  app.use(`${API_PREFIX}/upload`, uploadRoutes);

  // Subject routes
  app.use(`${API_PREFIX}/subjects`, subjectRoutes);

  // Grade routes
  app.use(`${API_PREFIX}/grades`, gradeRoutes);

  // Add more routes here as the application grows
  // Example:
  // app.use(`${API_PREFIX}/posts`, postRoutes);
  // app.use(`${API_PREFIX}/comments`, commentRoutes);
}

module.exports = { registerRoutes };
