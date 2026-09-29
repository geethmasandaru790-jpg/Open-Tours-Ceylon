const express = require('express');
const Ad = require('../models/Ad');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireRole, requireVerifiedAccount, requireOwnerOrAdmin } = require('../middleware/rbac');

const router = express.Router();

/** Public: anyone can browse approved ads. */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { destination, q } = req.query;
    const filter = { status: 'approved' };
    if (destination) filter.destination = destination;
    if (q) filter.title = { $regex: q, $options: 'i' };
    const ads = await Ad.find(filter).sort({ sponsored: -1, createdAt: -1 });
    res.json({ ads });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ads — create a new ad.
 * Gated by: authenticated + role driver/guide + isAccountVerified.
 * New ads always start at 'pending_approval' regardless of what the client sends.
 */
router.post(
  '/',
  requireAuth,
  requireRole('driver', 'guide'),
  requireVerifiedAccount,
  async (req, res, next) => {
    try {
      const { title, destination, duration, description, price, photos } = req.body;
      if (!title || !destination || !duration || !description || !price) {
        return res.status(400).json({ error: 'title, destination, duration, description and price are required.' });
      }

      const ad = await Ad.create({
        ownerId: req.user._id,
        ownerRole: req.user.role,
        title,
        destination,
        duration,
        description,
        price,
        photos: Array.isArray(photos) ? photos.slice(0, 6) : [],
        status: 'pending_approval', // always forced server-side, ignoring any client value
      });

      res.status(201).json({ ad, message: 'Ad submitted and is pending admin approval.' });
    } catch (err) {
      next(err);
    }
  }
);

/** A driver/guide can see their own ads including pending/rejected ones. */
router.get('/mine', requireAuth, requireRole('driver', 'guide'), async (req, res, next) => {
  try {
    const ads = await Ad.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ ads });
  } catch (err) {
    next(err);
  }
});

/** Owner (or admin) can edit their own ad. Editing resets it to pending_approval. */
router.patch(
  '/:id',
  requireAuth,
  requireOwnerOrAdmin(async (req) => {
    const ad = await Ad.findById(req.params.id);
    return ad ? ad.ownerId : null;
  }),
  async (req, res, next) => {
    try {
      const { title, destination, duration, description, price, photos } = req.body;
      const ad = await Ad.findById(req.params.id);
      if (!ad) return res.status(404).json({ error: 'Ad not found.' });

      if (title) ad.title = title;
      if (destination) ad.destination = destination;
      if (duration) ad.duration = duration;
      if (description) ad.description = description;
      if (price) ad.price = price;
      if (Array.isArray(photos)) ad.photos = photos.slice(0, 6);

      ad.status = 'pending_approval'; // any edit needs re-approval
      await ad.save();
      res.json({ ad });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  requireAuth,
  requireOwnerOrAdmin(async (req) => {
    const ad = await Ad.findById(req.params.id);
    return ad ? ad.ownerId : null;
  }),
  async (req, res, next) => {
    try {
      await Ad.findByIdAndDelete(req.params.id);
      res.json({ message: 'Ad deleted.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
