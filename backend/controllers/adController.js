// backend/controllers/adController.js
const Ad = require('../models/Ad');

exports.createAd = async (req, res) => {
  const { title, destination, duration, description, price, vehicleModel, seatLayoutGrid, totalSeats, hasAc, luggageCapacity, photos } = req.body;
  if (!title || !destination || !duration || !description || !(price > 0)) {
    return res.status(400).json({ error: 'All fields are required to post an ad.' });
  }
  const ad = await Ad.create({
    ownerId: req.user._id, title, destination, duration, description, price,
    vehicleModel, seatLayoutGrid, totalSeats, hasAc, luggageCapacity,
    photos: Array.isArray(photos) ? photos.slice(0, 6) : [],
    status: 'pending_approval',
  });
  res.status(201).json({ ad });
};

exports.myAds = async (req, res) => {
  const ads = await Ad.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
  res.json({ ads });
};

exports.updateMyAd = async (req, res) => {
  const ad = await Ad.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  Object.assign(ad, req.body, { status: 'pending_approval', rejectionReason: undefined });
  await ad.save();
  res.json({ ad });
};

exports.deleteMyAd = async (req, res) => {
  const ad = await Ad.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  res.json({ ok: true });
};

exports.publicApprovedAds = async (req, res) => {
  const ads = await Ad.find({ status: 'approved' }).sort({ createdAt: -1 });
  res.json({ ads });
};
