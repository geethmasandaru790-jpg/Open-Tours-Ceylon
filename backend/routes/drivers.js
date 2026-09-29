const express = require('express');
const Driver = require('../models/Driver');
const Guide = require('../models/Guide');
const { requireAuth } = require('../middleware/auth');
const { requireRole, requireOwnerOrAdmin } = require('../middleware/rbac');

const router = express.Router();

/** Create or update the current driver's own profile (vehicle, seat layout, rate). */
router.put('/profile', requireAuth, requireRole('driver'), async (req, res, next) => {
  try {
    const {
      vehicleModel, vehicleType, hasAc, totalSeats, seatLayoutGrid,
      luggageCapacity, photos, dailyRate, licenseNumber, licensePhotoUrl,
    } = req.body;

    if (!vehicleModel || !totalSeats || !dailyRate || !licenseNumber) {
      return res.status(400).json({ error: 'vehicleModel, totalSeats, dailyRate and licenseNumber are required.' });
    }

    const update = {
      vehicleModel, vehicleType, hasAc: !!hasAc, totalSeats,
      seatLayoutGrid: Array.isArray(seatLayoutGrid) ? seatLayoutGrid : [],
      luggageCapacity, photos: Array.isArray(photos) ? photos.slice(0, 6) : [],
      dailyRate, licenseNumber, licensePhotoUrl,
      isApproved: false, // any profile change requires re-approval
    };

    const driver = await Driver.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update, $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true }
    );
    res.json({ driver: sanitizeDriver(driver) });
  } catch (err) {
    next(err);
  }
});

router.get('/profile/:userId', requireAuth, async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.params.userId });
    if (!driver) return res.status(404).json({ error: 'Driver profile not found.' });
    res.json({ driver: sanitizeDriver(driver) });
  } catch (err) {
    next(err);
  }
});

router.put('/guide-profile', requireAuth, requireRole('guide'), async (req, res, next) => {
  try {
    const { languages, specialties, yearsExperience, bio, dailyRate, licenseNumber, licensePhotoUrl } = req.body;
    if (!dailyRate || !licenseNumber) {
      return res.status(400).json({ error: 'dailyRate and licenseNumber are required.' });
    }

    const update = {
      languages: Array.isArray(languages) ? languages : [],
      specialties: Array.isArray(specialties) ? specialties : [],
      yearsExperience, bio, dailyRate, licenseNumber, licensePhotoUrl,
      isApproved: false,
    };

    const guide = await Guide.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update, $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true }
    );
    res.json({ guide: sanitizeGuide(guide) });
  } catch (err) {
    next(err);
  }
});

function sanitizeDriver(driver) {
  const obj = driver.toObject();
  delete obj.licenseNumber;
  delete obj.licensePhotoUrl;
  return obj;
}
function sanitizeGuide(guide) {
  const obj = guide.toObject();
  delete obj.licenseNumber;
  delete obj.licensePhotoUrl;
  return obj;
}

module.exports = router;
