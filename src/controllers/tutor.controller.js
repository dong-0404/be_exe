const TutorService = require('../services/tutor.service');
const UserService = require('../services/user.service');
const CloudinaryService = require('../services/cloudinary.service');
const { success } = require('../utils/response');
const { UserStatus } = require('../constants/enums');

const tutorService = new TutorService();
const userService = new UserService();
const cloudinaryService = new CloudinaryService();

/**
 * Tutor Controller - HTTP Layer
 * Handles HTTP requests and responses for tutor operations
 */
class TutorController {
    /**
     * Create tutor profile (Step 1)
     * POST /tutors/profile
     * Accept both token (resume) or email (first time)
     */
    async createProfile(req, res, next) {
        try {
            let userId;

            // Try to get userId from token first (if logged in)
            if (req.user && req.user.id) {
                userId = req.user.id;
            } else {
                // No token - use email to identify user
                const { email } = req.body;

                if (!email) {
                    const error = new Error('Email or authentication token is required');
                    error.statusCode = 400;
                    throw error;
                }

                // Find user by email
                const user = await userService.getUserByEmail(email);

                if (!user) {
                    const error = new Error('User not found');
                    error.statusCode = 404;
                    throw error;
                }

                // Cho phép gia sư đang chờ duyệt vẫn được điền hồ sơ theo luồng onboarding (email)
                if (user.status === UserStatus.INACTIVE) {
                    const error = new Error('User account is not active');
                    error.statusCode = 403;
                    throw error;
                }

                userId = user._id;
            }

            // Create profile
            const profile = await tutorService.createProfile(userId, req.body);

            return success(res, {
                data: profile,
                message: 'Profile created successfully. Please continue to next step.',
            }, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update tutor profile (Step 2, 3)
     * PUT /tutors/profile
     * Accept both token (resume) or email (first time)
     */
    async updateProfile(req, res, next) {
        try {
            let userId;

            // Try to get userId from token first
            if (req.user && req.user.id) {
                userId = req.user.id;
            } else {
                // No token - use email
                const { email } = req.body;

                if (!email) {
                    const error = new Error('Email or authentication token is required');
                    error.statusCode = 400;
                    throw error;
                }

                const user = await userService.getUserByEmail(email);

                if (!user || user.status === UserStatus.INACTIVE) {
                    const error = new Error('User not found or not active');
                    error.statusCode = 404;
                    throw error;
                }

                userId = user._id;
            }

            // Get tutor profile to check if exists
            const tutor = await tutorService.getTutorByUserId(userId);

            // Handle avatar upload if file is provided
            if (req.file) {
                try {
                    const uploadResult = await cloudinaryService.uploadImage(
                        req.file.path,
                        { folder: 'tutor-avatars' }
                    );
                    req.body.avatarUrl = uploadResult.url;
                } catch (uploadErr) {
                    const error = new Error('Failed to upload avatar: ' + uploadErr.message);
                    error.statusCode = 500;
                    throw error;
                }
            }

            // Normalize array fields from multipart/form-data
            // Multer automatically creates arrays for multiple fields with same name
            // But we need to ensure single values are also handled
            if (req.body.subjects !== undefined) {
                if (!Array.isArray(req.body.subjects)) {
                    req.body.subjects = [req.body.subjects];
                }
                // Filter out empty values
                req.body.subjects = req.body.subjects.filter(s => s && s.trim && s.trim() !== '');
            }
            if (req.body.grades !== undefined) {
                if (!Array.isArray(req.body.grades)) {
                    req.body.grades = [req.body.grades];
                }
                // Filter out empty values
                req.body.grades = req.body.grades.filter(g => g && g.trim && g.trim() !== '');
            }
            if (req.body.availableDays !== undefined) {
                if (!Array.isArray(req.body.availableDays)) {
                    req.body.availableDays = [req.body.availableDays];
                }
                // Parse to integers and filter out invalid values
                req.body.availableDays = req.body.availableDays
                    .map(d => parseInt(d))
                    .filter(d => !isNaN(d));
            }
            if (req.body.availableTimeSlots !== undefined) {
                if (!Array.isArray(req.body.availableTimeSlots)) {
                    req.body.availableTimeSlots = [req.body.availableTimeSlots];
                }
                // Filter out empty values
                req.body.availableTimeSlots = req.body.availableTimeSlots.filter(s => s && s.trim && s.trim() !== '');
            }

            // Handle certificate data if provided (schoolName, major, educationStatus)
            const { schoolName, major, educationStatus } = req.body;
            if (schoolName && major && educationStatus) {
                // Remove certificate fields from updateData to avoid confusion
                delete req.body.schoolName;
                delete req.body.major;
                delete req.body.educationStatus;

                // Create certificate (no images in this request, only data)
                await tutorService.addCertificate(
                    tutor._id,
                    { schoolName, major, educationStatus: parseInt(educationStatus) },
                    [] // No images
                );
            }

            // Update profile
            const profile = await tutorService.updateProfile(userId, req.body);

            return success(res, {
                data: profile,
                message: 'Profile updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get profile progress
     * GET /tutors/profile/progress
     * Requires authentication
     */
    async getProfileProgress(req, res, next) {
        try {
            const progress = await tutorService.getProfileProgress(req.user.id);

            return success(res, {
                data: progress,
                message: 'Profile progress retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Search and filter tutors (Public)
     * GET /tutors/search
     */
    async searchTutors(req, res, next) {
        try {
            const {
                name,
                subjects,  // Can be comma-separated string or array
                grades,    // Can be comma-separated string or array
                teachingArea,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Parse subjects and grades if they're comma-separated strings
            let subjectIds = [];
            if (subjects) {
                subjectIds = Array.isArray(subjects)
                    ? subjects
                    : subjects.split(',').map(s => s.trim()).filter(s => s);
            }

            let gradeIds = [];
            if (grades) {
                gradeIds = Array.isArray(grades)
                    ? grades
                    : grades.split(',').map(g => g.trim()).filter(g => g);
            }

            const results = await tutorService.searchTutors({
                name,
                subjects: subjectIds,
                grades: gradeIds,
                teachingArea,
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                sortOrder
            });

            return success(res, {
                data: results,
                message: 'Search completed successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all approved tutors (Public)
     * GET /tutors
     */
    async getAllTutors(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;

            const results = await tutorService.getAllApprovedTutors({
                page: parseInt(page),
                limit: parseInt(limit)
            });

            return success(res, {
                data: results,
                message: 'Tutors retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get tutor detailed info by ID (Public)
     * GET /tutors/:id/detail
     */
    async getTutorDetail(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                const error = new Error('Tutor ID is required');
                error.statusCode = 400;
                throw error;
            }

            const tutorDetail = await tutorService.getTutorDetailById(id);

            return success(res, {
                data: tutorDetail,
                message: 'Tutor detail retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get tutor feedbacks with pagination (Public)
     * GET /tutors/:id/feedbacks
     */
    async getTutorFeedbacks(req, res, next) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            if (!id) {
                const error = new Error('Tutor ID is required');
                error.statusCode = 400;
                throw error;
            }

            const result = await tutorService.getTutorFeedbacks(id, {
                page: parseInt(page),
                limit: parseInt(limit),
            });

            return success(res, {
                data: result,
                message: 'Feedbacks retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get tutor profile by userId (public)
     * GET /tutors/profile/:userId
     */
    async getProfileByUserId(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId) {
                const error = new Error('User ID is required');
                error.statusCode = 400;
                throw error;
            }

            const tutor = await tutorService.getTutorByUserId(userId, false);

            if (!tutor) {
                return success(res, {
                    data: null,
                    message: 'Profile not found',
                });
            }

            return success(res, {
                data: tutor,
                message: 'Profile retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current tutor profile
     * GET /tutors/profile
     * Accept both token or email
     */
    async getProfile(req, res, next) {
        try {
            let userId;

            // Try token first
            if (req.user && req.user.id) {
                userId = req.user.id;
            } else {
                // Try email from query
                const { email } = req.query;

                if (email) {
                    const user = await userService.getUserByEmail(email);
                    if (user) {
                        userId = user._id;
                    }
                }
            }

            if (!userId) {
                const error = new Error('User identification required');
                error.statusCode = 400;
                throw error;
            }

            const tutor = await tutorService.getTutorByUserId(userId, false);

            if (!tutor) {
                return success(res, {
                    data: null,
                    message: 'Profile not found',
                });
            }

            return success(res, {
                data: tutor,
                message: 'Profile retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add certificate with images (Step 4)
     * POST /tutors/certificates
     * Accept both token or email
     */
    async addCertificate(req, res, next) {
        try {
            let userId;

            // Try token first
            if (req.user && req.user.id) {
                userId = req.user.id;
            } else {
                // Use email
                const { email } = req.body;

                if (!email) {
                    const error = new Error('Email or authentication token is required');
                    error.statusCode = 400;
                    throw error;
                }

                const user = await userService.getUserByEmail(email);

                if (!user || user.status === UserStatus.INACTIVE) {
                    const error = new Error('User not found or not active');
                    error.statusCode = 404;
                    throw error;
                }

                userId = user._id;
            }

            // Get tutor profile
            const tutor = await tutorService.getTutorByUserId(userId);

            // Get certificate data from request
            const { schoolName, major, educationStatus } = req.body;

            // Validate required fields
            if (!schoolName || !major || !educationStatus) {
                const error = new Error('schoolName, major, and educationStatus are required');
                error.statusCode = 400;
                throw error;
            }

            // Get uploaded file paths
            const imagePaths = req.files ? req.files.map((file) => file.path) : [];

            // Create certificate with images
            const certificate = await tutorService.addCertificate(
                tutor._id,
                { schoolName, major, educationStatus: parseInt(educationStatus) },
                imagePaths
            );

            // Get updated profile status
            const updatedTutor = await tutorService.getTutorByUserId(userId);

            return success(res, {
                data: {
                    certificate,
                    profileStatus: {
                        currentStep: updatedTutor.currentStep,
                        completedSteps: updatedTutor.completedSteps,
                        isProfileComplete: updatedTutor.isProfileComplete,
                    }
                },
                message: updatedTutor.isProfileComplete
                    ? 'Certificate added successfully. Profile completed!'
                    : 'Certificate added successfully',
            }, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all certificates for current tutor
     * GET /tutors/certificates
     */
    async getMyCertificates(req, res, next) {
        try {
            // Get tutor profile
            const tutor = await tutorService.getTutorByUserId(req.user.id);

            // Get certificates
            const certificates = await tutorService.getCertificatesByTutorId(tutor._id);

            return success(res, {
                data: certificates,
                message: 'Certificates retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update certificate
     * PUT /tutors/certificates/:id
     */
    async updateCertificate(req, res, next) {
        try {
            const { id } = req.params;
            const { schoolName, major, educationStatus } = req.body;

            // Get tutor profile
            const tutor = await tutorService.getTutorByUserId(req.user.id);

            // Prepare update data
            const updateData = {};
            if (schoolName !== undefined) updateData.schoolName = schoolName;
            if (major !== undefined) updateData.major = major;
            if (educationStatus !== undefined) updateData.educationStatus = parseInt(educationStatus);

            // Get new uploaded file paths
            const newImagePaths = req.files ? req.files.map((file) => file.path) : [];

            // Update certificate
            const certificate = await tutorService.updateCertificate(
                id,
                tutor._id.toString(),
                updateData,
                newImagePaths
            );

            return success(res, {
                data: certificate,
                message: 'Certificate updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete certificate
     * DELETE /tutors/certificates/:id
     */
    async deleteCertificate(req, res, next) {
        try {
            const { id } = req.params;

            // Get tutor profile
            const tutor = await tutorService.getTutorByUserId(req.user.id);

            // Delete certificate
            await tutorService.deleteCertificate(id, tutor._id.toString());

            return success(res, {
                message: 'Certificate deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove specific images from certificate
     * DELETE /tutors/certificates/:id/images
     */
    async removeCertificateImages(req, res, next) {
        try {
            const { id } = req.params;
            const { imageUrls } = req.body;

            if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
                const error = new Error('imageUrls array is required');
                error.statusCode = 400;
                throw error;
            }

            // Get tutor profile
            const tutor = await tutorService.getTutorByUserId(req.user.id);

            // Remove images
            const certificate = await tutorService.removeCertificateImages(
                id,
                tutor._id.toString(),
                imageUrls
            );

            return success(res, {
                data: certificate,
                message: 'Images removed successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TutorController;
