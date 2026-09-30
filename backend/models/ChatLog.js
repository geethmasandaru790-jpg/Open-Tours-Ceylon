// backend/models/ChatLog.js
const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sessionId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ChatLog', chatLogSchema);
