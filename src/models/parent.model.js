const { Schema, model } = require('mongoose');

const parentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [255, 'Full name cannot exceed 255 characters'],
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
parentSchema.index({ userId: 1 }, { unique: true });

const ParentModel = model('Parent', parentSchema);

module.exports = ParentModel;
