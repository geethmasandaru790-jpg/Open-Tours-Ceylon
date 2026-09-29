const mongoose = require('mongoose');

const GuideSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    languages: { type: [String], default: [] },
    specialties: { type: [String], default: [] }, // e.g. ["Wildlife", "Cultural Triangle", "Hiking"]
    yearsExperience: { type: Number, min: 0, default: 0 },
    bio: { type: String, maxlength: 800 },

    licenseNumber: { type: String, required: true, trim: true, select: false }, // tour guide license / NIC
    licensePhotoUrl: { type: String, select: false },

    dailyRate: { type: Number, required: true, min: 0 }, // USD

    isApproved: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Guide', GuideSchema);
