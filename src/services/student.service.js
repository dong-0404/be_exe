const StudentRepository = require('../repositories/student.repository');
const UserRepository = require('../repositories/user.repository');
const { UserRole } = require('../constants/enums');

/**
 * Student Service - Business Logic Layer
 */
class StudentService {
    constructor() {
        this.studentRepo = new StudentRepository();
        this.userRepo = new UserRepository();
    }

    /**
     * Create student profile
     * @param {Object} studentData - Student data
     * @param {string} userId - User ID (optional, for admin creating profile for user)
     * @returns {Promise<Object>} Created student
     */
    async createStudentProfile(studentData, userId = null) {
        const targetUserId = userId || studentData.userId;

        // Check if user exists
        const user = await this.userRepo.findById(targetUserId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Check if user role is STUDENT
        if (user.role !== UserRole.STUDENT) {
            const error = new Error('User must have STUDENT role');
            error.statusCode = 400;
            throw error;
        }

        // Check if student profile already exists
        const existingStudent = await this.studentRepo.findByUserId(targetUserId);
        if (existingStudent) {
            const error = new Error('Student profile already exists');
            error.statusCode = 409;
            throw error;
        }

        // Create student profile
        const student = await this.studentRepo.create({
            ...studentData,
            userId: targetUserId,
        });

        // Populate and return
        return this.studentRepo.findById(student._id);
    }

    /**
     * Get student profile by ID
     */
    async getStudentById(id) {
        const student = await this.studentRepo.findById(id);
        if (!student) {
            const error = new Error('Student not found');
            error.statusCode = 404;
            throw error;
        }
        return student;
    }

    /**
     * Get student profile by user ID
     */
    async getStudentByUserId(userId) {
        const student = await this.studentRepo.findByUserId(userId);
        if (!student) {
            const error = new Error('Student profile not found');
            error.statusCode = 404;
            throw error;
        }
        return student;
    }

    /**
     * Update student profile
     */
    async updateStudentProfile(id, updateData, userId = null) {
        const student = await this.studentRepo.findById(id);
        if (!student) {
            const error = new Error('Student not found');
            error.statusCode = 404;
            throw error;
        }

        // If userId provided, check ownership
        if (userId) {
            // student.userId is populated object with _id field
            const studentUserId = student.userId._id || student.userId;
            if (studentUserId.toString() !== userId.toString()) {
                const error = new Error('Not authorized to update this profile');
                error.statusCode = 403;
                throw error;
            }
        }

        // Don't allow changing userId
        delete updateData.userId;

        const updatedStudent = await this.studentRepo.updateById(id, updateData);
        return updatedStudent;
    }

    /**
     * Delete student profile
     */
    async deleteStudentProfile(id, userId = null) {
        const student = await this.studentRepo.findById(id);
        if (!student) {
            const error = new Error('Student not found');
            error.statusCode = 404;
            throw error;
        }

        // If userId provided, check ownership
        if (userId) {
            // student.userId is populated object with _id field
            const studentUserId = student.userId._id || student.userId;
            if (studentUserId.toString() !== userId.toString()) {
                const error = new Error('Not authorized to delete this profile');
                error.statusCode = 403;
                throw error;
            }
        }

        await this.studentRepo.deleteById(id);
        return { message: 'Student profile deleted successfully' };
    }

    /**
     * Get all students (with pagination)
     */
    async getAllStudents(options = {}) {
        return this.studentRepo.findAll(options);
    }

    /**
     * Get students by parent ID
     */
    async getStudentsByParentId(parentId) {
        return this.studentRepo.findByParentId(parentId);
    }
}

module.exports = StudentService;
