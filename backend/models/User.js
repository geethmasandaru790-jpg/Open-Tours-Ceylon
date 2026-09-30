// backend/models/User.js
const mongoose = require('mongoose');

const PRIMARY_ADMIN_EMAIL = 'tharushageethma@gmail.com';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
  socialId: { type: String, default: null },
  role: { type: String, enum: ['tourist', 'driver', 'guide', 'admin'], default: 'tourist' },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isAccountVerified: { type: Boolean, default: false },
  isMasterAdmin: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'pending' },
}, { timestamps: true });

userSchema.pre('save', function (next) {
  if (this.email && this.email.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
    this.role = 'admin';
    this.isMasterAdmin = true;
    this.isAccountVerified = true;
    this.isEmailVerified = true;
    this.status = 'active';
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
module.exports.PRIMARY_ADMIN_EMAIL = PRIMARY_ADMIN_EMAIL;
