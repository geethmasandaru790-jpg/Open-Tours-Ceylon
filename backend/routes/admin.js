const express = require('express');
const User = require('../models/User');
const Ad = require('../models/Ad');
const Driver = require('../models/Driver');
const Guide = require('../models/Guide');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

const router = express.Router();

// Every route below requires: valid JWT (requireAuth) AND
// req.user.email === PRIMARY_ADMIN_EMAIL (requireAdmin). Both middlewares
// re-check against the database/env on every request — nothing here trusts
// a role claim sent by the client.
router.use(requireAuth, requireAdmin);

router.get('/users', async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/suspend', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.isPrimaryAdmin()) return res.status(400).json({ error: 'Cannot suspend the Master Admin account.' });
    user.status = 'suspended';
    await user.save();
    res.json({ message: 'User suspended.', user });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/reactivate', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.status = 'active';
    await user.save();
    res.json({ message: 'User reactivated.', user });
  } catch (err) {
    next(err);
  }
});

router.get('/ads', async (req, res, next) => {
  try {
    const { status = 'pending_approval' } = req.query;
    const ads = await Ad.find({ status }).populate('ownerId', 'name email role').sort({ createdAt: -1 });
    res.json({ ads });
  } catch (err) {
    next(err);
  }
});

router.patch('/ads/:id/approve', async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', rejectionReason: undefined },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });
    res.json({ message: 'Ad approved.', ad });
  } catch (err) {
    next(err);
  }
});

router.patch('/ads/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || 'Did not meet listing standards.' },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });
    res.json({ message: 'Ad rejected.', ad });
  } catch (err) {
    next(err);
  }
});

router.patch('/drivers/:userId/approve', async (req, res, next) => {
  try {
    const driver = await Driver.findOneAndUpdate(
      { userId: req.params.userId },
      { isApproved: true, isVerified: true },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: 'Driver profile not found.' });
    res.json({ message: 'Driver approved.', driver });
  } catch (err) {
    next(err);
  }
});

router.patch('/guides/:userId/approve', async (req, res, next) => {
  try {
    const guide = await Guide.findOneAndUpdate(
      { userId: req.params.userId },
      { isApproved: true, isVerified: true },
      { new: true }
    );
    if (!guide) return res.status(404).json({ error: 'Guide profile not found.' });
    res.json({ message: 'Guide approved.', guide });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, pendingAds, activeDrivers, activeGuides] = await Promise.all([
      User.countDocuments(),
      Ad.countDocuments({ status: 'pending_approval' }),
      Driver.countDocuments({ isApproved: true }),
      Guide.countDocuments({ isApproved: true }),
    ]);
    res.json({ totalUsers, pendingAds, activeDrivers, activeGuides });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
