const express = require('express');
const SubjectController = require('../controllers/subject.controller');

const router = express.Router();
const subjectController = new SubjectController();

/**
 * Subject Routes
 * Public routes - no authentication required
 */

/**
 * @route   GET /subjects
 * @desc    Get all active subjects
 * @access  Public
 * @returns Array of subjects sorted by name
 */
router.get('/', subjectController.getAllSubjects.bind(subjectController));

/**
 * @route   GET /subjects/search
 * @desc    Search subjects by name
 * @access  Public
 * @query   q - Search keyword
 */
router.get('/search', subjectController.searchSubjects.bind(subjectController));

/**
 * @route   GET /subjects/:id
 * @desc    Get subject by ID
 * @access  Public
 */
router.get('/:id', subjectController.getSubjectById.bind(subjectController));

module.exports = router;
