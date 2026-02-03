const cloudinary = require('../config/cloudinary');
const config = require('../config/env');
const fs = require('fs').promises;

/**
 * Cloudinary Service - Handle image uploads to Cloudinary
 */
class CloudinaryService {
    /**
     * Upload single image to Cloudinary
     * @param {string} filePath - Local file path
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result with secure_url and public_id
     */
    async uploadImage(filePath, options = {}) {
        try {
            const uploadOptions = {
                folder: options.folder || config.cloudinary.uploadFolder,
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                transformation: [
                    { width: 2000, height: 2000, crop: 'limit' }, // Max size
                    { quality: 'auto' }, // Auto quality
                    { fetch_format: 'auto' }, // Auto format
                ],
                ...options,
            };

            const result = await cloudinary.uploader.upload(filePath, uploadOptions);

            // Clean up local file after upload
            await this.cleanupLocalFile(filePath);

            return {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
            };
        } catch (error) {
            // Clean up local file even if upload fails
            await this.cleanupLocalFile(filePath);
            throw this.handleError(error);
        }
    }

    /**
     * Upload multiple images to Cloudinary
     * @param {Array<string>} filePaths - Array of local file paths
     * @param {Object} options - Upload options
     * @returns {Promise<Array<Object>>} Array of upload results
     */
    async uploadMultipleImages(filePaths, options = {}) {
        try {
            const uploadPromises = filePaths.map((filePath) =>
                this.uploadImage(filePath, options)
            );
            return await Promise.all(uploadPromises);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Delete image from Cloudinary
     * @param {string} publicId - Cloudinary public_id
     * @returns {Promise<Object>} Delete result
     */
    async deleteImage(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);

            if (result.result !== 'ok' && result.result !== 'not found') {
                throw new Error(`Failed to delete image: ${result.result}`);
            }

            return result;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Delete multiple images from Cloudinary
     * @param {Array<string>} publicIds - Array of Cloudinary public_ids
     * @returns {Promise<Array<Object>>} Array of delete results
     */
    async deleteMultipleImages(publicIds) {
        try {
            const deletePromises = publicIds.map((publicId) =>
                this.deleteImage(publicId).catch((err) => ({
                    publicId,
                    error: err.message,
                }))
            );
            return await Promise.all(deletePromises);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Extract public_id from Cloudinary URL
     * @param {string} imageUrl - Cloudinary image URL
     * @returns {string|null} Public ID or null if invalid
     */
    extractPublicId(imageUrl) {
        try {
            // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
            const matches = imageUrl.match(/\/v\d+\/(.+)\.\w+$/);
            return matches ? matches[1] : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Clean up local file
     * @param {string} filePath - Local file path to delete
     */
    async cleanupLocalFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            // Ignore error if file doesn't exist
            if (error.code !== 'ENOENT') {
                console.error(`Failed to delete local file ${filePath}:`, error);
            }
        }
    }

    /**
     * Handle Cloudinary errors
     * @param {Error} error - Original error
     * @returns {Error} Formatted error
     */
    handleError(error) {
        const formattedError = new Error(
            error.message || 'Failed to process image with Cloudinary'
        );
        formattedError.statusCode = 500;

        // Handle specific Cloudinary errors
        if (error.http_code) {
            formattedError.statusCode = error.http_code;
        }

        if (error.message && error.message.includes('File size too large')) {
            formattedError.statusCode = 413;
            formattedError.message = 'File size is too large. Maximum size is 10MB.';
        }

        if (error.message && error.message.includes('Invalid image file')) {
            formattedError.statusCode = 400;
            formattedError.message = 'Invalid image file format.';
        }

        return formattedError;
    }
}

module.exports = CloudinaryService;
