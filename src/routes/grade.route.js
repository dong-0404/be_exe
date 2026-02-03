const express = require('express');
const GradeController = require('../controllers/grade.controller');

const router = express.Router();
const gradeController = new GradeController();

/**
 * Grade Routes
 * Public routes - no authentication required
 */

/**
 * @route   GET /grades
 * @desc    Get all active grades
 * @access  Public
 * @returns Array of grades sorted by orderNumber (1-12)
 */
router.get('/', gradeController.getAllGrades.bind(gradeController));

/**
 * @route   GET /grades/:id
 * @desc    Get grade by ID
 * @access  Public
 */
router.get('/:id', gradeController.getGradeById.bind(gradeController));

module.exports = router;
