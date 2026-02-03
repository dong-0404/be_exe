const { Router } = require('express');
const StudentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validation.middleware');
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

// Public routes (no authentication needed)
router.get('/', controller.getAll.bind(controller)); // Get all students (with filter/pagination)
router.get('/:id', controller.getById.bind(controller)); // Get by student ID

// Create student profile (public, for initial profile creation after registration)
router.post(
    '/',
    validateBody(createStudentSchema),
    controller.createProfile.bind(controller)
);

// Protected routes (authentication required)

router.get('/me', authenticate, controller.getMyProfile.bind(controller)); // Get my profile
router.get('/user/:userId', controller.getByUserId.bind(controller)); // Get by user ID
router.get('/parent/:parentId', controller.getByParentId.bind(controller)); // Get by parent ID

router.put(
    '/:id',
    authenticate,
    validateBody(updateStudentSchema),
    controller.updateProfile.bind(controller)
); // Update profile

router.delete('/:id', authenticate, controller.deleteProfile.bind(controller)); // Delete profile

module.exports = router;
