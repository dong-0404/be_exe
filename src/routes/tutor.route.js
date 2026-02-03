const express = require('express');
const TutorController = require('../controllers/tutor.controller');
const { authenticate, flexibleAuth } = require('../middlewares/auth.middleware');
const { uploadMultiple, uploadSingleOptional } = require('../middlewares/upload.middleware');

const router = express.Router();
const tutorController = new TutorController();

/**
 * Public Tutor Routes (Search & List)
 */

/**
 * @route   GET /tutors/search
 * @desc    Search and filter tutors
 * @access  Public
 * @query   name - Tutor name (partial match)
 * @query   subjects - Subject IDs (comma-separated or array)
 * @query   grades - Grade IDs (comma-separated or array)
 * @query   teachingArea - Teaching area (partial match)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   sortBy - Sort field (default: createdAt)
 * @query   sortOrder - Sort order: asc/desc (default: desc)
 */
router.get('/search', tutorController.searchTutors.bind(tutorController));

/**
 * @route   GET /tutors
 * @desc    Get all approved tutors (public listing)
 * @access  Public
 * @query   page - Page number
 * @query   limit - Items per page
 */
router.get('/', tutorController.getAllTutors.bind(tutorController));

/**
 * @route   GET /tutors/:id/detail
 * @desc    Get tutor detailed information with certificates
 * @access  Public
 */
router.get('/:id/detail', tutorController.getTutorDetail.bind(tutorController));

/**
 * @route   GET /tutors/:id/feedbacks
 * @desc    Get tutor feedbacks with pagination
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10, max: 100)
 */
router.get('/:id/feedbacks', tutorController.getTutorFeedbacks.bind(tutorController));

/**
 * Tutor Profile Routes
 * Support both authenticated (token) and onboarding (email) flows
 */

/**
 * @route   POST /tutors/profile
 * @desc    Create tutor profile (Step 1)
 * @access  Flexible (Token or Email)
 * @body    Required if no token: email
 * @body    fullName, dateOfBirth, gender, hourlyRate
 * @body    Optional: placeOfBirth, teachingArea
 */
router.post('/profile', flexibleAuth, tutorController.createProfile.bind(tutorController));

/**
 * @route   PUT /tutors/profile
 * @desc    Update tutor profile (Step 2, 3)
 * @access  Flexible (Token or Email)
 * @body    Required if no token: email
 * @body    Step 2: identityNumber
 * @body    Step 3: subjects[], grades[], availableDays[], availableTimeSlots[]
 */
router.put('/profile', flexibleAuth, tutorController.updateProfile.bind(tutorController));

/**
 * @route   GET /tutors/profile/progress
 * @desc    Get profile completion progress
 * @access  Private (requires token)
 */
router.get('/profile/progress', authenticate, tutorController.getProfileProgress.bind(tutorController));

/**
 * @route   GET /tutors/profile/:userId
 * @desc    Get tutor profile by userId (public)
 * @access  Public
 */
router.get('/profile/:userId', tutorController.getProfileByUserId.bind(tutorController));

/**
 * @route   GET /tutors/profile
 * @desc    Get tutor profile (current user)
 * @access  Flexible (Token or Email query param)
 */
router.get('/profile', flexibleAuth, tutorController.getProfile.bind(tutorController));

/**
 * Certificate Routes (Step 4)
 */

/**
 * @route   POST /tutors/certificates
 * @desc    Add certificate with images (Step 4)
 * @access  Flexible (Token or Email)
 * @body    Required if no token: email
 * @body    schoolName, major, educationStatus
 * @body    images (files, optional, max 5)
 */
router.post(
    '/certificates',
    flexibleAuth,
    uploadMultiple('images', 5),
    tutorController.addCertificate.bind(tutorController)
);

/**
 * @route   GET /tutors/certificates
 * @desc    Get all certificates for current tutor
 * @access  Private (Tutor only)
 */
router.get('/certificates', authenticate, tutorController.getMyCertificates.bind(tutorController));

/**
 * @route   PUT /tutors/certificates/:id
 * @desc    Update certificate (can add new images)
 * @access  Private (Tutor only)
 * @body    {string} [schoolName] - School name
 * @body    {string} [major] - Major/specialization
 * @body    {number} [educationStatus] - Education status
 * @body    {files} [images] - Additional certificate images (optional, max 5 files)
 */
router.put(
    '/certificates/:id',
    authenticate,
    uploadSingleOptional('images'), // Optional upload for update
    tutorController.updateCertificate.bind(tutorController)
);

/**
 * @route   DELETE /tutors/certificates/:id
 * @desc    Delete certificate and all its images
 * @access  Private (Tutor only)
 */
router.delete('/certificates/:id', authenticate, tutorController.deleteCertificate.bind(tutorController));

/**
 * @route   DELETE /tutors/certificates/:id/images
 * @desc    Remove specific images from certificate
 * @access  Private (Tutor only)
 * @body    {string[]} imageUrls - Array of image URLs to remove
 */
router.delete('/certificates/:id/images', authenticate, tutorController.removeCertificateImages.bind(tutorController));

module.exports = router;
