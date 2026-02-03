const { Router } = require('express');
const UserController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validation.middleware');

const router = Router();
const controller = new UserController();

// Validation schemas
const createUserSchema = {
  required: ['email', 'password', 'role', 'phone'],
  fields: {
    email: {
      type: 'string',
      pattern: /^\S+@\S+\.\S+$/,
      patternMessage: 'Please provide a valid email address',
    },
    password: {
      type: 'string',
      minLength: 6,
    },
    role: {
      type: 'number',
      custom: (value) => {
        if (![1, 2, 3].includes(value)) {
          return 'role must be 1 (STUDENT), 2 (TUTOR), or 3 (PARENT)';
        }
        return null;
      },
    },
    phone: {
      type: 'string',
      maxLength: 20,
      pattern: /^[0-9+\-\s()]+$/,
      patternMessage: 'Please provide a valid phone number',
    },
  },
};

const updateUserSchema = {
  fields: {
    email: {
      type: 'string',
      pattern: /^\S+@\S+\.\S+$/,
      patternMessage: 'Please provide a valid email address',
    },
    password: {
      type: 'string',
      minLength: 6,
    },
    firstName: {
      type: 'string',
      maxLength: 50,
    },
    lastName: {
      type: 'string',
      maxLength: 50,
    },
  },
};

// Validation schemas for OTP
const verifyOtpSchema = {
  required: ['email', 'otp'],
  fields: {
    email: {
      type: 'string',
      pattern: /^\S+@\S+\.\S+$/,
      patternMessage: 'Please provide a valid email address',
    },
    otp: {
      type: 'string',
      minLength: 4,
      maxLength: 4,
    },
  },
};

const resendOtpSchema = {
  required: ['email'],
  fields: {
    email: {
      type: 'string',
      pattern: /^\S+@\S+\.\S+$/,
      patternMessage: 'Please provide a valid email address',
    },
  },
};

// Public routes
router.post('/register', validateBody(createUserSchema), controller.register.bind(controller));
router.post('/verify-otp', validateBody(verifyOtpSchema), controller.verifyOtp.bind(controller));
router.post('/resend-otp', validateBody(resendOtpSchema), controller.resendOtp.bind(controller));

// Protected routes - Require authentication
router.get('/me', authenticate, controller.getProfile.bind(controller));
router.put('/me', authenticate, validateBody(updateUserSchema), controller.updateProfile.bind(controller));

// Admin only routes
router.post('/', authenticate, authorize('ADMIN'), validateBody(createUserSchema), controller.create.bind(controller));
router.get('/', authenticate, authorize('ADMIN'), controller.getAll.bind(controller));
router.get('/:id', authenticate, authorize('ADMIN'), controller.getById.bind(controller));
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateUserSchema), controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('ADMIN'), controller.delete.bind(controller));

module.exports = router;
