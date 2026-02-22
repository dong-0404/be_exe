const CommentService = require('../services/comment.service');
const { success } = require('../utils/response');

/**
 * Comment Controller - Handle comment-related requests
 */
class CommentController {
    constructor() {
        this.commentService = new CommentService();
    }

    /**
     * Add comment to post
     * POST /community/posts/:postId/comments
     * @body content - Comment content (required, max 1000 chars)
     * @body parentId - Parent comment ID for nested replies (optional)
     */
    async addComment(req, res, next) {
        try {
            const { postId } = req.params;
            const { content, parentId } = req.body;
            const userId = req.user.id; // Fix: use 'id' instead of 'userId'

            const comment = await this.commentService.addComment(
                postId,
                { content, parentId },
                userId
            );

            return success(res, {
                data: comment,
                message: 'Đã thêm bình luận',
                statusCode: 201,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle like on comment
     * POST /community/posts/:postId/comments/:commentId/like
     */
    async likeComment(req, res, next) {
        try {
            const { commentId } = req.params;
            const userId = req.user.id; // Fix: use 'id' instead of 'userId'

            const { comment, message } =
                await this.commentService.toggleLike(commentId, userId);

            return success(res, {
                data: comment,
                message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete comment
     * DELETE /community/posts/:postId/comments/:commentId
     */
    async deleteComment(req, res, next) {
        try {
            const { postId, commentId } = req.params;
            const userId = req.user.id; // Fix: use 'id' instead of 'userId'
            const userRole = req.user.role;

            await this.commentService.deleteComment(
                postId,
                commentId,
                userId,
                userRole
            );

            return success(res, {
                message: 'Đã xóa bình luận',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get comments for a post
     * GET /community/posts/:postId/comments
     */
    async getComments(req, res, next) {
        try {
            const { postId } = req.params;

            const comments =
                await this.commentService.getCommentsByPostId(postId);

            return success(res, {
                data: comments,
                message: 'Lấy danh sách bình luận thành công',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CommentController;
