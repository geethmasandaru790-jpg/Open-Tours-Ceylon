const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerRole: { type: String, enum: ['driver', 'guide'], required: true },

    title: { type: String, required: true, trim: true, maxlength: 100 },
    destination: { type: String, required: true, trim: true, maxlength: 60 },
    duration: { type: String, required: true, trim: true, maxlength: 40 },
    description: { type: String, required: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 1 },
    photos: { type: [String], default: [] },

    // Set to 'pending_approval' on creation. Only admin routes may move it to
    // 'approved' or 'rejected' — see routes/admin.js.
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected'],
      default: 'pending_approval',
      index: true,
    },
    rejectionReason: { type: String, maxlength: 300 },
    sponsored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', AdSchema);
