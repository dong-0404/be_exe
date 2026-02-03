const SubjectService = require('../services/subject.service');
const { success } = require('../utils/response');

const subjectService = new SubjectService();

/**
 * Subject Controller - HTTP Layer
 */
class SubjectController {
    /**
     * Get all active subjects (for dropdown/selection)
     * GET /subjects
     */
    async getAllSubjects(req, res, next) {
        try {
            const subjects = await subjectService.getAllActiveSubjects();

            return success(res, {
                data: subjects,
                message: 'Subjects retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get subject by ID
     * GET /subjects/:id
     */
    async getSubjectById(req, res, next) {
        try {
            const { id } = req.params;
            const subject = await subjectService.getSubjectById(id);

            return success(res, {
                data: subject,
                message: 'Subject retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Search subjects
     * GET /subjects/search?q=keyword
     */
    async searchSubjects(req, res, next) {
        try {
            const { q } = req.query;
            const subjects = await subjectService.searchSubjects(q);

            return success(res, {
                data: subjects,
                message: 'Search completed successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SubjectController;
