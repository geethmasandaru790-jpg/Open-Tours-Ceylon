// backend/models/Ad.js
const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  destination: { type: String, required: true },
  duration: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  vehicleModel: String,
  seatLayoutGrid: { type: mongoose.Schema.Types.Mixed, default: [] },
  totalSeats: Number,
  hasAc: Boolean,
  luggageCapacity: String,
  photos: [String],
  status: { type: String, enum: ['pending_approval', 'approved', 'rejected'], default: 'pending_approval' },
  rejectionReason: String,
}, { timestamps: true });

module.exports = mongoose.model('Ad', adSchema);
