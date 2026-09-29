const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    adId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
    touristId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // driver/guide

    requestedDate: { type: Date, required: true },
    guests: { type: Number, min: 1, default: 1 },
    notes: { type: String, maxlength: 500 },

    status: {
      type: String,
      enum: ['requested', 'confirmed', 'cancelled', 'completed'],
      default: 'requested',
    },

    priceQuoted: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
