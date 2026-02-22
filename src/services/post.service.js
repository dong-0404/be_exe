const PostRepository = require('../repositories/post.repository');
const CommentRepository = require('../repositories/comment.repository');
const UserRepository = require('../repositories/user.repository');
const UserService = require('./user.service');
const { PostType } = require('../constants/enums');

/**
 * Post Service - Business Logic Layer
 */
class PostService {
    constructor() {
        this.postRepo = new PostRepository();
        this.commentRepo = new CommentRepository();
        this.userRepo = new UserRepository();
        this.userService = new UserService();
    }

    /**
     * Get all posts with pagination and filters
     * @param {Object} filters - Query filters
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Posts with pagination data
     */
    async getAllPosts(filters = {}, options = {}) {
        // Build query filters
        const query = {};

        if (filters.postType) {
            query.postType = parseInt(filters.postType);
        }

        if (filters.authorId) {
            query.authorId = filters.authorId;
        }

        if (filters.tags && filters.tags.length > 0) {
            // Support both array and comma-separated string
            const tagsArray = Array.isArray(filters.tags)
                ? filters.tags
                : filters.tags.split(',').map((t) => t.trim());
            query.tags = { $in: tagsArray };
        }

        // Get posts with pagination
        const { posts, total } = await this.postRepo.findWithPagination(
            query,
            options
        );

        // Enrich posts with comments and full user info
        const postsWithComments = await Promise.all(
            posts.map(async (post) => {
                // Get comments with nested structure
                const comments = await this.commentRepo.findNestedComments(
                    post._id
                );

                // Enrich author info for post
                const enrichedAuthor = await this.userService.enrichUserData(
                    post.authorId
                );

                // Enrich author info for comments recursively
                const enrichedComments = await this.enrichCommentsWithUserData(
                    comments
                );

                return {
                    ...post,
                    authorId: enrichedAuthor,
                    comments: enrichedComments,
                };
            })
        );

        return {
            posts: postsWithComments,
            total,
        };
    }

    /**
     * Enrich comments with full user data (recursive for nested replies)
     * @param {Array} comments - Array of comments
     * @returns {Promise<Array>} Comments with enriched user data
     */
    async enrichCommentsWithUserData(comments) {
        if (!comments || comments.length === 0) return [];

        return Promise.all(
            comments.map(async (comment) => {
                // Enrich author info
                const enrichedAuthor = await this.userService.enrichUserData(
                    comment.authorId
                );

                // Recursively enrich replies
                const enrichedReplies =
                    comment.replies && comment.replies.length > 0
                        ? await this.enrichCommentsWithUserData(
                            comment.replies
                        )
                        : [];

                return {
                    ...comment,
                    authorId: enrichedAuthor,
                    replies: enrichedReplies,
                };
            })
        );
    }

    /**
     * Get post by ID with full details
     * @param {string} postId - Post ID
     * @returns {Promise<Object>} Post with comments
     */
    async getPostById(postId) {
        const post = await this.postRepo.findByIdWithDetails(postId);

        if (!post) {
            const error = new Error('Bài viết không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Get nested comments
        const comments = await this.commentRepo.findNestedComments(postId);

        // Enrich author info for post
        const enrichedAuthor = await this.userService.enrichUserData(
            post.authorId
        );

        // Enrich author info for comments
        const enrichedComments = await this.enrichCommentsWithUserData(
            comments
        );

        return {
            ...post,
            authorId: enrichedAuthor,
            comments: enrichedComments,
        };
    }

    /**
     * Create new post
     * @param {Object} postData - Post data
     * @param {string} userId - User ID (author)
     * @returns {Promise<Object>} Created post
     */
    async createPost(postData, userId) {
        // Validate postType
        if (!Object.values(PostType).includes(postData.postType)) {
            const error = new Error('Loại bài viết không hợp lệ');
            error.statusCode = 400;
            throw error;
        }

        // Validate content
        if (!postData.content || postData.content.trim().length === 0) {
            const error = new Error('Nội dung bài viết không được để trống');
            error.statusCode = 400;
            throw error;
        }

        // Validate tags
        if (!postData.tags || postData.tags.length === 0) {
            const error = new Error('Bài viết phải có ít nhất một tag');
            error.statusCode = 400;
            throw error;
        }

        // Create post
        const post = await this.postRepo.create({
            ...postData,
            authorId: userId,
            likes: 0,
            likedBy: [],
            shares: 0,
            sharedBy: [],
            commentsCount: 0,
        });

        // Enrich author info
        const postObj = post.toObject();
        const enrichedAuthor = await this.userService.enrichUserData(
            postObj.authorId
        );

        return {
            ...postObj,
            authorId: enrichedAuthor,
            comments: [],
        };
    }

    /**
     * Toggle like on post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated post and message
     */
    async toggleLike(postId, userId) {
        const result = await this.postRepo.toggleLike(postId, userId);

        if (!result) {
            const error = new Error('Bài viết không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        const message =
            result.action === 'liked'
                ? 'Đã thích bài viết'
                : 'Đã bỏ thích bài viết';

        // Enrich author info
        const postObj = result.post.toObject();
        const enrichedAuthor = await this.userService.enrichUserData(
            postObj.authorId
        );

        return {
            post: {
                ...postObj,
                authorId: enrichedAuthor,
            },
            message,
        };
    }

    /**
     * Share post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated post
     */
    async sharePost(postId, userId) {
        const post = await this.postRepo.incrementShare(postId, userId);

        if (!post) {
            const error = new Error('Bài viết không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Enrich author info
        const postObj = post.toObject();
        const enrichedAuthor = await this.userService.enrichUserData(
            postObj.authorId
        );

        return {
            ...postObj,
            authorId: enrichedAuthor,
        };
    }

    /**
     * Delete post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID (requester)
     * @param {number} userRole - User role
     * @returns {Promise<void>}
     */
    async deletePost(postId, userId, userRole) {
        const post = await this.postRepo.findById(postId);

        if (!post) {
            const error = new Error('Bài viết không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Check authorization
        // Only author can delete (admin role check can be added here)
        const isAuthor = post.authorId.toString() === userId.toString();
        const isAdmin = userRole === 0; // Assuming 0 is admin role

        if (!isAuthor && !isAdmin) {
            const error = new Error(
                'Bạn không có quyền xóa bài viết này'
            );
            error.statusCode = 403;
            throw error;
        }

        // Soft delete
        await this.postRepo.softDelete(postId);

        // Optionally soft delete all comments
        // await this.commentRepo.deleteByPostId(postId);
    }

    /**
     * Check if user can delete post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if user can delete
     */
    async canDeletePost(postId, userId) {
        return this.postRepo.isAuthor(postId, userId);
    }
}

module.exports = PostService;
