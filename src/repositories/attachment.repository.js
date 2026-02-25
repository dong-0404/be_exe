const AttachmentModel = require('../models/attachment.model');

/**
 * Attachment Repository - Data Access Layer
 */
class AttachmentRepository {
    /**
     * Create new attachment
     * @param {Object} attachmentData - Attachment data
     * @returns {Promise<Object>} Created attachment
     */
    async create(attachmentData) {
        return AttachmentModel.create(attachmentData);
    }

    /**
     * Find attachment by ID
     * @param {string} id - Attachment ID
     * @returns {Promise<Object>} Attachment document
     */
    async findById(id) {
        return AttachmentModel.findById(id)
            .populate('uploadedBy', 'email phone role');
    }

    /**
     * Find attachments by uploader
     * @param {string} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Attachments array and total count
     */
    async findByUploader(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const query = { uploadedBy: userId };

        const [attachments, total] = await Promise.all([
            AttachmentModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('uploadedBy', 'email phone role')
                .lean(),
            AttachmentModel.countDocuments(query),
        ]);

        return { attachments, total };
    }
}

module.exports = AttachmentRepository;
