const CloudinaryService = require('../services/cloudinary.service');
const AttachmentRepository = require('../repositories/attachment.repository');
const { success } = require('../utils/response');
const { MessageType } = require('../constants/enums');

const cloudinaryService = new CloudinaryService();
const attachmentRepo = new AttachmentRepository();

/**
 * Chat Upload Controller - Handle file uploads for chat messages
 */
class ChatUploadController {
    /**
     * Upload file/image for chat
     * POST /api/v1/chat/upload
     * @body file - File to upload (single file)
     */
    async uploadFile(req, res, next) {
        try {
            if (!req.file) {
                const error = new Error('Không có file được tải lên');
                error.statusCode = 400;
                throw error;
            }

            const userId = req.user.id;
            const file = req.file;

            // Determine message type based on MIME type
            let messageType = MessageType.FILE;
            if (file.mimetype.startsWith('image/')) {
                messageType = MessageType.IMAGE;
            }

            // Upload to Cloudinary with chat-attachments folder
            const result = await cloudinaryService.uploadImage(file.path, {
                folder: 'chat-attachments',
            });

            // Create attachment record
            const attachment = await attachmentRepo.create({
                url: result.url,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedBy: userId,
            });

            return success(res, {
                data: {
                    _id: attachment._id,
                    url: result.url,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    messageType,
                },
                message: 'Tải file lên thành công',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upload multiple files for chat
     * POST /api/v1/chat/upload/multiple
     * @body files - Files to upload (multiple files, max 5)
     */
    async uploadMultipleFiles(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                const error = new Error('Không có file được tải lên');
                error.statusCode = 400;
                throw error;
            }

            const userId = req.user.id;

            // Upload all files to Cloudinary
            const filePaths = req.files.map((file) => file.path);
            const uploadResults = await cloudinaryService.uploadMultipleImages(
                filePaths,
                {
                    folder: 'chat-attachments',
                }
            );

            // Create attachment records
            const attachments = await Promise.all(
                req.files.map(async (file, index) => {
                    const uploadResult = uploadResults[index];
                    let messageType = MessageType.FILE;
                    if (file.mimetype.startsWith('image/')) {
                        messageType = MessageType.IMAGE;
                    }

                    return attachmentRepo.create({
                        url: uploadResult.url,
                        fileName: file.originalname,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                        uploadedBy: userId,
                    });
                })
            );

            return success(res, {
                data: {
                    attachments: attachments.map((att, index) => ({
                        _id: att._id,
                        url: uploadResults[index].url,
                        fileName: req.files[index].originalname,
                        fileSize: req.files[index].size,
                        mimeType: req.files[index].mimetype,
                        messageType: req.files[index].mimetype.startsWith('image/')
                            ? MessageType.IMAGE
                            : MessageType.FILE,
                    })),
                    count: attachments.length,
                },
                message: `Đã tải lên ${attachments.length} file thành công`,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChatUploadController;
