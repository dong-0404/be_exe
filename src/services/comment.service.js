const CommentRepository = require('../repositories/comment.repository');
const PostRepository = require('../repositories/post.repository');
const UserService = require('./user.service');

/**
 * Comment Service - Business Logic Layer
 */
class CommentService {
    constructor() {
        this.commentRepo = new CommentRepository();
        this.postRepo = new PostRepository();
        this.userService = new UserService();
    }

    /**
     * Add comment to post
     * @param {string} postId - Post ID
     * @param {Object} commentData - Comment data
     * @param {string} userId - User ID (author)
     * @returns {Promise<Object>} Created comment
     */
    async addComment(postId, commentData, userId) {
        // Check if post exists
        const post = await this.postRepo.findById(postId);
        if (!post) {
            const error = new Error('Bài viết không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Validate content
        if (!commentData.content || commentData.content.trim().length === 0) {
            const error = new Error('Nội dung bình luận không được để trống');
            error.statusCode = 400;
            throw error;
        }

        // If parentId is provided, validate parent comment
        if (commentData.parentId) {
            const parentComment = await this.commentRepo.findById(
                commentData.parentId
            );

            if (!parentComment) {
                const error = new Error('Bình luận cha không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            // Validate parent comment belongs to the same post
            if (parentComment.postId.toString() !== postId.toString()) {
                const error = new Error(
                    'Bình luận cha không thuộc bài viết này'
                );
                error.statusCode = 400;
                throw error;
            }
        }

        // Create comment
        const comment = await this.commentRepo.create({
            postId,
            authorId: userId,
            content: commentData.content,
            parentId: commentData.parentId || null,
            likes: 0,
            likedBy: [],
        });

        // Update post comments count
        await this.postRepo.updateCommentsCount(postId, 1);

        // Enrich author info
        const commentObj = comment.toObject();
        const enrichedAuthor = await this.userService.enrichUserData(
            commentObj.authorId
        );

        return {
            ...commentObj,
            authorId: enrichedAuthor,
            replies: [],
        };
    }

    /**
     * Toggle like on comment
     * @param {string} commentId - Comment ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated comment and message
     */
    async toggleLike(commentId, userId) {
        const result = await this.commentRepo.toggleLike(commentId, userId);

        if (!result) {
            const error = new Error('Bình luận không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const message =
            result.action === 'liked'
                ? 'Đã thích bình luận'
                : 'Đã bỏ thích bình luận';

        // Enrich author info
        const commentObj = result.comment.toObject();
        const enrichedAuthor = await this.userService.enrichUserData(
            commentObj.authorId
        );

        return {
            comment: {
                ...commentObj,
                authorId: enrichedAuthor,
            },
            message,
        };
    }

    /**
     * Delete comment
     * @param {string} postId - Post ID
     * @param {string} commentId - Comment ID
     * @param {string} userId - User ID (requester)
     * @param {number} userRole - User role
     * @returns {Promise<void>}
     */
    async deleteComment(postId, commentId, userId, userRole) {
        const comment = await this.commentRepo.findById(commentId);

        if (!comment) {
            const error = new Error('Bình luận không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Validate comment belongs to the post
        if (comment.postId.toString() !== postId.toString()) {
            const error = new Error('Bình luận không thuộc bài viết này');
            error.statusCode = 400;
            throw error;
        }

        // Check authorization
        const isCommentAuthor =
            comment.authorId.toString() === userId.toString();
        const isPostAuthor = await this.postRepo.isAuthor(postId, userId);
        const isAdmin = userRole === 0; // Assuming 0 is admin role

        if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
            const error = new Error(
                'Bạn không có quyền xóa bình luận này'
            );
            error.statusCode = 403;
            throw error;
        }

        // Soft delete comment
        await this.commentRepo.softDelete(commentId);

        // Update post comments count
        await this.postRepo.updateCommentsCount(postId, -1);

        // Optional: Also delete replies to this comment
        // For now, we'll leave replies as is
    }

    /**
     * Get comments for a post
     * @param {string} postId - Post ID
     * @returns {Promise<Array>} Nested comments array
     */
    async getCommentsByPostId(postId) {
        // Check if post exists
        const post = await this.postRepo.findById(postId);
        if (!post) {
            const error = new Error('Bài viết không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        return this.commentRepo.findNestedComments(postId);
    }

    /**
     * Check if user can delete comment
     * @param {string} commentId - Comment ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if user can delete
     */
    async canDeleteComment(commentId, userId) {
        return this.commentRepo.isAuthor(commentId, userId);
    }
}

module.exports = CommentService;
