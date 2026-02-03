const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Upload Middleware - Handle file uploads with Multer
 */

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});

// File filter - only allow images
const imageFileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'
            ),
            false
        );
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 5, // Max 5 files per request
    },
});

/**
 * Middleware for single image upload
 * Usage: upload.single('image')
 */
const uploadSingle = (fieldName = 'image') => {
    return (req, res, next) => {
        const uploadHandler = upload.single(fieldName);

        uploadHandler(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const error = new Error('File size is too large. Maximum size is 10MB.');
                    error.statusCode = 413;
                    return next(error);
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    const error = new Error(`Unexpected field name. Expected: ${fieldName}`);
                    error.statusCode = 400;
                    return next(error);
                }
                const error = new Error(err.message);
                error.statusCode = 400;
                return next(error);
            } else if (err) {
                // Other errors
                const error = new Error(err.message || 'Failed to upload file');
                error.statusCode = 400;
                return next(error);
            }

            // No file uploaded
            if (!req.file) {
                const error = new Error('Please upload an image file');
                error.statusCode = 400;
                return next(error);
            }

            next();
        });
    };
};

/**
 * Middleware for multiple images upload
 * Usage: upload.multiple('images', 5)
 */
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
    return (req, res, next) => {
        const uploadHandler = upload.array(fieldName, maxCount);

        uploadHandler(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const error = new Error('File size is too large. Maximum size is 10MB.');
                    error.statusCode = 413;
                    return next(error);
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    const error = new Error(
                        `Too many files or unexpected field name. Expected: ${fieldName}, Max: ${maxCount}`
                    );
                    error.statusCode = 400;
                    return next(error);
                }
                const error = new Error(err.message);
                error.statusCode = 400;
                return next(error);
            } else if (err) {
                // Other errors
                const error = new Error(err.message || 'Failed to upload files');
                error.statusCode = 400;
                return next(error);
            }

            // No files uploaded
            if (!req.files || req.files.length === 0) {
                const error = new Error('Please upload at least one image file');
                error.statusCode = 400;
                return next(error);
            }

            next();
        });
    };
};

/**
 * Middleware for optional single image upload
 * Won't throw error if no file is uploaded
 */
const uploadSingleOptional = (fieldName = 'image') => {
    return (req, res, next) => {
        const uploadHandler = upload.single(fieldName);

        uploadHandler(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const error = new Error('File size is too large. Maximum size is 10MB.');
                    error.statusCode = 413;
                    return next(error);
                }
                const error = new Error(err.message);
                error.statusCode = 400;
                return next(error);
            } else if (err) {
                const error = new Error(err.message || 'Failed to upload file');
                error.statusCode = 400;
                return next(error);
            }

            // Continue even if no file uploaded
            next();
        });
    };
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    uploadSingleOptional,
};
