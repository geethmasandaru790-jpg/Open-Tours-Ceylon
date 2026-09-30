// backend/models/AdminModerationLog.js
const mongoose = require('mongoose');

const adminModerationLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('AdminModerationLog', adminModerationLogSchema);
