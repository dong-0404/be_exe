const StudentService = require('../services/student.service');
const CloudinaryService = require('../services/cloudinary.service');
const { success, error: errorResponse } = require('../utils/response');

/**
 * Student Controller - HTTP Layer
 */
class StudentController {
    constructor() {
        this.studentService = new StudentService();
        this.cloudinaryService = new CloudinaryService();
    }

    /**
     * Create student profile
     * POST /api/v1/students
     * Public endpoint for initial profile creation after registration
     */
    async createProfile(req, res) {
        try {
            const studentData = req.body;
            // No userId from auth middleware since this is public
            // Use userId from request body instead

            const student = await this.studentService.createStudentProfile(
                studentData,
                null // No authenticated userId
            );

            return success(res, {
                data: student,
                message: 'Student profile created successfully',
                statusCode: 201,
            });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }

    /**
     * Get student profile by ID
     * GET /api/v1/students/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const student = await this.studentService.getStudentById(id);
            return success(res, { data: student });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }

    /**
     * Get my student profile (authenticated user)
     * GET /api/v1/students/me
     * GET /api/v1/students/profile
     */
    async getMyProfile(req, res) {
        try {
            const userId = req.user.id;
            const student = await this.studentService.getStudentByUserId(userId);
            return success(res, {
                data: student,
                message: 'Student profile retrieved successfully'
            });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }

    /**
     * Get student profile by user ID
     * GET /api/v1/students/user/:userId
     */
    async getByUserId(req, res) {
        try {
            const { userId } = req.params;
            const student = await this.studentService.getStudentByUserId(userId);
            return success(res, { data: student });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }

    /**
     * Update student profile by ID
     * PUT /api/v1/students/:id
     */
    async updateProfile(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const userId = req.user?.id;

            // Handle avatar upload if file is provided
            if (req.file) {
                try {
                    const uploadResult = await this.cloudinaryService.uploadImage(
                        req.file.path,
                        { folder: 'students/avatars' }
                    );
                    updateData.avatarUrl = uploadResult.url; // ← Changed from secure_url to url
                } catch (uploadErr) {
                    return errorResponse(res, {
                        message: 'Failed to upload avatar: ' + uploadErr.message,
                        statusCode: 500,
                    });
                }
            }

            const student = await this.studentService.updateStudentProfile(
                id,
                updateData,
                userId
            );

            return success(res, {
                data: student,
                message: 'Student profile updated successfully',
            });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }

    /**
     * Update my student profile (authenticated user)
     * PUT /api/v1/students/profile
     */
    async updateMyProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            // Find student by userId first
            const student = await this.studentService.getStudentByUserId(userId);

            // Handle avatar upload if file is provided
            if (req.file) {
                try {
                    const uploadResult = await this.cloudinaryService.uploadImage(
                        req.file.path,
                        { folder: 'students/avatars' }
                    );
                    updateData.avatarUrl = uploadResult.url;
                } catch (uploadErr) {
                    return errorResponse(res, {
                        message: 'Failed to upload avatar: ' + uploadErr.message,
                        statusCode: 500,
                    });
                }
            }

            // Update using student ID
            const updatedStudent = await this.studentService.updateStudentProfile(
                student._id,
                updateData,
                userId
            );

            return success(res, {
                data: updatedStudent,
                message: 'Student profile updated successfully',
            });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }

    /**
     * Delete student profile
     * DELETE /api/v1/students/:id
     */
    async deleteProfile(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?._id;

            const result = await this.studentService.deleteStudentProfile(id, userId);
            return success(res, { data: result });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }

    /**
     * Get all students (with pagination)
     * GET /api/v1/students
     */
    async getAll(req, res) {
        try {
            const { page = 1, limit = 10, grade, parentId } = req.query;

            const filter = {};
            if (grade) filter.grade = grade;
            if (parentId) filter.parentId = parentId;

            const result = await this.studentService.getAllStudents({
                page: parseInt(page),
                limit: parseInt(limit),
                filter,
            });

            return success(res, {
                data: {
                    students: result.students,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: result.total,
                        pages: Math.ceil(result.total / limit),
                    },
                },
            });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }

    /**
     * Get students by parent ID
     * GET /api/v1/students/parent/:parentId
     */
    async getByParentId(req, res) {
        try {
            const { parentId } = req.params;
            const students = await this.studentService.getStudentsByParentId(parentId);
            return success(res, { data: students });
        } catch (err) {
            return errorResponse(res, {
                message: err.message,
                statusCode: err.statusCode || 500,
            });
        }
    }
}

module.exports = StudentController;
