const PostService = require('../services/post.service');
const { success, paginated } = require('../utils/response');

/**
 * Post Controller - Handle post-related requests
 */
class PostController {
    constructor() {
        this.postService = new PostService();
    }

    /**
     * Get all posts with pagination and filters
     * GET /community/posts
     * @query page - Page number (default: 1)
     * @query limit - Items per page (default: 10, max: 50)
     * @query tags - Array or comma-separated string of tags
     * @query postType - Post type (1=findTutor, 2=share)
     * @query authorId - Filter by author
     * @query sortBy - Sort field (default: createdAt)
     * @query sortOrder - Sort order (default: desc)
     */
    async getAllPosts(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                tags,
                postType,
                authorId,
                sortBy = 'createdAt',
                sortOrder = 'desc',
            } = req.query;

            // Validate and parse pagination
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

            // Build filters
            const filters = {};
            if (tags) filters.tags = tags;
            if (postType) filters.postType = postType;
            if (authorId) filters.authorId = authorId;

            // Build options
            const options = {
                page: pageNum,
                limit: limitNum,
                sortBy,
                sortOrder,
            };

            // Get posts
            const { posts, total } = await this.postService.getAllPosts(
                filters,
                options
            );

            return paginated(res, {
                data: posts,
                page: pageNum,
                limit: limitNum,
                total,
                message: 'Lấy danh sách bài viết thành công',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get post by ID
     * GET /community/posts/:id
     */
    async getPostById(req, res, next) {
        try {
            const { id } = req.params;

            const post = await this.postService.getPostById(id);

            return success(res, {
                data: post,
                message: 'Lấy thông tin bài viết thành công',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new post
     * POST /community/posts
     * @body content - Post content (required, max 5000 chars)
     * @body images - Array of image URLs (optional, max 5)
     * @body tags - Array of tags (required, min 1)
     * @body postType - Post type (required, 1 or 2)
     */
    async createPost(req, res, next) {
        try {
            const { content, images, tags, postType } = req.body;
            const userId = req.user.id; // Fix: use 'id' instead of 'userId'

            // Create post
            const post = await this.postService.createPost(
                {
                    content,
                    images: images || [],
                    tags,
                    postType: parseInt(postType),
                },
                userId
            );

            return success(res, {
                data: post,
                message: 'Tạo bài viết thành công',
                statusCode: 201,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle like on post
     * POST /community/posts/:id/like
     */
    async likePost(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id; // Fix: use 'id' instead of 'userId'

            const { post, message } = await this.postService.toggleLike(
                id,
                userId
            );

            return success(res, {
                data: post,
                message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Share post
     * POST /community/posts/:id/share
     */
    async sharePost(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id; // Fix: use 'id' instead of 'userId'

            const post = await this.postService.sharePost(id, userId);

            return success(res, {
                data: post,
                message: 'Đã chia sẻ bài viết',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete post
     * DELETE /community/posts/:id
     */
    async deletePost(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id; // Fix: use 'id' instead of 'userId'
            const userRole = req.user.role;

            await this.postService.deletePost(id, userId, userRole);

            return success(res, {
                message: 'Đã xóa bài viết',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PostController;
