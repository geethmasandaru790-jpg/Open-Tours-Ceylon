// backend/controllers/adminController.js
const User = require('../models/User');
const Ad = require('../models/Ad');
const AdminModerationLog = require('../models/AdminModerationLog');

exports.stats = async (req, res) => {
  const [totalUsers, pendingAds, activeDrivers, activeGuides] = await Promise.all([
    User.countDocuments(),
    Ad.countDocuments({ status: 'pending_approval' }),
    User.countDocuments({ role: 'driver', status: 'active' }),
    User.countDocuments({ role: 'guide', status: 'active' }),
  ]);
  res.json({ totalUsers, pendingAds, activeDrivers, activeGuides });
};

exports.listAds = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const ads = await Ad.find(filter).populate('ownerId', 'name role email').sort({ createdAt: -1 });
  res.json({ ads });
};

exports.approveAd = async (req, res) => {
  const ad = await Ad.findByIdAndUpdate(req.params.id, { status: 'approved', rejectionReason: undefined }, { new: true });
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  await AdminModerationLog.create({ adminId: req.user._id, action: 'approve_ad', targetType: 'Ad', targetId: ad._id });
  res.json({ ad });
};

exports.rejectAd = async (req, res) => {
  const ad = await Ad.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionReason: req.body.reason || '' }, { new: true });
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  await AdminModerationLog.create({ adminId: req.user._id, action: 'reject_ad', targetType: 'Ad', targetId: ad._id, notes: req.body.reason });
  res.json({ ad });
};

exports.listUsers = async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json({ users });
};

exports.suspendUser = async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.isMasterAdmin) return res.status(400).json({ error: 'Cannot suspend the master admin' });
  target.status = 'suspended';
  await target.save();
  await AdminModerationLog.create({ adminId: req.user._id, action: 'suspend_user', targetType: 'User', targetId: target._id });
  res.json({ ok: true });
};

exports.reactivateUser = async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  target.status = 'active';
  await target.save();
  await AdminModerationLog.create({ adminId: req.user._id, action: 'reactivate_user', targetType: 'User', targetId: target._id });
  res.json({ ok: true });
};
