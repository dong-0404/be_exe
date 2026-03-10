const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const studentRoutes = require('./student.route');
const tutorRoutes = require('./tutor.route');
const uploadRoutes = require('./upload.route');
const subjectRoutes = require('./subject.route');
const gradeRoutes = require('./grade.route');
const communityRoutes = require('./community.route');
const { router: chatRoutes, setMessageController } = require('./chat.route');
const notificationRoutes = require('./notification.route');
const adminRoutes = require('./admin.route');
const classRoutes = require('./class.route');

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

  // Class & schedule routes
  app.use(`${API_PREFIX}/classes`, classRoutes);



  // Upload routes

  app.use(`${API_PREFIX}/upload`, uploadRoutes);



  // Subject routes

  app.use(`${API_PREFIX}/subjects`, subjectRoutes);



  // Grade routes

  app.use(`${API_PREFIX}/grades`, gradeRoutes);



  // Community routes

  app.use(`${API_PREFIX}/community`, communityRoutes);



  // Chat routes

  app.use(`${API_PREFIX}/chat`, chatRoutes);



  // Notification routes

  app.use(`${API_PREFIX}/notifications`, notificationRoutes);

  // Admin routes
  app.use(`${API_PREFIX}/admin`, adminRoutes);

  // Add more routes here as the application grows
}



module.exports = { registerRoutes, setMessageController };

