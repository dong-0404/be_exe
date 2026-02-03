const SubjectRepository = require('../repositories/subject.repository');
const { EntityStatus } = require('../constants/enums');

/**
 * Subject Service - Business Logic Layer
 */
class SubjectService {
    constructor() {
        this.subjectRepo = new SubjectRepository();
    }

    /**
     * Get all active subjects
     * @returns {Promise<Array>} List of active subjects
     */
    async getAllActiveSubjects() {
        return await this.subjectRepo.findAllActive();
    }

    /**
     * Get all subjects with pagination
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Paginated subjects
     */
    async getAllSubjects(options = {}) {
        const { page = 1, limit = 50 } = options;

        return await this.subjectRepo.findAll({
            page,
            limit,
            filter: { status: EntityStatus.ACTIVE }
        });
    }

    /**
     * Get subject by ID
     * @param {string} id - Subject ID
     * @returns {Promise<Object>} Subject
     */
    async getSubjectById(id) {
        const subject = await this.subjectRepo.findById(id);

        if (!subject) {
            const error = new Error('Subject not found');
            error.statusCode = 404;
            throw error;
        }

        return subject;
    }

    /**
     * Search subjects
     * @param {string} searchText - Search text
     * @returns {Promise<Array>} Search results
     */
    async searchSubjects(searchText) {
        if (!searchText || searchText.trim() === '') {
            return [];
        }

        return await this.subjectRepo.search(searchText);
    }
}

module.exports = SubjectService;
