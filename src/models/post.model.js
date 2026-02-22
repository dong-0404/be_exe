const { Schema, model } = require('mongoose');
const { PostType, PostStatus } = require('../constants/enums');

const postSchema = new Schema(
    {
        authorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
            index: true,
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
            maxlength: [5000, 'Content cannot exceed 5000 characters'],
        },
        images: [{
            type: String,
            trim: true,
        }],
        tags: [{
            type: String,
            trim: true,
        }],
        postType: {
            type: Number,
            enum: Object.values(PostType),
            required: [true, 'Post type is required'],
            index: true,
        },
        likes: {
            type: Number,
            default: 0,
            min: [0, 'Likes cannot be negative'],
        },
        likedBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        shares: {
            type: Number,
            default: 0,
            min: [0, 'Shares cannot be negative'],
        },
        sharedBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        commentsCount: {
            type: Number,
            default: 0,
            min: [0, 'Comments count cannot be negative'],
        },
        status: {
            type: Number,
            enum: Object.values(PostStatus),
            default: PostStatus.ACTIVE,
            index: true,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Compound Indexes for efficient queries
postSchema.index({ authorId: 1, createdAt: -1 }); // Query posts by author
postSchema.index({ postType: 1, createdAt: -1 }); // Filter by type
postSchema.index({ tags: 1, createdAt: -1 }); // Filter by tags
postSchema.index({ likes: -1 }); // Sort by popularity
postSchema.index({ status: 1, createdAt: -1 }); // Active posts sorted by date

const PostModel = model('Post', postSchema);

module.exports = PostModel;
