const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    vehicleModel: { type: String, required: true, trim: true, maxlength: 80 },
    vehicleType: { type: String, trim: true, maxlength: 40 }, // e.g. "KDH Van", "Safari Jeep", "Sedan", "Mini Bus"
    hasAc: { type: Boolean, default: true },
    totalSeats: { type: Number, required: true, min: 1, max: 60 },

    // 2D seat layout grid, e.g. rows x cols with each cell either a seat id, "aisle", or "empty".
    // Example: [["driver","aisle","seat-1"],["seat-2","seat-3","seat-4"]]
    seatLayoutGrid: { type: [[String]], default: [] },

    luggageCapacity: { type: String, trim: true, maxlength: 120 },
    photos: { type: [String], default: [] }, // Cloud storage URLs, not committed as base64 in prod

    dailyRate: { type: Number, required: true, min: 0 }, // USD

    licenseNumber: { type: String, required: true, trim: true, select: false }, // sensitive — admin/self only
    licensePhotoUrl: { type: String, select: false },

    isApproved: { type: Boolean, default: false }, // set true only by admin moderation
    isVerified: { type: Boolean, default: false }, // vehicle/license inspection passed

    inspection: {
      ac: { type: String, enum: ['ok', 'warn', 'na'], default: 'na' },
      safety: { type: String, enum: ['ok', 'warn'], default: 'warn' },
      maintenance: { type: String, enum: ['ok', 'warn'], default: 'warn' },
      inspectedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', DriverSchema);
