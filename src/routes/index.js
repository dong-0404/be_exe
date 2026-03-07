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



  // Community routes

  app.use(`${API_PREFIX}/community`, communityRoutes);



  // Chat routes

  app.use(`${API_PREFIX}/chat`, chatRoutes);



  // Notification routes

  app.use(`${API_PREFIX}/notifications`, notificationRoutes);

  // Add more routes here as the application grows
}



module.exports = { registerRoutes, setMessageController };

