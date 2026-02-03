const express = require('express');
const UploadController = require('../controllers/upload.controller');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
const uploadController = new UploadController();

/**
 * Upload Routes
 * All routes require authentication
 */

/**
 * @route   POST /upload/image
 * @desc    Upload single image
 * @access  Private (authenticated users)
 * @body    {file} image - Image file (max 10MB)
 * @body    {string} [folder] - Optional folder name for organization
 */
router.post('/image', authenticate, uploadSingle('image'), uploadController.uploadImage.bind(uploadController));

/**
 * @route   POST /upload/images
 * @desc    Upload multiple images
 * @access  Private (authenticated users)
 * @body    {files} images - Image files (max 5 files, each max 10MB)
 * @body    {string} [folder] - Optional folder name for organization
 */
router.post('/images', authenticate, uploadMultiple('images', 5), uploadController.uploadMultipleImages.bind(uploadController));

/**
 * @route   DELETE /upload/image
 * @desc    Delete single image
 * @access  Private (authenticated users)
 * @body    {string} [imageUrl] - Cloudinary image URL
 * @body    {string} [publicId] - Cloudinary public ID (alternative to imageUrl)
 */
router.delete('/image', authenticate, uploadController.deleteImage.bind(uploadController));

/**
 * @route   DELETE /upload/images
 * @desc    Delete multiple images
 * @access  Private (authenticated users)
 * @body    {string[]} [imageUrls] - Array of Cloudinary image URLs
 * @body    {string[]} [publicIds] - Array of Cloudinary public IDs (alternative to imageUrls)
 */
router.delete('/images', authenticate, uploadController.deleteMultipleImages.bind(uploadController));

module.exports = router;
