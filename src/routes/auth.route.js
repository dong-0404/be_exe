const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validation.middleware');

const router = Router();
const controller = new AuthController();

// Validation schemas
const loginSchema = {
  required: ['email', 'password'],
  fields: {
    email: {
      type: 'string',
      pattern: /^\S+@\S+\.\S+$/,
      patternMessage: 'Please provide a valid email address',
    },
    password: {
      type: 'string',
    },
  },
};

const changePasswordSchema = {
  required: ['currentPassword', 'newPassword'],
  fields: {
    currentPassword: {
      type: 'string',
    },
    newPassword: {
      type: 'string',
      minLength: 6,
    },
  },
};

// Public routes
router.post('/login', validateBody(loginSchema), controller.login.bind(controller));

// Protected routes
router.get('/me', authenticate, controller.getCurrentUser.bind(controller));
router.post('/change-password', authenticate, validateBody(changePasswordSchema), controller.changePassword.bind(controller));
router.post('/logout', authenticate, controller.logout.bind(controller));

module.exports = router;
