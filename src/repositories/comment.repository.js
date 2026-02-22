const CommentModel = require('../models/comment.model');
const { CommentStatus } = require('../constants/enums');

/**
 * Comment Repository - Data Access Layer
 */
class CommentRepository {
    /**
     * Find comment by ID
     * @param {string} id - Comment ID
     * @returns {Promise<Object>} Comment document
     */
    async findById(id) {
        return CommentModel.findById(id);
    }

    /**
     * Find comments by post ID
     * @param {string} postId - Post ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of comments
     */
    async findByPostId(postId, options = {}) {
        const { includeDeleted = false } = options;

        const query = { postId };
        if (!includeDeleted) {
            query.status = CommentStatus.ACTIVE;
        }

        return CommentModel.find(query)
            .sort({ createdAt: 1 })
            .populate('authorId', 'email phone role')
            .lean();
    }

    /**
     * Find top-level comments (no parentId)
     * @param {string} postId - Post ID
     * @returns {Promise<Array>} Array of top-level comments
     */
    async findTopLevelComments(postId) {
        return CommentModel.find({
            postId,
            parentId: null,
            status: CommentStatus.ACTIVE,
        })
            .sort({ createdAt: 1 })
            .populate('authorId', 'email phone role')
            .lean();
    }

    /**
     * Find replies to a comment
     * @param {string} parentId - Parent comment ID
     * @returns {Promise<Array>} Array of reply comments
     */
    async findReplies(parentId) {
        return CommentModel.find({
            parentId,
            status: CommentStatus.ACTIVE,
        })
            .sort({ createdAt: 1 })
            .populate('authorId', 'email phone role')
            .lean();
    }

    /**
     * Get nested comments structure for a post
     * @param {string} postId - Post ID
     * @returns {Promise<Array>} Array of comments with nested replies
     */
    async findNestedComments(postId) {
        // Get all active comments for the post
        const comments = await CommentModel.find({
            postId,
            status: CommentStatus.ACTIVE,
        })
            .sort({ createdAt: 1 })
            .populate('authorId', 'email phone role')
            .lean();

        // Build nested structure
        const commentMap = new Map();
        const topLevelComments = [];

        // First pass: create map
        comments.forEach((comment) => {
            comment.replies = [];
            commentMap.set(comment._id.toString(), comment);
        });

        // Second pass: build tree
        comments.forEach((comment) => {
            if (comment.parentId) {
                const parent = commentMap.get(comment.parentId.toString());
                if (parent) {
                    parent.replies.push(comment);
                }
            } else {
                topLevelComments.push(comment);
            }
        });

        return topLevelComments;
    }

    /**
     * Create new comment
     * @param {Object} commentData - Comment data
     * @returns {Promise<Object>} Created comment
     */
    async create(commentData) {
        const comment = await CommentModel.create(commentData);
        return comment.populate('authorId', 'email phone role');
    }

    /**
     * Update comment by ID
     * @param {string} id - Comment ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated comment
     */
    async update(id, updateData) {
        return CommentModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('authorId', 'email phone role');
    }

    /**
     * Soft delete comment (set status to DELETED)
     * @param {string} id - Comment ID
     * @returns {Promise<Object>} Deleted comment
     */
    async softDelete(id) {
        return CommentModel.findByIdAndUpdate(
            id,
            { status: CommentStatus.DELETED },
            { new: true }
        );
    }

    /**
     * Toggle like on comment
     * @param {string} commentId - Comment ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated comment and action performed
     */
    async toggleLike(commentId, userId) {
        const comment = await CommentModel.findById(commentId);

        if (!comment) {
            return null;
        }

        const userIdStr = userId.toString();
        const index = comment.likedBy.findIndex(
            (id) => id.toString() === userIdStr
        );

        let action = '';
        if (index > -1) {
            // Unlike
            comment.likedBy.splice(index, 1);
            comment.likes = Math.max(0, comment.likes - 1);
            action = 'unliked';
        } else {
            // Like
            comment.likedBy.push(userId);
            comment.likes += 1;
            action = 'liked';
        }

        await comment.save();
        await comment.populate('authorId', 'email phone role');

        return { comment, action };
    }

    /**
     * Check if user is comment author
     * @param {string} commentId - Comment ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if user is author
     */
    async isAuthor(commentId, userId) {
        const comment = await CommentModel.findById(commentId).select(
            'authorId'
        );
        return comment && comment.authorId.toString() === userId.toString();
    }

    /**
     * Count comments by post ID
     * @param {string} postId - Post ID
     * @returns {Promise<number>} Number of active comments
     */
    async countByPostId(postId) {
        return CommentModel.countDocuments({
            postId,
            status: CommentStatus.ACTIVE,
        });
    }

    /**
     * Delete all comments for a post
     * @param {string} postId - Post ID
     * @returns {Promise<Object>} Delete result
     */
    async deleteByPostId(postId) {
        return CommentModel.updateMany(
            { postId },
            { status: CommentStatus.DELETED }
        );
    }
}

module.exports = CommentRepository;
