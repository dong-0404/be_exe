const GradeService = require('../services/grade.service');
const { success } = require('../utils/response');

const gradeService = new GradeService();

/**
 * Grade Controller - HTTP Layer
 */
class GradeController {
    /**
     * Get all active grades (for dropdown/selection)
     * GET /grades
     */
    async getAllGrades(req, res, next) {
        try {
            const grades = await gradeService.getAllActiveGrades();

            return success(res, {
                data: grades,
                message: 'Grades retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get grade by ID
     * GET /grades/:id
     */
    async getGradeById(req, res, next) {
        try {
            const { id } = req.params;
            const grade = await gradeService.getGradeById(id);

            return success(res, {
                data: grade,
                message: 'Grade retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = GradeController;
