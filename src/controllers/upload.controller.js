const CloudinaryService = require('../services/cloudinary.service');
const { success } = require('../utils/response');

const cloudinaryService = new CloudinaryService();

/**
 * Upload Controller - Handle file upload operations
 */
class UploadController {
    /**
     * Upload single image
     * POST /upload/image
     */
    async uploadImage(req, res, next) {
        try {
            if (!req.file) {
                const error = new Error('No file uploaded');
                error.statusCode = 400;
                throw error;
            }

            // Get optional folder from request body
            const folder = req.body.folder || undefined;

            // Upload to Cloudinary
            const result = await cloudinaryService.uploadImage(req.file.path, { folder });

            return success(res, {
                data: result,
                message: 'Image uploaded successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upload multiple images
     * POST /upload/images
     */
    async uploadMultipleImages(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                const error = new Error('No files uploaded');
                error.statusCode = 400;
                throw error;
            }

            // Get optional folder from request body
            const folder = req.body.folder || undefined;

            // Get file paths
            const filePaths = req.files.map((file) => file.path);

            // Upload to Cloudinary
            const results = await cloudinaryService.uploadMultipleImages(filePaths, {
                folder,
            });

            return success(res, {
                data: {
                    images: results,
                    count: results.length,
                },
                message: `${results.length} image(s) uploaded successfully`,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete image
     * DELETE /upload/image
     */
    async deleteImage(req, res, next) {
        try {
            const { imageUrl, publicId } = req.body;

            if (!imageUrl && !publicId) {
                const error = new Error('Please provide imageUrl or publicId');
                error.statusCode = 400;
                throw error;
            }

            // Extract publicId from URL if not provided
            let idToDelete = publicId;
            if (!idToDelete && imageUrl) {
                idToDelete = cloudinaryService.extractPublicId(imageUrl);
            }

            if (!idToDelete) {
                const error = new Error('Invalid image URL or publicId');
                error.statusCode = 400;
                throw error;
            }

            // Delete from Cloudinary
            await cloudinaryService.deleteImage(idToDelete);

            return success(res, {
                message: 'Image deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete multiple images
     * DELETE /upload/images
     */
    async deleteMultipleImages(req, res, next) {
        try {
            const { imageUrls, publicIds } = req.body;

            if ((!imageUrls || imageUrls.length === 0) && (!publicIds || publicIds.length === 0)) {
                const error = new Error('Please provide imageUrls or publicIds array');
                error.statusCode = 400;
                throw error;
            }

            // Extract publicIds from URLs if not provided
            let idsToDelete = publicIds || [];
            if (idsToDelete.length === 0 && imageUrls && imageUrls.length > 0) {
                idsToDelete = imageUrls
                    .map((url) => cloudinaryService.extractPublicId(url))
                    .filter((id) => id !== null);
            }

            if (idsToDelete.length === 0) {
                const error = new Error('No valid image URLs or publicIds provided');
                error.statusCode = 400;
                throw error;
            }

            // Delete from Cloudinary
            const results = await cloudinaryService.deleteMultipleImages(idsToDelete);

            return success(res, {
                data: {
                    results,
                    count: results.length,
                },
                message: `${results.length} image(s) processed for deletion`,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = UploadController;
