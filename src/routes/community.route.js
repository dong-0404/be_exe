const express = require('express');
const PostController = require('../controllers/post.controller');
const CommentController = require('../controllers/comment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateBody, validateQuery } = require('../middlewares/validation.middleware');
const { PostType } = require('../constants/enums');

const router = express.Router();
const postController = new PostController();
const commentController = new CommentController();

/**
 * Validation Schemas
 */

// Validation for creating a post
const createPostSchema = {
    required: ['content', 'tags', 'postType'],
    fields: {
        content: {
            type: 'string',
            maxLength: 5000,
        },
        tags: {
            type: 'object', // Array
            custom: (value) => {
                if (!Array.isArray(value) || value.length === 0) {
                    return 'Tags must be a non-empty array';
                }
                return null;
            },
        },
        postType: {
            type: 'number',
            enum: Object.values(PostType),
        },
        images: {
            type: 'object', // Array, optional
        },
    },
};

// Validation for creating a comment
const createCommentSchema = {
    required: ['content'],
    fields: {
        content: {
            type: 'string',
            maxLength: 1000,
        },
        parentId: {
            type: 'string', // ObjectId string
        },
    },
};

// Validation for query parameters
const getPostsQuerySchema = {
    fields: {
        page: {
            type: 'number',
            min: 1,
        },
        limit: {
            type: 'number',
            min: 1,
            max: 50,
        },
        postType: {
            type: 'number',
            enum: Object.values(PostType),
        },
    },
};

/**
 * PUBLIC ROUTES
 */

/**
 * @route   GET /community/posts
 * @desc    Get all posts with pagination and filters
 * @access  Public
 * @query   page, limit, tags, postType, authorId, sortBy, sortOrder
 */
router.get('/posts', validateQuery(getPostsQuerySchema), postController.getAllPosts.bind(postController));

/**
 * @route   GET /community/posts/:id
 * @desc    Get post by ID with comments
 * @access  Public
 */
router.get('/posts/:id', postController.getPostById.bind(postController));

/**
 * PROTECTED ROUTES (require authentication)
 */

/**
 * @route   POST /community/posts
 * @desc    Create new post
 * @access  Private
 * @body    content, images, tags, postType
 */
router.post(
    '/posts',
    authenticate,
    validateBody(createPostSchema),
    postController.createPost.bind(postController)
);

/**
 * @route   POST /community/posts/:id/like
 * @desc    Toggle like on post
 * @access  Private
 */
router.post('/posts/:id/like', authenticate, postController.likePost.bind(postController));

/**
 * @route   POST /community/posts/:id/share
 * @desc    Share post
 * @access  Private
 */
router.post('/posts/:id/share', authenticate, postController.sharePost.bind(postController));

/**
 * @route   DELETE /community/posts/:id
 * @desc    Delete post
 * @access  Private (author or admin only)
 */
router.delete('/posts/:id', authenticate, postController.deletePost.bind(postController));

/**
 * COMMENT ROUTES
 */

/**
 * @route   POST /community/posts/:postId/comments
 * @desc    Add comment to post
 * @access  Private
 * @body    content, parentId (optional)
 */
router.post(
    '/posts/:postId/comments',
    authenticate,
    validateBody(createCommentSchema),
    commentController.addComment.bind(commentController)
);

/**
 * @route   POST /community/posts/:postId/comments/:commentId/like
 * @desc    Toggle like on comment
 * @access  Private
 */
router.post(
    '/posts/:postId/comments/:commentId/like',
    authenticate,
    commentController.likeComment.bind(commentController)
);

/**
 * @route   DELETE /community/posts/:postId/comments/:commentId
 * @desc    Delete comment
 * @access  Private (comment author, post author, or admin only)
 */
router.delete(
    '/posts/:postId/comments/:commentId',
    authenticate,
    commentController.deleteComment.bind(commentController)
);

/**
 * @route   GET /community/posts/:postId/comments
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/posts/:postId/comments', commentController.getComments.bind(commentController));

module.exports = router;
