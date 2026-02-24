const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Chat Upload Middleware - Handle file uploads for chat (images and files)
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

// File filter - allow images and common file types
const chatFileFilter = (req, file, cb) => {
    // Allowed MIME types for chat
    const allowedMimes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ];

    // Get max file size from env or default to 10MB
    const maxFileSize = parseInt(process.env.CHAT_MAX_FILE_SIZE || '10485760', 10); // 10MB default

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX, TXT'
            ),
            false
        );
    }
};

// Multer configuration for chat
const chatUpload = multer({
    storage: storage,
    fileFilter: chatFileFilter,
    limits: {
        fileSize: parseInt(process.env.CHAT_MAX_FILE_SIZE || '10485760', 10), // 10MB default
        files: 5, // Max 5 files per request
    },
});

/**
 * Middleware for single file upload (chat)
 * Usage: uploadSingle('file')
 */
const uploadSingle = (fieldName = 'file') => {
    return (req, res, next) => {
        const uploadHandler = chatUpload.single(fieldName);

        uploadHandler(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const maxSizeMB = parseInt(process.env.CHAT_MAX_FILE_SIZE || '10485760', 10) / (1024 * 1024);
                    const error = new Error(`File size is too large. Maximum size is ${maxSizeMB}MB.`);
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
                const error = new Error('Please upload a file');
                error.statusCode = 400;
                return next(error);
            }

            next();
        });
    };
};

/**
 * Middleware for multiple files upload (chat)
 * Usage: uploadMultiple('files', 5)
 */
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
    return (req, res, next) => {
        const uploadHandler = chatUpload.array(fieldName, maxCount);

        uploadHandler(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const maxSizeMB = parseInt(process.env.CHAT_MAX_FILE_SIZE || '10485760', 10) / (1024 * 1024);
                    const error = new Error(`File size is too large. Maximum size is ${maxSizeMB}MB.`);
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
                const error = new Error('Please upload at least one file');
                error.statusCode = 400;
                return next(error);
            }

            next();
        });
    };
};

module.exports = {
    uploadSingle,
    uploadMultiple,
};
