const { Schema, model } = require('mongoose');
const { UserRole, UserStatus } = require('../constants/enums');

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters'],
    },
    role: {
      type: Number,
      enum: Object.values(UserRole),
      required: [true, 'Role is required'],
    },
    status: {
      type: Number,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Ensure password is not included in JSON
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

const UserModel = model('User', userSchema);

module.exports = UserModel;
