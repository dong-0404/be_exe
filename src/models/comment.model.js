const { Schema, model } = require('mongoose');
const { CommentStatus } = require('../constants/enums');

const commentSchema = new Schema(
    {
        postId: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: [true, 'Post ID is required'],
            index: true,
        },
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
            maxlength: [1000, 'Content cannot exceed 1000 characters'],
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
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
            index: true,
        },
        status: {
            type: Number,
            enum: Object.values(CommentStatus),
            default: CommentStatus.ACTIVE,
            index: true,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Compound Indexes for efficient queries
commentSchema.index({ postId: 1, createdAt: 1 }); // Get comments by post
commentSchema.index({ parentId: 1, createdAt: 1 }); // Get replies
commentSchema.index({ postId: 1, status: 1, createdAt: 1 }); // Active comments by post

const CommentModel = model('Comment', commentSchema);

module.exports = CommentModel;
