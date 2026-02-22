const PostModel = require('../models/post.model');
const { PostStatus } = require('../constants/enums');

/**
 * Post Repository - Data Access Layer
 */
class PostRepository {
    /**
     * Find post by ID
     * @param {string} id - Post ID
     * @returns {Promise<Object>} Post document
     */
    async findById(id) {
        return PostModel.findById(id);
    }

    /**
     * Find post by ID with detailed info (populated)
     * @param {string} id - Post ID
     * @returns {Promise<Object>} Post with author and comments populated
     */
    async findByIdWithDetails(id) {
        return PostModel.findOne({ _id: id, status: PostStatus.ACTIVE })
            .populate('authorId', 'email phone role')
            .lean();
    }

    /**
     * Find posts with pagination and filters
     * @param {Object} filters - Query filters
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Posts array and total count
     */
    async findWithPagination(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Build query - only active posts
        const query = { status: PostStatus.ACTIVE, ...filters };

        // Execute query
        const [posts, total] = await Promise.all([
            PostModel.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('authorId', 'email phone role')
                .lean(),
            PostModel.countDocuments(query),
        ]);

        return { posts, total };
    }

    /**
     * Create new post
     * @param {Object} postData - Post data
     * @returns {Promise<Object>} Created post
     */
    async create(postData) {
        const post = await PostModel.create(postData);
        return post.populate('authorId', 'email phone role');
    }

    /**
     * Update post by ID
     * @param {string} id - Post ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} Updated post
     */
    async update(id, updateData) {
        return PostModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('authorId', 'email phone role');
    }

    /**
     * Soft delete post (set status to DELETED)
     * @param {string} id - Post ID
     * @returns {Promise<Object>} Deleted post
     */
    async softDelete(id) {
        return PostModel.findByIdAndUpdate(
            id,
            { status: PostStatus.DELETED },
            { new: true }
        );
    }

    /**
     * Hard delete post (remove from database)
     * @param {string} id - Post ID
     * @returns {Promise<Object>} Delete result
     */
    async hardDelete(id) {
        return PostModel.findByIdAndDelete(id);
    }

    /**
     * Toggle like on post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated post and action performed
     */
    async toggleLike(postId, userId) {
        const post = await PostModel.findById(postId);

        if (!post) {
            return null;
        }

        const userIdStr = userId.toString();
        const index = post.likedBy.findIndex(
            (id) => id.toString() === userIdStr
        );

        let action = '';
        if (index > -1) {
            // Unlike
            post.likedBy.splice(index, 1);
            post.likes = Math.max(0, post.likes - 1);
            action = 'unliked';
        } else {
            // Like
            post.likedBy.push(userId);
            post.likes += 1;
            action = 'liked';
        }

        await post.save();
        await post.populate('authorId', 'email phone role');

        return { post, action };
    }

    /**
     * Add user to sharedBy array and increment shares count
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated post
     */
    async incrementShare(postId, userId) {
        const post = await PostModel.findById(postId);

        if (!post) {
            return null;
        }

        const userIdStr = userId.toString();
        const alreadyShared = post.sharedBy.some(
            (id) => id.toString() === userIdStr
        );

        if (!alreadyShared) {
            post.sharedBy.push(userId);
            post.shares += 1;
            await post.save();
        }

        await post.populate('authorId', 'email phone role');
        return post;
    }

    /**
     * Update comments count (increment or decrement)
     * @param {string} postId - Post ID
     * @param {number} increment - Amount to increment (can be negative)
     * @returns {Promise<Object>} Updated post
     */
    async updateCommentsCount(postId, increment = 1) {
        return PostModel.findByIdAndUpdate(
            postId,
            { $inc: { commentsCount: increment } },
            { new: true }
        );
    }

    /**
     * Check if user is post author
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} True if user is author
     */
    async isAuthor(postId, userId) {
        const post = await PostModel.findById(postId).select('authorId');
        return post && post.authorId.toString() === userId.toString();
    }
}

module.exports = PostRepository;
