const { Router } = require('express');
const StudentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validation.middleware');
const { uploadSingleOptional } = require('../middlewares/upload.middleware');
const { UserRole } = require('../constants/enums');

const router = Router();
const controller = new StudentController();

// Validation schemas
const createStudentSchema = {
    required: ['userId', 'fullName'],
    fields: {
        userId: {
            type: 'string',
            pattern: /^[0-9a-fA-F]{24}$/,
            patternMessage: 'Invalid user ID format',
        },
        fullName: {
            type: 'string',
            maxLength: 255,
        },
        parentId: {
            type: 'string',
            pattern: /^[0-9a-fA-F]{24}$/,
            patternMessage: 'Invalid parent ID format',
        },
        dateOfBirth: {
            type: 'string',
            pattern: /^\d{4}-\d{2}-\d{2}$/,
            patternMessage: 'Date must be in YYYY-MM-DD format',
        },
        gender: {
            type: 'number',
            custom: (value) => {
                if (![1, 2, 3].includes(value)) {
                    return 'gender must be 1 (OTHER), 2 (MALE), or 3 (FEMALE)';
                }
                return null;
            },
        },
        grade: {
            type: 'string',
            maxLength: 50,
        },
        school: {
            type: 'string',
            maxLength: 255,
        },
    },
};

const updateStudentSchema = {
    fields: {
        fullName: {
            type: 'string',
            maxLength: 255,
        },
        parentId: {
            type: 'string',
            pattern: /^[0-9a-fA-F]{24}$/,
            patternMessage: 'Invalid parent ID format',
        },
        dateOfBirth: {
            type: 'string',
            pattern: /^\d{4}-\d{2}-\d{2}$/,
            patternMessage: 'Date must be in YYYY-MM-DD format',
        },
        gender: {
            type: 'number',
            custom: (value) => {
                if (![1, 2, 3].includes(value)) {
                    return 'gender must be 1 (OTHER), 2 (MALE), or 3 (FEMALE)';
                }
                return null;
            },
        },
        grade: {
            type: 'string',
            maxLength: 50,
        },
        school: {
            type: 'string',
            maxLength: 255,
        },
    },
};

// ==========================================
// IMPORTANT: Specific routes MUST come BEFORE dynamic routes (/:id)
// Otherwise Express will match /:id first and treat "profile", "me" as IDs
// ==========================================

// Protected routes (authentication required) - SPECIFIC ROUTES FIRST
router.get('/profile', authenticate, controller.getMyProfile.bind(controller)); // Get my profile
router.get('/me', authenticate, controller.getMyProfile.bind(controller)); // Get my profile (alternative endpoint)

// Public specific routes
router.get('/user/:userId', controller.getByUserId.bind(controller)); // Get by user ID
router.get('/parent/:parentId', controller.getByParentId.bind(controller)); // Get by parent ID

// Public routes (no authentication needed)
router.get('/', controller.getAll.bind(controller)); // Get all students (with filter/pagination)

// Create student profile (public, for initial profile creation after registration)
router.post(
    '/',
    validateBody(createStudentSchema),
    controller.createProfile.bind(controller)
);

// Dynamic routes - MUST be LAST to avoid conflicts
router.get('/:id', controller.getById.bind(controller)); // Get by student ID

// Update my profile (no ID needed, gets from token) - SPECIFIC ROUTE FIRST
router.put(
    '/profile',
    authenticate,
    uploadSingleOptional('avatar'), // Optional avatar upload
    validateBody(updateStudentSchema),
    controller.updateMyProfile.bind(controller)
);

// Update profile by ID (admin or specific use) - DYNAMIC ROUTE LAST
router.put(
    '/:id',
    authenticate,
    uploadSingleOptional('avatar'), // Optional avatar upload
    validateBody(updateStudentSchema),
    controller.updateProfile.bind(controller)
);

// Delete profile by ID - DYNAMIC ROUTE
router.delete('/:id', authenticate, controller.deleteProfile.bind(controller));

module.exports = router;
