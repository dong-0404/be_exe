const GradeRepository = require('../repositories/grade.repository');
const { EntityStatus } = require('../constants/enums');

/**
 * Grade Service - Business Logic Layer
 */
class GradeService {
    constructor() {
        this.gradeRepo = new GradeRepository();
    }

    /**
     * Get all active grades
     * @returns {Promise<Array>} List of active grades (sorted by orderNumber)
     */
    async getAllActiveGrades() {
        return await this.gradeRepo.findAllActive();
    }

    /**
     * Get all grades with pagination
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Paginated grades
     */
    async getAllGrades(options = {}) {
        const { page = 1, limit = 12 } = options;

        return await this.gradeRepo.findAll({
            page,
            limit,
            filter: { status: EntityStatus.ACTIVE }
        });
    }

    /**
     * Get grade by ID
     * @param {string} id - Grade ID
     * @returns {Promise<Object>} Grade
     */
    async getGradeById(id) {
        const grade = await this.gradeRepo.findById(id);

        if (!grade) {
            const error = new Error('Grade not found');
            error.statusCode = 404;
            throw error;
        }

        return grade;
    }
}

module.exports = GradeService;
