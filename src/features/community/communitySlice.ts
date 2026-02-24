import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Post, PostFilters, Comment } from './types'
import {
  fetchPosts,
  fetchPostById,
  createPost,
  likePost,
  sharePost,
  deletePost,
  addComment,
  likeComment,
  deleteComment
} from './communityThunks'
import type { ApiError } from '../../api/errorHandler'

interface CommunityState {
  posts: Post[]
  currentPost: Post | null
  filters: PostFilters
  currentPage: number
  itemsPerPage: number
  totalPages: number
  totalItems: number
  loading: boolean
  loadingPost: boolean
  error: string | null
  useApi: boolean
}

const initialState: CommunityState = {
  posts: [],
  currentPost: null,
  filters: {},
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 1,
  totalItems: 0,
  loading: false,
  loadingPost: false,
  error: null,
  useApi: true // Use real API
}

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PostFilters>) => {
      state.filters = action.payload
      state.currentPage = 1
      state.error = null
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setUseApi: (state, action: PayloadAction<boolean>) => {
      state.useApi = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    clearCurrentPost: (state) => {
      state.currentPost = null
    }
  },
  extraReducers: (builder) => {
    // Fetch posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false
        // Ensure commentsCount is set for each post
        state.posts = action.payload.posts.map(post => ({
          ...post,
          commentsCount: post.commentsCount ?? post.comments?.length ?? 0
        }))
        state.totalItems = action.payload.total
        state.totalPages = action.payload.totalPages
        state.currentPage = action.payload.page
        state.itemsPerPage = action.payload.limit
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as ApiError)?.message || 'Không thể tải danh sách bài viết'
      })

    // Fetch post by ID
    builder
      .addCase(fetchPostById.pending, (state) => {
        state.loadingPost = true
        state.error = null
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.loadingPost = false
        // Ensure commentsCount is set
        state.currentPost = {
          ...action.payload,
          commentsCount: action.payload.commentsCount ?? action.payload.comments?.length ?? 0
        }
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.loadingPost = false
        state.error = (action.payload as ApiError)?.message || 'Không thể tải bài viết'
      })

    // Create post
    builder
      .addCase(createPost.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false
        // Add new post to the beginning of the list with commentsCount initialized
        const newPost = {
          ...action.payload,
          commentsCount: action.payload.commentsCount ?? 0
        }
        state.posts.unshift(newPost)
        state.totalItems += 1
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as ApiError)?.message || 'Không thể tạo bài viết'
      })

    // Like post
    builder
      .addCase(likePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p._id === action.payload._id)
        if (index !== -1) {
          // Merge to preserve comments if not returned by backend
          state.posts[index] = {
            ...state.posts[index],
            ...action.payload,
            comments: action.payload.comments || state.posts[index].comments
          }
        }
        if (state.currentPost?._id === action.payload._id) {
          // Merge to preserve comments if not returned by backend
          state.currentPost = {
            ...state.currentPost,
            ...action.payload,
            comments: action.payload.comments || state.currentPost.comments
          }
        }
      })
      .addCase(likePost.rejected, (state, action) => {
        state.error = (action.payload as ApiError)?.message || 'Không thể thích bài viết'
      })

    // Share post
    builder
      .addCase(sharePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p._id === action.payload._id)
        if (index !== -1) {
          // Merge to preserve comments if not returned by backend
          state.posts[index] = {
            ...state.posts[index],
            ...action.payload,
            comments: action.payload.comments || state.posts[index].comments
          }
        }
        if (state.currentPost?._id === action.payload._id) {
          // Merge to preserve comments if not returned by backend
          state.currentPost = {
            ...state.currentPost,
            ...action.payload,
            comments: action.payload.comments || state.currentPost.comments
          }
        }
      })
      .addCase(sharePost.rejected, (state, action) => {
        state.error = (action.payload as ApiError)?.message || 'Không thể chia sẻ bài viết'
      })

    // Delete post
    builder
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p._id !== action.payload)
        state.totalItems = Math.max(0, state.totalItems - 1)
        if (state.currentPost?._id === action.payload) {
          state.currentPost = null
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.error = (action.payload as ApiError)?.message || 'Không thể xóa bài viết'
      })

    // Add comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload
        const post = state.posts.find(p => p._id === postId)
        if (post) {
          if (!post.comments) {
            post.comments = []
          }
          if (comment.parentId) {
            // Add as reply - search recursively for parent comment
            addReplyToComment(post.comments, comment.parentId, comment)
          } else {
            // Add as top-level comment
            post.comments.push(comment)
          }
          // Update comments count
          if (post.commentsCount !== undefined) {
            post.commentsCount += 1
          }
        }
        if (state.currentPost?._id === postId) {
          if (!state.currentPost.comments) {
            state.currentPost.comments = []
          }
          if (comment.parentId) {
            addReplyToComment(state.currentPost.comments, comment.parentId, comment)
          } else {
            state.currentPost.comments.push(comment)
          }
          // Update comments count
          if (state.currentPost.commentsCount !== undefined) {
            state.currentPost.commentsCount += 1
          }
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.error = (action.payload as ApiError)?.message || 'Không thể thêm bình luận'
      })

    // Like comment
    builder
      .addCase(likeComment.fulfilled, (state, action) => {
        const { postId, commentId, comment } = action.payload
        const post = state.posts.find(p => p._id === postId)
        if (post) {
          updateCommentInPost(post, commentId, comment)
        }
        if (state.currentPost?._id === postId) {
          updateCommentInPost(state.currentPost, commentId, comment)
        }
      })
      .addCase(likeComment.rejected, (state, action) => {
        state.error = (action.payload as ApiError)?.message || 'Không thể thích bình luận'
      })

    // Delete comment
    builder
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload
        const post = state.posts.find(p => p._id === postId)
        if (post) {
          const removed = removeCommentFromPost(post, commentId)
          // Update comments count if comment was removed
          if (removed && post.commentsCount !== undefined && post.commentsCount > 0) {
            post.commentsCount -= 1
          }
        }
        if (state.currentPost?._id === postId) {
          const removed = removeCommentFromPost(state.currentPost, commentId)
          // Update comments count if comment was removed
          if (removed && state.currentPost.commentsCount !== undefined && state.currentPost.commentsCount > 0) {
            state.currentPost.commentsCount -= 1
          }
        }
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.error = (action.payload as ApiError)?.message || 'Không thể xóa bình luận'
      })
  }
})

// Helper function to add reply to a comment (recursive search)
function addReplyToComment(comments: Comment[], parentId: string, newReply: Comment): boolean {
  for (const comment of comments) {
    // Check if this is the parent comment
    if (comment._id === parentId) {
      if (!comment.replies) {
        comment.replies = []
      }
      comment.replies.push(newReply)
      return true
    }

    // Recursively search in replies
    if (comment.replies && comment.replies.length > 0) {
      if (addReplyToComment(comment.replies, parentId, newReply)) {
        return true
      }
    }
  }

  return false
}

// Helper function to update comment in post (handles nested comments recursively)
function updateCommentInPost(post: Post, commentId: string, updatedComment: Comment): boolean {
  if (!post.comments) return false

  return updateCommentRecursive(post.comments, commentId, updatedComment)
}

function updateCommentRecursive(comments: Comment[], commentId: string, updatedComment: Comment): boolean {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i]._id === commentId) {
      // Merge instead of replace to preserve replies if backend doesn't return them
      const existingReplies = comments[i].replies
      comments[i] = {
        ...comments[i],
        ...updatedComment,
        // Preserve replies if updatedComment doesn't have them
        replies: updatedComment.replies !== undefined ? updatedComment.replies : existingReplies
      }
      return true
    }

    // Recursively search in replies
    if (comments[i].replies && comments[i].replies!.length > 0) {
      if (updateCommentRecursive(comments[i].replies!, commentId, updatedComment)) {
        return true
      }
    }
  }

  return false
}

// Helper function to remove comment from post (handles nested comments recursively)
function removeCommentFromPost(post: Post, commentId: string): boolean {
  if (!post.comments) return false

  return removeCommentRecursive(post.comments, commentId)
}

function removeCommentRecursive(comments: Comment[], commentId: string): boolean {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i]._id === commentId) {
      comments.splice(i, 1)
      return true
    }

    // Recursively search in replies
    if (comments[i].replies && comments[i].replies!.length > 0) {
      if (removeCommentRecursive(comments[i].replies!, commentId)) {
        return true
      }
    }
  }

  return false
}

export const {
  setFilters,
  setCurrentPage,
  setUseApi,
  clearError,
  clearCurrentPost
} = communitySlice.actions

export default communitySlice.reducer
